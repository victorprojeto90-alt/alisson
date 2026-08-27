/* eslint-disable */
// @ts-nocheck
// This file runs on Deno (Supabase Edge Functions) — TS errors from the local
// Node/browser checker are expected and can be safely ignored.
//
// Proxy server-side para a API do Asaas — a ASAAS_API_KEY nunca é exposta ao
// navegador (fica só como secret desta função: `supabase secrets set ASAAS_API_KEY=...`).
// O frontend chama estas rotas autenticado (Authorization: Bearer <token do usuário>);
// esta função é quem de fato conversa com o Asaas usando a chave de produção.
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from 'npm:@supabase/supabase-js';

const app = new Hono();

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const ASAAS_BASE_URL = Deno.env.get('ASAAS_BASE_URL') ?? 'https://api.asaas.com/v3';

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "OPTIONS"],
  maxAge: 600,
}));

// Auth helper — mesmo padrão do supabase/functions/server/index.tsx
async function getUser(c: Parameters<Parameters<typeof app.post>[1]>[0]) {
  const token = c.req.header('Authorization')?.split(' ')[1];
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// Confirma que o usuário autenticado pertence à empresa que ele está tentando
// operar — sem isso, qualquer usuário logado poderia criar/cancelar assinatura
// de QUALQUER empresa só sabendo o id dela.
async function getEmpresaDoUsuario(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('empresa_id')
    .eq('id', userId)
    .maybeSingle();
  return data?.empresa_id ?? null;
}

async function asaasFetch(endpoint: string, init: RequestInit = {}) {
  const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
  if (!ASAAS_API_KEY) throw new Error('ASAAS_API_KEY não configurada');

  const res = await fetch(`${ASAAS_BASE_URL}${endpoint}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY,
      ...(init.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.errors?.[0]?.description ?? `Asaas respondeu ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

app.get("/asaas-proxy/health", (c) => c.json({ status: "ok" }));

// =========================================================
// POST /asaas-proxy/cliente — cria ou recupera o cliente Asaas da empresa
// Body: { empresaId, nome, email, cpfCnpj?, telefone?, cidade?, uf? }
// Returns: { customerId }
// =========================================================
app.post("/asaas-proxy/cliente", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json() as {
    empresaId: string; nome: string; email: string;
    cpfCnpj?: string; telefone?: string; cidade?: string; uf?: string;
  };

  const empresaDoUsuario = await getEmpresaDoUsuario(user.id);
  if (!empresaDoUsuario || empresaDoUsuario !== body.empresaId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const { data: empresa, error: empresaErr } = await supabase
    .from('empresas')
    .select('asaas_customer_id')
    .eq('id', body.empresaId)
    .maybeSingle();
  if (empresaErr) return c.json({ error: empresaErr.message }, 500);

  // Já tem cliente no Asaas — reaproveita, não cria duplicado.
  if (empresa?.asaas_customer_id) {
    return c.json({ customerId: empresa.asaas_customer_id });
  }

  try {
    const customer = await asaasFetch('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: body.nome,
        email: body.email,
        cpfCnpj: body.cpfCnpj?.replace(/\D/g, '') || undefined,
        phone: body.telefone?.replace(/\D/g, '') || undefined,
        city: body.cidade || undefined,
        state: body.uf || undefined,
        externalReference: body.empresaId,
      }),
    });

    const { error: updateErr } = await supabase
      .from('empresas')
      .update({ asaas_customer_id: customer.id })
      .eq('id', body.empresaId);
    if (updateErr) return c.json({ error: updateErr.message }, 500);

    return c.json({ customerId: customer.id });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Erro ao criar cliente no Asaas' }, 500);
  }
});

