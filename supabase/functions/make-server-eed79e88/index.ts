/* eslint-disable */
// @ts-nocheck
// This file runs on Deno (Supabase Edge Functions) — TS errors from the local
// Node/browser checker are expected and can be safely ignored.
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from 'npm:@supabase/supabase-js';

const app = new Hono();

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  maxAge: 600,
}));

// Auth helper
async function getUser(c: Parameters<Parameters<typeof app.post>[1]>[0]) {
  const token = c.req.header('Authorization')?.split(' ')[1];
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}


// =========================================================
// Chamada ao Gemini com novas tentativas e modelos reserva.
// O modelo principal às vezes responde 503 ("alta demanda"); nesses casos
// tentamos de novo e caímos para os modelos seguintes da lista.
// =========================================================
const MODELOS_GEMINI = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest', 'gemini-2.5-flash-lite'];
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function chamarGemini(apiKey: string, body: unknown): Promise<{ ok: true; texto: string; modelo: string } | { ok: false; status: number; motivo: string }> {
  let ultimoStatus = 0;
  let ultimoMotivo = '';
  const limite = Date.now() + 100000; // a função tem ~150 s no total
  for (const modelo of MODELOS_GEMINI) {
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      if (Date.now() > limite) return { ok: false, status: 504, motivo: 'tempo total esgotado' };
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) }
        );
        if (resp.ok) {
          const json = await resp.json();
          const texto = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
          if (texto.trim()) return { ok: true, texto, modelo };
          ultimoStatus = 502; ultimoMotivo = 'resposta vazia';
          break; // tenta o próximo modelo
        }
        ultimoStatus = resp.status;
        ultimoMotivo = (await resp.text()).slice(0, 300);
        console.error(`Gemini ${modelo} respondeu ${resp.status}: ${ultimoMotivo}`);
        if (resp.status === 404 || resp.status === 400) break; // modelo indisponível: próximo
        if (resp.status === 401 || resp.status === 403) return { ok: false, status: resp.status, motivo: 'chave do Gemini inválida' };
        await esperar(800 * (tentativa + 1)); // 429/500/503: espera e tenta de novo
      } catch (e) {
        ultimoStatus = 504;
        ultimoMotivo = e instanceof Error ? e.message : 'tempo esgotado';
        console.error(`Gemini ${modelo} falhou: ${ultimoMotivo}`);
      }
    }
  }
  return { ok: false, status: ultimoStatus || 503, motivo: ultimoMotivo };
}

// =========================================================
// Claude (Anthropic) — provedor principal da IA.
// Usa ANTHROPIC_API_KEY; se ela não existir, cai no Gemini acima.
// =========================================================
const MODELOS_CLAUDE = ['claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-haiku-4-5'];

type RespostaIA = { ok: true; texto: string; modelo: string } | { ok: false; status: number; motivo: string };

async function chamarClaude(apiKey: string, prompt: string, cfg: { temperatura: number; maxTokens: number; json?: boolean }): Promise<RespostaIA> {
  let ultimoStatus = 0;
  let ultimoMotivo = '';
  const limite = Date.now() + 100000;
  const system = cfg.json
    ? 'Responda somente com JSON válido, sem texto antes ou depois e sem blocos de código.'
    : undefined;
  for (const modelo of MODELOS_CLAUDE) {
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      if (Date.now() > limite) return { ok: false, status: 504, motivo: 'tempo total esgotado' };
      try {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: modelo,
            max_tokens: cfg.maxTokens,
            temperature: cfg.temperatura,
            ...(system ? { system } : {}),
            messages: [{ role: 'user', content: prompt }],
          }),
          signal: AbortSignal.timeout(45000),
        });
        if (resp.ok) {
          const json = await resp.json();
          const texto = (json?.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('');
          if (texto.trim()) return { ok: true, texto, modelo };
          ultimoStatus = 502; ultimoMotivo = 'resposta vazia';
          break;
        }
        ultimoStatus = resp.status;
        ultimoMotivo = (await resp.text()).slice(0, 300);
        console.error(`Claude ${modelo} respondeu ${resp.status}: ${ultimoMotivo}`);
        if (resp.status === 404 || resp.status === 400) break; // modelo indisponível: próximo
        if (resp.status === 401 || resp.status === 403) return { ok: false, status: resp.status, motivo: 'chave da Anthropic inválida ou sem crédito' };
        await esperar(1000 * (tentativa + 1)); // 429/500/529: espera e tenta de novo
      } catch (e) {
        ultimoStatus = 504;
        ultimoMotivo = e instanceof Error ? e.message : 'tempo esgotado';
        console.error(`Claude ${modelo} falhou: ${ultimoMotivo}`);
      }
    }
  }
  return { ok: false, status: ultimoStatus || 503, motivo: ultimoMotivo };
}

