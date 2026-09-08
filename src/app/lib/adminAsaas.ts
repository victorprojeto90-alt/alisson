// Cliente do proxy de pagamento para as rotas admin — mesma Edge Function e
// mesma convenção de src/app/lib/asaasProxy.ts (nunca fala com o Asaas direto,
// sempre via supabase/functions/asaas-proxy com o token do usuário logado).
// As rotas /admin/* dessa função exigem admin@ambisafe.com.br (ver requireAdmin
// em supabase/functions/asaas-proxy/index.ts).
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

export interface AsaasPayment {
  id: string;
  customer: string;
  value: number;
  status: string;
  dueDate: string;
  dateCreated: string;
  billingType: string;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  value: number;
  nextDueDate: string;
  status: string;
  cycle: string;
}

export const adminAsaas = {
  // Busca pagamentos, opcionalmente filtrados por período (dateCreated) e status.
  listarPagamentos(params: {
    dataInicio?: string;
    dataFim?: string;
    status?: 'RECEIVED' | 'PENDING' | 'OVERDUE' | 'REFUNDED';
  }) {
    const query = new URLSearchParams();
    if (params.dataInicio) query.set('dateCreated[ge]', params.dataInicio);
    if (params.dataFim) query.set('dateCreated[le]', params.dataFim);
    if (params.status) query.set('status', params.status);
    return authFetch<{ data: AsaasPayment[] }>(`/admin/payments?${query}`);
  },

  listarAssinaturas(status = 'ACTIVE') {
    return authFetch<{ data: AsaasSubscription[] }>(`/admin/subscriptions?status=${status}`);
  },

  reenviarCobranca(customerId: string, valor: number, descricao?: string) {
    return authFetch<AsaasPayment>('/admin/reenviar-cobranca', {
      method: 'POST',
      body: JSON.stringify({ customerId, valor, descricao }),
    });
  },
};
