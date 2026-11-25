// @ts-nocheck
// E-mails de cobrança do AMBISAFE (enviados pelo Resend).
// Secrets necessários na função: RESEND_API_KEY e (opcional) EMAIL_FROM.
// Sem RESEND_API_KEY a função apenas registra no log e não envia nada.

const APP_URL = 'https://www.meuambisafe.com.br';
const PLANOS_URL = `${APP_URL}/app/configuracoes`;

export type TipoEmail =
  | 'trial_3d'
  | 'trial_expirado'
  | 'venc_10d'
  | 'venc_3d'
  | 'bloqueio'
  | 'recuperacao_3d'
  | 'recuperacao_7d'
  | 'recuperacao_15d'
  | 'recuperacao_30d'
  | 'recuperacao_60d';

interface Conteudo {
  assunto: string;
  titulo: string;
  texto: string;
  botao: string;
}

const brl = (v?: number | null) =>
  v == null ? '' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function conteudoEmail(tipo: TipoEmail, nome: string, extra: { dias?: number; valor?: number | null } = {}): Conteudo {
  const ola = `Olá, ${nome}!`;
  switch (tipo) {
    case 'trial_3d':
      return {
        assunto: `Seu teste do AMBISAFE termina em ${extra.dias} dia(s)`,
        titulo: 'Seu período de teste está acabando',
        texto: `${ola} Seu teste gratuito do AMBISAFE termina em ${extra.dias} dia(s). Assine um plano para continuar processando seus inventários florestais sem interrupção — seus projetos e dados continuam salvos.`,
        botao: 'Escolher meu plano',
      };
    case 'trial_expirado':
      return {
        assunto: 'Seu teste do AMBISAFE terminou',
        titulo: 'Seu teste gratuito terminou',
        texto: `${ola} O período de teste da sua conta terminou e o acesso foi pausado. Seus projetos continuam guardados com segurança — basta assinar um plano para voltar a usar na hora.`,
        botao: 'Reativar minha conta',
      };
    case 'venc_10d':
      return {
        assunto: 'Sua assinatura do AMBISAFE vence em breve',
        titulo: 'Lembrete de vencimento',
        texto: `${ola} Sua assinatura vence em ${extra.dias} dia(s)${extra.valor ? ` (valor: ${brl(extra.valor)})` : ''}. Se o pagamento já está programado, pode desconsiderar este aviso.`,
        botao: 'Ver minha assinatura',
      };
    case 'venc_3d':
      return {
        assunto: `Sua assinatura do AMBISAFE vence em ${extra.dias} dia(s)`,
        titulo: 'Vencimento próximo',
        texto: `${ola} Faltam ${extra.dias} dia(s) para o vencimento da sua assinatura${extra.valor ? ` (${brl(extra.valor)})` : ''}. Para não ter o acesso interrompido, confirme o pagamento até a data de vencimento.`,
        botao: 'Pagar agora',
      };
    case 'bloqueio':
      return {
        assunto: 'Acesso ao AMBISAFE pausado — pagamento não identificado',
        titulo: 'Seu acesso foi pausado',
        texto: `${ola} Não identificamos o pagamento da sua assinatura e o acesso à plataforma foi pausado. Seus projetos estão guardados. Assim que o pagamento for confirmado, o acesso volta automaticamente.`,
        botao: 'Regularizar pagamento',
      };
    case 'recuperacao_3d':
      return {
        assunto: 'Seus inventários estão esperando por você',
        titulo: 'Sentimos sua falta',
        texto: `${ola} Seus projetos no AMBISAFE continuam salvos. Regularize sua assinatura e volte a gerar relatórios técnicos em minutos.`,
        botao: 'Voltar ao AMBISAFE',
      };
    case 'recuperacao_7d':
      return {
        assunto: 'Precisa de ajuda com sua assinatura?',
        titulo: 'Podemos ajudar?',
        texto: `${ola} Se teve qualquer dificuldade com o pagamento, responda este e-mail ou fale com nosso suporte. Queremos você de volta processando seus inventários com a gente.`,
        botao: 'Reativar minha conta',
      };
    case 'recuperacao_15d':
      return {
        assunto: 'Sua conta AMBISAFE continua pausada',
        titulo: 'Sua conta continua pausada',
        texto: `${ola} Já são 15 dias com o acesso pausado. Reative quando quiser — todos os seus dados de campo e relatórios continuam disponíveis.`,
        botao: 'Reativar agora',
      };
    case 'recuperacao_30d':
      return {
        assunto: 'Último mês para reativar sua conta AMBISAFE',
        titulo: 'Não perca seus projetos',
        texto: `${ola} Sua conta está pausada há 30 dias. Reative sua assinatura para manter seu histórico de inventários e relatórios.`,
        botao: 'Manter minha conta',
      };
    case 'recuperacao_60d':
      return {
        assunto: 'Aviso final sobre sua conta AMBISAFE',
        titulo: 'Aviso final',
        texto: `${ola} Sua conta está pausada há 60 dias. Este é nosso último lembrete. Se quiser voltar, é só regularizar a assinatura — estaremos aqui.`,
        botao: 'Reativar minha conta',
      };
  }
}

export function htmlEmail(c: Conteudo): string {
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${c.assunto}</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#333;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <div style="background:#00420d;padding:28px 32px;text-align:center;">
        <span style="color:#ffffff;font-size:24px;font-weight:800;letter-spacing:1px;">AMBI<span style="color:#acd115;">SAFE</span></span>
      </div>
      <div style="padding:32px;">
        <h1 style="margin:0 0 16px;font-size:22px;color:#00420d;">${c.titulo}</h1>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.6;">${c.texto}</p>
        <div style="text-align:center;">
          <a href="${PLANOS_URL}" style="display:inline-block;background:#acd115;color:#00420d;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:8px;">${c.botao}</a>
        </div>
      </div>
      <div style="padding:20px 32px;background:#f8faf5;font-size:12px;color:#777;text-align:center;line-height:1.5;">
        AMBISAFE Consultoria e Assessoria Ambiental · Patos/PB<br>
        Você recebeu este e-mail porque tem uma conta na plataforma AMBISAFE.
      </div>
    </div>
  </div>
</body></html>`;
}

export async function enviarEmail(para: string, c: Conteudo): Promise<{ ok: boolean; erro?: string }> {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return { ok: false, erro: 'RESEND_API_KEY não configurada' };
  const from = Deno.env.get('EMAIL_FROM') ?? 'AMBISAFE <nao-responda@meuambisafe.com.br>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [para], subject: c.assunto, html: htmlEmail(c) }),
  });
  if (!res.ok) return { ok: false, erro: `Resend ${res.status}: ${(await res.text()).slice(0, 300)}` };
  return { ok: true };
}
