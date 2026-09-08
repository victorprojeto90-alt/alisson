import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { supabase } from '../../lib/supabase';
import { PLANOS } from '../../lib/planos';
import { toast } from 'sonner';

export interface EmpresaAdmin {
  id: string;
  name: string;
  plan: string;
  trial_ends_at: string | null;
  created_at: string;
  owner_id: string;
  telefone?: string | null;
  cnpj?: string | null;
  cidade?: string | null;
  estado_uf?: string | null;
  // Campos de cobrança (Asaas) — undefined até a migração SQL rodar.
  asaas_customer_id?: string | null;
  asaas_subscription_id?: string | null;
  plan_type?: string | null;
  is_blocked?: boolean | null;
  block_reason?: string | null;
  plan_expires_at?: string | null;
  ultimo_pagamento_at?: string | null;
  profiles: {
    id: string;
    name: string;
    role: string;
    tipo_usuario?: string;
    telefone?: string | null;
    cpf_cnpj?: string | null;
    cidade?: string | null;
    estado_uf?: string | null;
  }[];
  projetos: { id: string; status: string }[];
}

export const PLANOS_PAGOS = ['mensal', 'trimestral', 'semestral', 'anual'];
export const PLANO_POR_ID = Object.fromEntries(PLANOS.map(p => [p.id, p]));
export const CORES_PIZZA = ['#00420d', '#acd115', '#16a34a', '#65a30d', '#0d9488'];

export const cores = {
  verde: '#00420d',
  verdeClaro: '#acd115',
  fundo: '#f8f9fa',
  branco: '#ffffff',
  borda: '#e5e7eb',
  texto: '#111827',
  textoSecundario: '#6b7280',
  vermelho: '#dc2626',
  amarelo: '#d97706',
  azul: '#2563eb',
};

export const cardStyle: CSSProperties = {
  background: cores.branco,
  borderRadius: '12px',
  border: `1px solid ${cores.borda}`,
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

// Mascara CPF/CNPJ mantendo a pontuação original, só os últimos 2 dígitos visíveis.
export function maskCpfCnpj(v: string): string {
  const digitsOnly = v.replace(/\D/g, '');
  const total = digitsOnly.length;
  let seen = 0;
  return v.replace(/\d/g, () => {
    seen++;
    return seen > total - 2 ? digitsOnly[seen - 1] : '*';
  });
}

// Abre o WhatsApp com uma mensagem pré-formatada para a empresa. Não existe um
// "link de pagamento" persistido no banco (o PIX é gerado sob demanda pelo
// PlanoModal) — por isso a mensagem direciona o cliente para dentro do app em
// vez de tentar reenviar um link que não existe.
export function abrirWhatsApp(emp: EmpresaAdmin, mensagemExtra?: string) {
  const tel = (emp.telefone ?? emp.profiles?.[0]?.telefone ?? '').replace(/\D/g, '');
  if (!tel) {
    toast.error('Esta empresa não tem telefone cadastrado.');
    return;
  }
  const msg = encodeURIComponent(
    mensagemExtra ??
    `Olá! Aqui é da equipe AMBISAFE. Estamos entrando em contato sobre a conta de ${emp.name}. Para regularizar ou tirar dúvidas sobre o plano, acesse Configurações > Meu Plano e Pagamentos no app, ou responda por aqui.`
  );
  window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank');
}

export function baixarCSV(nomeArquivo: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers, ...rows]
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

export function emTrialAtivo(e: EmpresaAdmin): boolean {
  if (e.is_blocked) return false;
  if (e.plan_type) return e.plan_type === 'trial';
  return e.plan !== 'profissional'; // fallback pré-migração
}

// Dados compartilhados pelas 3 páginas admin — cada rota busca a lista de
// empresas de forma independente (elas vivem em componentes/rotas separados
// agora, não em abas de um único componente), mas reaproveitam a mesma query
// e o mesmo shape de dado através deste hook.
export function useEmpresasAdmin() {
  const [empresas, setEmpresas] = useState<EmpresaAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('empresas')
      .select('*, profiles(id, name, role, tipo_usuario, telefone, cpf_cnpj, cidade, estado_uf), projetos(id, status)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar dados. Execute o SQL de políticas admin no Supabase.');
      console.error(error);
    } else {
      setEmpresas(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { empresas, loading, reload: load };
}