const temChaveIA = () => Boolean(Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('GEMINI_API_KEY'));

async function chamarIA(prompt: string, cfg: { temperatura: number; maxTokens: number; json?: boolean }): Promise<RespostaIA> {
  const chaveClaude = Deno.env.get('ANTHROPIC_API_KEY');
  if (chaveClaude) return chamarClaude(chaveClaude, prompt, cfg);
  const chaveGemini = Deno.env.get('GEMINI_API_KEY');
  if (!chaveGemini) return { ok: false, status: 500, motivo: 'nenhuma chave de IA configurada' };
  return chamarGemini(chaveGemini, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: cfg.temperatura, maxOutputTokens: cfg.maxTokens, ...(cfg.json ? { responseMimeType: 'application/json' } : {}) },
  });
}

// A IA às vezes devolve o JSON dentro de ```json ... ``` ou com texto em volta
const lerJson = (t: string) => {
  const limpo = t.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try { return JSON.parse(limpo); } catch {
    const i = Math.min(...['{', '['].map(c => { const k = limpo.indexOf(c); return k < 0 ? Infinity : k; }));
    const f = Math.max(limpo.lastIndexOf('}'), limpo.lastIndexOf(']'));
    return JSON.parse(limpo.slice(i, f + 1));
  }
};

const MSG_IA_OCUPADA = 'A IA está ocupada agora. Tente de novo em um minuto.';

// Health check
app.get("/make-server-eed79e88/health", (c) => c.json({ status: "ok" }));

// Diagnóstico interno da IA (protegido pela mesma senha do robô de cobrança)
app.post("/make-server-eed79e88/ai/diagnostico", async (c) => {
  const segredo = c.req.header('x-cron-secret') ?? '';
  const { data: valido } = await supabase.rpc('verificar_cron_secret', { p_secret: segredo });
  if (!valido) return c.json({ error: 'Forbidden' }, 403);
  if (!temChaveIA()) return c.json({ ok: false, motivo: 'nenhuma chave de IA configurada' });
  const inicio = Date.now();
  const ia = await chamarIA('Responda apenas: OK', { temperatura: 0, maxTokens: 64 });
  return c.json({ ...ia, ms: Date.now() - inicio, texto: ia.ok ? ia.texto.slice(0, 40) : undefined });
});

