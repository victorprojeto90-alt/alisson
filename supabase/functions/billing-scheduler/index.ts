/* eslint-disable */
// @ts-nocheck
// Job agendado diário (pg_cron 'billing-scheduler-daily', 11:00 UTC).
// Autenticação: header x-cron-secret conferido contra private.app_secrets
// via RPC public.verificar_cron_secret (só service_role executa).
//   1. Alerta em billing_alerts para pagantes que vencem em até 10 dias.
//   2. Bloqueia pagantes vencidos sem pagamento confirmado.
//   3. Bloqueia trials expirados.
//   4. Envia os e-mails de cobrança/recuperação (Resend), registrados em billing_emails.
import { createClient } from 'npm:@supabase/supabase-js';
import { conteudoEmail, enviarEmail, type TipoEmail } from './emails.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const PLANOS_PAGOS = ['mensal', 'trimestral', 'semestral', 'anual'];

// Preços mantidos manualmente em sincronia com src/app/lib/planos.ts — Edge
// Functions (Deno) não compartilham módulos com o build do Vite/frontend, então
// não dá pra importar o array PLANOS diretamente sem duplicar/gerar o arquivo.
const PRECO_POR_PLANO: Record<string, number> = {
  mensal: 299.90,
  trimestral: 269.90,
  semestral: 249.90,
  anual: 229.90,
};

