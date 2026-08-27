-- ============================================================================
-- NÃO EXECUTADO AUTOMATICAMENTE. Cole este script no SQL Editor do painel do
-- Supabase e rode manualmente — o Claude não tem acesso à instância de produção
-- (sem CLI vinculado, sem credenciais locais) para rodar isso por você.
--
-- Adiciona os campos de cobrança/bloqueio na tabela `empresas`, necessários para
-- a integração de pagamento (Asaas) e o bloqueio de trial. Ver PROMPT B, Passo 2.
-- ============================================================================

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'trial'
    CHECK (plan_type IN ('trial', 'mensal', 'trimestral', 'semestral', 'anual', 'bloqueado')),
  ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS block_reason TEXT,
  ADD COLUMN IF NOT EXISTS cpf_cnpj_validated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cadastro_ip TEXT,
  ADD COLUMN IF NOT EXISTS ultimo_pagamento_at TIMESTAMPTZ;

-- Nota: removi o DEFAULT (NOW() + INTERVAL '14 days') do trial_ends_at do script
-- original — a coluna `trial_ends_at` já existe na tabela `empresas` (usada hoje
-- em Configuracoes.tsx/AdminPage.tsx) e já é preenchida explicitamente no cadastro
-- e pelo admin; adicionar um DEFAULT novo nela agora não tem efeito em linhas
-- existentes e é redundante para linhas novas, que já recebem o valor no insert.

CREATE INDEX IF NOT EXISTS idx_empresas_asaas_customer
  ON empresas(asaas_customer_id);
CREATE INDEX IF NOT EXISTS idx_empresas_plan_type
  ON empresas(plan_type);
CREATE INDEX IF NOT EXISTS idx_empresas_is_blocked
  ON empresas(is_blocked);
