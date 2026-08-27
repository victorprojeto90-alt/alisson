/* eslint-disable */
// @ts-nocheck
// This file runs on Deno (Supabase Edge Functions) — TS errors from the local
// Node/browser checker are expected and can be safely ignored.
//
// Recebe eventos de pagamento do Asaas. IMPORTANTE: configure um "Token de acesso"
// na tela de Webhooks do painel Asaas e salve o MESMO valor como secret desta função
// (`supabase secrets set ASAAS_WEBHOOK_TOKEN=...`) — o Asaas reenvia esse token no
// header `asaas-access-token` em toda chamada, e nós conferimos abaixo. Sem essa
// checagem, qualquer pessoa poderia forjar um POST "PAYMENT_CONFIRMED" pra desbloquear
// a própria conta (ou a de terceiros) de graça.
import { createClient } from 'npm:@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const expectedToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
  const receivedToken = req.headers.get('asaas-access-token');
  if (!expectedToken || receivedToken !== expectedToken) {
    console.error('Asaas webhook: token inválido ou ASAAS_WEBHOOK_TOKEN não configurada');
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { event, payment, subscription } = payload ?? {};
  console.log('Asaas webhook recebido:', event);

  const customerId = payment?.customer ?? subscription?.customer;
  if (!customerId) {
    return new Response(JSON.stringify({ received: true, ignored: 'no customer' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: empresa } = await supabase
    .from('empresas')
    .select('id, plan_type')
    .eq('asaas_customer_id', customerId)
    .maybeSingle();

  if (!empresa) {
    console.warn('Asaas webhook: empresa não encontrada para customer', customerId);
    return new Response(JSON.stringify({ received: true, ignored: 'empresa not found' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  switch (event) {
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED':
      await supabase.from('empresas').update({
        is_blocked: false,
        block_reason: null,
        ultimo_pagamento_at: new Date().toISOString(),
        // +35 dias de margem sobre o ciclo mensal, dá tempo do próximo pagamento
        // processar antes de bloquear por atraso.
        plan_expires_at: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq('id', empresa.id);
      break;

    case 'PAYMENT_OVERDUE':
      // Só sinaliza — não bloqueia ainda, dá margem pro cliente regularizar.
      await supabase.from('empresas').update({
        block_reason: 'Pagamento em atraso',
      }).eq('id', empresa.id);
      break;

    case 'PAYMENT_DELETED':
    case 'SUBSCRIPTION_INACTIVATED':
      await supabase.from('empresas').update({
        is_blocked: true,
        block_reason: 'Assinatura cancelada',
        plan_type: 'bloqueado',
      }).eq('id', empresa.id);
      break;

    default:
      console.log('Asaas webhook: evento não tratado —', event);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