// =========================================================
// POST /ai/aprimorar — Enhances report sections with AI
// Body: { projeto, secoes: [{ titulo, conteudo }] }
// Returns: { secoes: [{ titulo, conteudo }] }
// =========================================================
app.post("/make-server-eed79e88/ai/aprimorar", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  if (!temChaveIA()) return c.json({ error: "Chave da IA não configurada" }, 500);

  const { projeto, secoes } = await c.req.json() as {
    projeto: {
      nome: string;
      municipio?: string;
      estado?: string;
      bioma?: string;
      area_total_ha: number;
      tipo_inventario: string;
      motivo_inventario: string;
    };
    secoes: { chave?: string; titulo: string; conteudo: string }[];
  };
  if (!Array.isArray(secoes) || secoes.length === 0 || secoes.length > 15) {
    return c.json({ error: 'Seções inválidas' }, 400);
  }

  const motivoLabel: Record<string, string> = {
    licenciamento: 'Licenciamento Ambiental',
    manejo: 'Manejo Florestal Sustentável',
    supressao: 'Supressão de Vegetação',
    academico: 'Pesquisa Acadêmica',
  };

  const systemPrompt = `Você é um engenheiro florestal sênior especialista em inventários florestais brasileiros.
Sua tarefa é aprimorar o texto técnico de relatórios de inventário florestal, tornando-o mais profissional,
detalhado e adequado para fins de ${motivoLabel[projeto.motivo_inventario] ?? projeto.motivo_inventario}.
Mantenha sempre a linguagem técnica em português brasileiro, use terminologia florestal correta e
preserve todas as informações numéricas originais sem alteração.
Responda SOMENTE em formato JSON válido, sem texto antes ou depois.`;

  const userPrompt = `Projeto: "${projeto.nome}"
Localização: ${projeto.municipio ?? 'N/I'}/${projeto.estado ?? 'N/I'} — Bioma: ${projeto.bioma ?? 'N/I'}
Área total: ${projeto.area_total_ha} ha
Tipo de inventário: ${projeto.tipo_inventario}
Finalidade: ${motivoLabel[projeto.motivo_inventario] ?? projeto.motivo_inventario}

Aprimore cada seção abaixo, tornando o texto mais técnico, detalhado e profissional.
Adicione informações contextuais relevantes sobre o bioma e metodologia quando pertinente.
Não altere nenhum valor numérico, nome de espécie ou unidade. Não invente dados que não estejam no texto.
Mantenha o campo "chave" e o "titulo" de cada seção exatamente como recebidos, na mesma ordem.
Separe parágrafos com uma linha em branco (\n\n). Não use markdown, listas ou negrito.

Seções para aprimorar:
${JSON.stringify(secoes, null, 2)}

Retorne um JSON com o formato exato:
{
  "secoes": [
    { "chave": "...", "titulo": "...", "conteudo": "texto aprimorado aqui..." },
    ...
  ]
}`;

  const ia = await chamarIA(systemPrompt + '\n\n' + userPrompt, { temperatura: 0.4, maxTokens: 8192, json: true });
  if (!ia.ok) return c.json({ error: MSG_IA_OCUPADA }, 503);
  const rawText = ia.texto;

  try {
    const parsed = lerJson(rawText);
    const vindas = Array.isArray(parsed?.secoes) ? parsed.secoes : [];
    // Devolve sempre as mesmas seções, na mesma ordem; o que a IA não devolver fica como estava
    const saida = secoes.map((orig, i) => {
      const nova = vindas.find((v) => v?.chave && v.chave === orig.chave) ?? (vindas.length === secoes.length ? vindas[i] : null);
      const conteudo = typeof nova?.conteudo === 'string' && nova.conteudo.trim().length > 20 ? nova.conteudo.trim() : orig.conteudo;
      return { chave: orig.chave, titulo: orig.titulo, conteudo };
    });
    return c.json({ secoes: saida });
  } catch {
    return c.json({ error: 'Resposta da IA em formato inválido' }, 502);
  }
});

// =========================================================
// POST /ai/identificar-especie — Identifies a species by biome
// Body: { nome_comum, bioma }
// Returns: { nome_cientifico, familia, certeza }
// =========================================================
app.post("/make-server-eed79e88/ai/identificar-especie", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  if (!temChaveIA()) return c.json({ error: "Chave da IA não configurada" }, 500);

  const { nome_comum, bioma } = await c.req.json() as { nome_comum: string; bioma?: string };

  const prompt = `Você é um botânico especialista na flora brasileira.
Identifique a espécie florestal com nome popular "${nome_comum}" no bioma ${bioma ?? 'brasileiro'}.

Retorne APENAS um JSON válido com o formato:
{
  "nome_cientifico": "Gênero espécie",
  "familia": "Família botânica",
  "certeza": "alta" | "media" | "baixa",
  "observacao": "nota opcional sobre a identificação"
}

Se não souber com certeza, retorne certeza "baixa" e uma sugestão.`;

  const ia = await chamarIA(prompt, { temperatura: 0.3, maxTokens: 2048, json: true });
  if (!ia.ok) return c.json({ error: MSG_IA_OCUPADA }, 503);
  const rawText = ia.texto;

  try {
    return c.json(lerJson(rawText));
  } catch {
    return c.json({ error: 'Resposta da IA em formato inválido' }, 502);
  }
});