// =========================================================
// POST /asaas-proxy/assinatura — cria assinatura recorrente
// Body: { empresaId, planoId, valor, billingType: 'PIX' | 'CREDIT_CARD' }
// Returns: { subscriptionId }
// =========================================================
app.post("/asaas-proxy/assinatura", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json() as {
    empresaId: string; planoId: string; valor: number;
    billingType: 'PIX' | 'CREDIT_CARD';
  };

  const empresaDoUsuario = await getEmpresaDoUsuario(user.id);
  if (!empresaDoUsuario || empresaDoUsuario !== body.empresaId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const { data: empresa, error: empresaErr } = await supabase
    .from('empresas')
    .select('asaas_customer_id')
    .eq('id', body.empresaId)
    .maybeSingle();
  if (empresaErr) return c.json({ error: empresaErr.message }, 500);
  if (!empresa?.asaas_customer_id) {
    return c.json({ error: "Empresa sem cliente Asaas — chame /asaas-proxy/cliente antes." }, 400);
  }

  const proximoVencimento = new Date();
  proximoVencimento.setDate(proximoVencimento.getDate() + 1);

  try {
    const subscription = await asaasFetch('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        customer: empresa.asaas_customer_id,
        billingType: body.billingType,
        value: body.valor,
        nextDueDate: proximoVencimento.toISOString().split('T')[0],
        cycle: 'MONTHLY',
        description: `AMBISAFE — Plano ${body.planoId}`,
        externalReference: body.planoId,
      }),
    });

    const { error: updateErr } = await supabase
      .from('empresas')
      .update({
        asaas_subscription_id: subscription.id,
        plan_type: body.planoId,
        plan_started_at: new Date().toISOString(),
      })
      .eq('id', body.empresaId);
    if (updateErr) return c.json({ error: updateErr.message }, 500);

    return c.json({ subscriptionId: subscription.id });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Erro ao criar assinatura no Asaas' }, 500);
  }
});

// =========================================================
// GET /asaas-proxy/assinatura/:id/pix — QR Code do pagamento PIX pendente
// Returns: { encodedImage, payload, expirationDate } ou { pendente: false }
// =========================================================
app.get("/asaas-proxy/assinatura/:id/pix", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const subscriptionId = c.req.param('id');
  const empresaDoUsuario = await getEmpresaDoUsuario(user.id);
  const { data: empresa } = await supabase
    .from('empresas')
    .select('id')
    .eq('id', empresaDoUsuario ?? '')
    .eq('asaas_subscription_id', subscriptionId)
    .maybeSingle();
  if (!empresa) return c.json({ error: "Forbidden" }, 403);

  try {
    const pagamentos = await asaasFetch(`/payments?subscription=${subscriptionId}&status=PENDING&limit=1`);
    const pagamento = pagamentos?.data?.[0];
    if (!pagamento) return c.json({ pendente: false });

    const qr = await asaasFetch(`/payments/${pagamento.id}/pixQrCode`);
    return c.json({
      pendente: true,
      paymentId: pagamento.id,
      encodedImage: qr.encodedImage,
      payload: qr.payload,
      expirationDate: qr.expirationDate,
    });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Erro ao buscar PIX' }, 500);
  }
});

// =========================================================
// GET /asaas-proxy/assinatura/:id/status — status atual da assinatura/pagamento
// =========================================================
app.get("/asaas-proxy/assinatura/:id/status", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const subscriptionId = c.req.param('id');
  const empresaDoUsuario = await getEmpresaDoUsuario(user.id);
  const { data: empresa } = await supabase
    .from('empresas')
    .select('id, is_blocked, plan_type, ultimo_pagamento_at')
    .eq('id', empresaDoUsuario ?? '')
    .eq('asaas_subscription_id', subscriptionId)
    .maybeSingle();
  if (!empresa) return c.json({ error: "Forbidden" }, 403);

  return c.json({
    ativo: !empresa.is_blocked,
    planType: empresa.plan_type,
    ultimoPagamentoAt: empresa.ultimo_pagamento_at,
  });
});

// =========================================================
// POST /asaas-proxy/assinatura/:id/cancelar
// =========================================================
app.post("/asaas-proxy/assinatura/:id/cancelar", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const subscriptionId = c.req.param('id');
  const empresaDoUsuario = await getEmpresaDoUsuario(user.id);
  const { data: empresa } = await supabase
    .from('empresas')
    .select('id')
    .eq('id', empresaDoUsuario ?? '')
    .eq('asaas_subscription_id', subscriptionId)
    .maybeSingle();
  if (!empresa) return c.json({ error: "Forbidden" }, 403);

  try {
    await asaasFetch(`/subscriptions/${subscriptionId}`, { method: 'DELETE' });
    // O bloqueio efetivo (is_blocked/plan_type) acontece via webhook quando o Asaas
    // confirma SUBSCRIPTION_INACTIVATED — aqui só registramos a intenção do usuário.
    await supabase
      .from('empresas')
      .update({ block_reason: 'Cancelamento solicitado pelo usuário' })
      .eq('id', empresa.id);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Erro ao cancelar assinatura' }, 500);
  }
});

Deno.serve(app.fetch);