Deno.serve(async (req) => {
  // Chamado pelo pg_cron com o header x-cron-secret (guardado em private.app_secrets).
  const secret = req.headers.get('x-cron-secret') ?? '';
  const { data: autorizado } = await supabase.rpc('verificar_cron_secret', { p_secret: secret });
  if (!autorizado) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const agora = new Date();
  const em10Dias = new Date(agora.getTime() + 10 * 24 * 60 * 60 * 1000);

  // 1. Assinantes com vencimento nos próximos 10 dias — gera/atualiza alerta
  const { data: proximosVencimentos, error: errProximos } = await supabase
    .from('empresas')
    .select('id, name, plan_type, plan_expires_at')
    .in('plan_type', PLANOS_PAGOS)
    .eq('is_blocked', false)
    .lte('plan_expires_at', em10Dias.toISOString())
    .gte('plan_expires_at', agora.toISOString());

  if (errProximos) {
    return new Response(JSON.stringify({ error: errProximos.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let alertasGerados = 0;
  for (const empresa of proximosVencimentos ?? []) {
    const diasRestantes = Math.ceil(
      (new Date(empresa.plan_expires_at).getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
    );

    const { error: alertErr } = await supabase.from('billing_alerts').upsert({
      empresa_id: empresa.id,
      tipo: diasRestantes <= 3 ? 'vencimento_urgente' : 'vencimento_proximo',
      dias_restantes: diasRestantes,
      valor: PRECO_POR_PLANO[empresa.plan_type] ?? null,
    }, { onConflict: 'empresa_id' });

    if (!alertErr) {
      alertasGerados++;
      console.log(`Alerta gerado para empresa ${empresa.name} — vence em ${diasRestantes} dias`);
    } else {
      console.error(`Falha ao gerar alerta para ${empresa.name}:`, alertErr.message);
    }
  }

  // 2. Assinantes pagantes já vencidos e ainda não bloqueados — rede de segurança
  const { data: vencidas, error: errVencidas } = await supabase
    .from('empresas')
    .select('id, name')
    .in('plan_type', PLANOS_PAGOS)
    .eq('is_blocked', false)
    .lt('plan_expires_at', agora.toISOString());

  if (errVencidas) {
    return new Response(JSON.stringify({ error: errVencidas.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let bloqueadas = 0;
  for (const empresa of vencidas ?? []) {
    const { error: blockErr } = await supabase
      .from('empresas')
      .update({ is_blocked: true, block_reason: 'Pagamento não identificado após vencimento' })
      .eq('id', empresa.id);

    if (!blockErr) {
      bloqueadas++;
      console.log(`Empresa ${empresa.name} bloqueada por inadimplência`);
    } else {
      console.error(`Falha ao bloquear ${empresa.name}:`, blockErr.message);
    }
  }

  // 3. Trials expirados — o bloqueio agora é decidido no servidor, não no navegador.
  const { data: trialsVencidos, error: errTrials } = await supabase
    .from('empresas')
    .update({ is_blocked: true, block_reason: 'Trial expirado', plan_type: 'bloqueado' })
    .eq('plan_type', 'trial')
    .eq('is_blocked', false)
    .lt('trial_ends_at', agora.toISOString())
    .select('id, name');

  if (errTrials) {
    console.error('Falha ao bloquear trials expirados:', errTrials.message);
  }
  for (const e of trialsVencidos ?? []) {
    console.log(`Trial expirado — empresa ${e.name} bloqueada`);
  }

  // 4. E-mails de cobrança (só envia se RESEND_API_KEY estiver configurada)
  const emailsEnviados = await processarEmails(agora);

  return new Response(JSON.stringify({
    alertasGerados,
    bloqueadas,
    trialsBloqueados: trialsVencidos?.length ?? 0,
    emailsEnviados,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// ============================================================================
// E-mails de cobrança
// ============================================================================
const DIA = 24 * 60 * 60 * 1000;
const RECUPERACAO: { dias: number; tipo: TipoEmail }[] = [
  { dias: 60, tipo: 'recuperacao_60d' },
  { dias: 30, tipo: 'recuperacao_30d' },
  { dias: 15, tipo: 'recuperacao_15d' },
  { dias: 7, tipo: 'recuperacao_7d' },
  { dias: 3, tipo: 'recuperacao_3d' },
];

async function processarEmails(agora: Date): Promise<number> {
  if (!Deno.env.get('RESEND_API_KEY')) {
    console.log('E-mails de cobrança: RESEND_API_KEY não configurada — nada enviado.');
    return 0;
  }

  const { data: empresas, error } = await supabase
    .from('empresas')
    .select('id, name, owner_id, plan_type, trial_ends_at, plan_expires_at, is_blocked, block_reason');
  if (error) {
    console.error('E-mails: falha ao listar empresas:', error.message);
    return 0;
  }

  let enviados = 0;
  for (const e of empresas ?? []) {
    try {
      const diaDe = (iso: string | null) => (iso ? iso.slice(0, 10) : 'sem-data');
      const diasAte = (iso: string) => Math.ceil((new Date(iso).getTime() - agora.getTime()) / DIA);

      if (!e.is_blocked && e.plan_type === 'trial' && e.trial_ends_at) {
        const dias = diasAte(e.trial_ends_at);
        if (dias > 0 && dias <= 3 && await disparar(e, 'trial_3d', diaDe(e.trial_ends_at), { dias })) enviados++;
      }

      if (!e.is_blocked && PLANOS_PAGOS.includes(e.plan_type) && e.plan_expires_at) {
        const dias = diasAte(e.plan_expires_at);
        const valor = PRECO_POR_PLANO[e.plan_type] ?? null;
        if (dias >= 4 && dias <= 10 && await disparar(e, 'venc_10d', diaDe(e.plan_expires_at), { dias, valor })) enviados++;
        if (dias >= 1 && dias <= 3 && await disparar(e, 'venc_3d', diaDe(e.plan_expires_at), { dias, valor })) enviados++;
      }

      if (e.is_blocked) {
        const trial = e.block_reason === 'Trial expirado';
        const tipo: TipoEmail = trial ? 'trial_expirado' : 'bloqueio';
        const ref = trial ? diaDe(e.trial_ends_at) : diaDe(e.plan_expires_at);
        if (await disparar(e, tipo, ref)) enviados++;

        // Sequência de recuperação (até 60 dias), contada a partir do e-mail de bloqueio mais recente
        const { data: ancora } = await supabase
          .from('billing_emails')
          .select('id, created_at')
          .eq('empresa_id', e.id)
          .in('tipo', ['bloqueio', 'trial_expirado'])
          .eq('status', 'enviado')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (ancora) {
          const diasBloqueado = Math.floor((agora.getTime() - new Date(ancora.created_at).getTime()) / DIA);
          const etapa = RECUPERACAO.find((r) => diasBloqueado >= r.dias);
          if (etapa && await disparar(e, etapa.tipo, ancora.id)) enviados++;
        }
      }
    } catch (err) {
      console.error(`E-mails: erro na empresa ${e.name}:`, err);
    }
  }
  return enviados;
}

async function disparar(
  e: { id: string; name: string; owner_id: string },
  tipo: TipoEmail,
  referencia: string,
  extra: { dias?: number; valor?: number | null } = {},
): Promise<boolean> {
  const { data: existente } = await supabase
    .from('billing_emails')
    .select('id')
    .eq('empresa_id', e.id)
    .eq('tipo', tipo)
    .eq('referencia', referencia)
    .maybeSingle();
  if (existente) return false;

  const { data: dono } = await supabase.auth.admin.getUserById(e.owner_id);
  const email = dono?.user?.email;
  if (!email) return false;

  const resultado = await enviarEmail(email, conteudoEmail(tipo, e.name, extra));
  if (!resultado.ok) {
    // Não grava: tenta de novo na próxima execução.
    console.error(`E-mail ${tipo} para ${e.name} falhou:`, resultado.erro);
    return false;
  }

  await supabase.from('billing_emails').insert({ empresa_id: e.id, tipo, referencia, email, status: 'enviado' });
  console.log(`E-mail ${tipo} enviado para ${e.name}`);
  return true;
}