// =========================================================
// POST /ai/ajuda — Help chat with AI (RAG from help articles)
// Body: { question, page, articles: [{title, content}] }
// Returns: { answer }
// =========================================================
app.post("/make-server-eed79e88/ai/ajuda", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  if (!temChaveIA()) return c.json({ error: "Chave da IA não configurada" }, 500);

  const { question, page, articles } = await c.req.json() as {
    question: string;
    page: string;
    articles: { title: string; content: string }[];
  };

  const context = articles.length > 0
    ? articles.map((a: { title: string; content: string }) => `## ${a.title}\n${a.content}`).join('\n\n')
    : 'Sem artigos específicos disponíveis para esta seção.';

  const prompt = `Você é o assistente de suporte da plataforma AMBISAFE Geotecnologias, um SaaS brasileiro para inventário florestal e gestão ambiental. Responda perguntas dos usuários de forma clara, objetiva e em português brasileiro. Use linguagem amigável mas profissional.

Base de conhecimento (use para embasar sua resposta):
${context}

Página atual do usuário: ${page}

Pergunta: ${question}

Responda de forma direta e útil em até 3 parágrafos. Se a pergunta for completamente fora do contexto da plataforma, oriente o usuário a falar com o suporte pelo WhatsApp (83) 99114-4456.`;

  const ia = await chamarIA(prompt, { temperatura: 0.3, maxTokens: 2048 });
  if (!ia.ok) return c.json({ error: MSG_IA_OCUPADA }, 503);
  const answer = ia.texto;

  return c.json({ answer });
});

// =========================================================
// ADMIN ENDPOINTS — requires admin@ambisafe.com.br email
// Uses service role key (bypasses RLS automatically)
// =========================================================

const ADMIN_EMAIL = 'admin@ambisafe.com.br';

async function requireAdmin(c: Parameters<Parameters<typeof app.get>[1]>[0]) {
  const user = await getUser(c);
  if (!user || user.email !== ADMIN_EMAIL) return null;
  return user;
}

// GET /admin/stats
app.get("/make-server-eed79e88/admin/stats", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden" }, 403);

  const [empresasRes, projetosRes, usersRes] = await Promise.all([
    supabase.from('empresas').select('*', { count: 'exact', head: true }),
    supabase.from('projetos').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ]);

  return c.json({
    totalEmpresas: empresasRes.count ?? 0,
    totalProjetos: projetosRes.count ?? 0,
    totalUsers: usersRes.count ?? 0,
  });
});

// GET /admin/empresas
app.get("/make-server-eed79e88/admin/empresas", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden" }, 403);

  const { data: empresas, error } = await supabase
    .from('empresas')
    .select('*, profiles(id, name, role), projetos(id)')
    .order('created_at', { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ empresas: empresas ?? [] });
});

// PATCH /admin/empresas/:id — update plan
app.patch("/make-server-eed79e88/admin/empresas/:id", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden" }, 403);

  const id = c.req.param('id');
  const body = await c.req.json() as { plan?: string; trial_ends_at?: string };

  const updateData: Record<string, string> = {};
  if (body.plan) updateData.plan = body.plan;
  if (body.trial_ends_at) updateData.trial_ends_at = body.trial_ends_at;

  const { error } = await supabase
    .from('empresas')
    .update(updateData)
    .eq('id', id);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

// =========================================================
// DELETE /admin/empresas/:id — exclui cliente permanentemente
// Remove projetos, profiles, a empresa e OS USUÁRIOS DE AUTENTICAÇÃO vinculados
// (via supabase.auth.admin.deleteUser, só possível com a service role key desta
// função). Só apagar as linhas do Postgres não bastaria: se a conta de auth
// continuasse existindo, o AuthContext auto-provisionaria empresa+profile de novo
// no próximo login, ressuscitando o "cliente fantasma" que o admin acabou de excluir.
// =========================================================
app.delete("/make-server-eed79e88/admin/empresas/:id", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden" }, 403);

  const empresaId = c.req.param('id');

  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('empresa_id', empresaId);
  if (profilesErr) return c.json({ error: profilesErr.message }, 500);

  const { error: projetosErr } = await supabase.from('projetos').delete().eq('empresa_id', empresaId);
  if (projetosErr) return c.json({ error: projetosErr.message }, 500);

  const { error: profilesDelErr } = await supabase.from('profiles').delete().eq('empresa_id', empresaId);
  if (profilesDelErr) return c.json({ error: profilesDelErr.message }, 500);

  const { error: empresaDelErr } = await supabase.from('empresas').delete().eq('id', empresaId);
  if (empresaDelErr) return c.json({ error: empresaDelErr.message }, 500);

  const falhasAuth: string[] = [];
  for (const p of profiles ?? []) {
    const { error } = await supabase.auth.admin.deleteUser(p.id);
    if (error) falhasAuth.push(p.id);
  }

  return c.json({
    success: true,
    usuariosRemovidos: (profiles?.length ?? 0) - falhasAuth.length,
    falhasAuth,
  });
});

Deno.serve(app.fetch);
