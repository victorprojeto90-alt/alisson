// Cliente do proxy de pagamento — chama a Edge Function supabase/functions/asaas-proxy,
// nunca o Asaas diretamente. A ASAAS_API_KEY nunca entra no bundle do navegador; ela vive
// só como secret da Edge Function. Mesmo padrão de fetch autenticado já usado em
// ReportPreview.tsx (/ai/aprimorar) e ColumnMapper.tsx (/ai/identificar-especie).
import { supabase } from './supabase';
import { projectId } from '/utils/supabase/info';

const PROXY_URL = `https://${projectId}.supabase.co/functions/v1/asaas-proxy`;

async function authFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${PROXY_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? `Erro no pagamento (HTTP ${res.status})`);
  }
  return data as T;
}

export interface DadosClientePagamento {
  empresaId: string;
  nome: string;
  email: string;
  cpfCnpj?: string;
  telefone?: string;
  cidade?: string;
  uf?: string;
}

export function criarOuRecuperarCliente(dados: DadosClientePagamento) {
  return authFetch<{ customerId: string }>('/cliente', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export function criarAssinatura(
  empresaId: string,
  planoId: string,
  valor: number,
  billingType: 'PIX' | 'CREDIT_CARD'
) {
  return authFetch<{ subscriptionId: string }>('/assinatura', {
    method: 'POST',
    body: JSON.stringify({ empresaId, planoId, valor, billingType }),
  });
}

export interface PixQrCode {
  pendente: boolean;
  paymentId?: string;
  encodedImage?: string;
  payload?: string;
  expirationDate?: string;
}

export function buscarPixDaAssinatura(subscriptionId: string) {
  return authFetch<PixQrCode>(`/assinatura/${subscriptionId}/pix`);
}

export function buscarStatusAssinatura(subscriptionId: string) {
  return authFetch<{ ativo: boolean; planType: string | null; ultimoPagamentoAt: string | null }>(
    `/assinatura/${subscriptionId}/status`
  );
}

export function cancelarAssinatura(subscriptionId: string) {
  return authFetch<{ success: boolean }>(`/assinatura/${subscriptionId}/cancelar`, {
    method: 'POST',
  });
}

export interface PagamentoHistorico {
  id: string;
  value: number;
  dueDate: string;
  status: string;
}

export function buscarHistoricoPagamentos(subscriptionId: string) {
  return authFetch<{ payments: PagamentoHistorico[] }>(`/assinatura/${subscriptionId}/historico`);
}
