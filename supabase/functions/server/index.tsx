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
  allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
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

// Health check
app.get("/make-server-eed79e88/health", (c) => c.json({ status: "ok" }));

// =========================================================
// POST /ai/aprimorar — Enhances report sections with Gemini
// Body: { projeto, secoes: [{ titulo, conteudo }] }
// Returns: { secoes: [{ titulo, conteudo }] }
// =========================================================
app.post("/make-server-eed79e88/ai/aprimorar", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) return c.json({ error: "GEMINI_API_KEY não configurada" }, 500);

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
    secoes: { titulo: string; conteudo: string }[];
  };

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
Não altere nenhum valor numérico.

Seções para aprimorar:
${JSON.stringify(secoes, null, 2)}

Retorne um JSON com o formato exato:
{
  "secoes": [
    { "titulo": "...", "conteudo": "texto aprimorado aqui..." },
    ...
  ]
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error('Gemini API error:', err);
    return c.json({ error: 'Erro ao chamar Gemini API' }, 500);
  }

  const geminiData = await response.json();
  const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) return c.json({ error: 'Resposta vazia do Gemini' }, 500);

  // Parse the JSON from Gemini's response
  const parsed = JSON.parse(rawText);
  return c.json({ secoes: parsed.secoes ?? secoes });
});

// =========================================================
// POST /ai/identificar-especie — Identifies a species by biome
// Body: { nome_comum, bioma }
// Returns: { nome_cientifico, familia, certeza }
// =========================================================
app.post("/make-server-eed79e88/ai/identificar-especie", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) return c.json({ error: "GEMINI_API_KEY não configurada" }, 500);

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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) return c.json({ error: 'Erro ao chamar Gemini API' }, 500);

  const geminiData = await response.json();
  const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return c.json({ error: 'Resposta vazia do Gemini' }, 500);

  return c.json(JSON.parse(rawText));
});

// =========================================================
// POST /ai/ajuda — Help chat with Gemini (RAG from help articles)
// Body: { question, page, articles: [{title, content}] }
// Returns: { answer }
// =========================================================
app.post("/make-server-eed79e88/ai/ajuda", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) return c.json({ error: "GEMINI_API_KEY não configurada" }, 500);

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

Responda de forma direta e útil em até 3 parágrafos. Se a pergunta for completamente fora do contexto da plataforma, oriente o usuário a entrar em contato com suporte@ambisafe.com.br.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!response.ok) return c.json({ error: 'Erro ao chamar Gemini API' }, 500);

  const geminiData = await response.json();
  const answer = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!answer) return c.json({ error: 'Resposta vazia do Gemini' }, 500);

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

Deno.serve(app.fetch);
