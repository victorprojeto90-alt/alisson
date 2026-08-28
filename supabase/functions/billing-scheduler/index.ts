/* eslint-disable */
// @ts-nocheck
// This file runs on Deno (Supabase Edge Functions) — TS errors from the local
// Node/browser checker are expected and can be safely ignored.
//
// Job agendado (NÃO roda sozinho): precisa de um cron externo chamando esta
// função periodicamente — via pg_cron + pg_net (SQL, ver comentário no final
// deste arquivo) ou pelo agendador de Edge Functions no painel do Supabase.
// Faz duas coisas:
//   1. Gera/atualiza um alerta em `billing_alerts` para assinantes pagantes
//      cujo `plan_expires_at` cai nos próximos 10 dias.
//   2. Bloqueia (`is_blocked = true`) assinantes pagantes cujo `plan_expires_at`
//      já passou e o Asaas não confirmou pagamento (nenhum webhook atualizou
//      isso antes) — rede de segurança, não o mecanismo principal de bloqueio
//      (que é o webhook PAYMENT_OVERDUE em supabase/functions/asaas-webhook).
import { createClient } from 'npm:@supabase/supabase-js';

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

Deno.serve(async (_req) => {
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

  return new Response(JSON.stringify({
    alertasGerados,
    bloqueadas,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// ============================================================================
// Como agendar (rodar manualmente no SQL Editor do Supabase, depois de fazer
// deploy desta função com `supabase functions deploy billing-scheduler`):
//
// select cron.schedule(
//   'billing-scheduler-diario',
//   '0 9 * * *', -- todo dia às 09:00 UTC
//   $$
//   select net.http_post(
//     url := 'https://<PROJECT_REF>.supabase.co/functions/v1/billing-scheduler',
//     headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>')
//   );
//   $$
// );
//
// Requer as extensões pg_cron e pg_net habilitadas no projeto (Database →
// Extensions no painel do Supabase).
// ============================================================================
