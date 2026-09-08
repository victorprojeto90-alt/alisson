import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { projectId } from '/utils/supabase/info';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    setLoading(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-eed79e88${endpoint}`;

      // Log temporário para diagnosticar falhas de exclusão/chamadas admin — remover
      // depois de confirmar que a Edge Function "server" foi redeployada com sucesso.
      console.log('[useApi] chamando:', options.method ?? 'GET', url);
      console.log('[useApi] token presente:', !!token, token ? token.slice(0, 20) + '…' : '(nenhum)');

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      console.log('[useApi] status da resposta:', response.status);
      const data = await response.json().catch(() => ({}));
      console.log('[useApi] corpo da resposta:', data);

      if (!response.ok) {
        throw new Error(data.error || `Erro na requisição (HTTP ${response.status})`);
      }

      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { apiCall, loading, error };
}
