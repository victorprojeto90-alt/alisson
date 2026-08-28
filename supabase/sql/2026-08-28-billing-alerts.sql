-- ============================================================================
-- NÃO EXECUTADO AUTOMATICAMENTE. Cole este script no SQL Editor do painel do
-- Supabase e rode manualmente — sem CLI vinculado ao projeto do AMBISAFE nesta
-- máquina, não há como aplicar isso à instância de produção automaticamente.
--
-- Tabela de alertas de cobrança usada pela Edge Function billing-scheduler
-- (ver supabase/functions/billing-scheduler/index.ts). Cada empresa tem no
-- máximo 1 linha aqui (UNIQUE em empresa_id) — o job faz upsert, atualizando
-- dias_restantes a cada execução em vez de acumular histórico.
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  dias_restantes INTEGER,
  valor NUMERIC,
  email_enviado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_alerts_empresa
  ON billing_alerts(empresa_id);

ALTER TABLE billing_alerts ENABLE ROW LEVEL SECURITY;

-- Só o service role (usado pela Edge Function) escreve aqui. Leitura liberada
-- para admins autenticados, caso um painel queira consultar essa tabela
-- diretamente no futuro (hoje o Dashboard do AdminPage calcula os alertas de
-- trial/inadimplência direto de `empresas`, sem depender desta tabela).
DROP POLICY IF EXISTS billing_alerts_select_admin ON billing_alerts;
CREATE POLICY billing_alerts_select_admin
  ON billing_alerts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
