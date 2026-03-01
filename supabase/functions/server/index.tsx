import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from 'npm:@supabase/supabase-js';

const app = new Hono();

// Supabase client with service role key
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-eed79e88/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign up endpoint
app.post("/make-server-eed79e88/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return c.json({ error: 'Email, senha e nome são obrigatórios' }, 400);
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured
      email_confirm: true
    });

    if (authError) {
      console.error('Auth error during signup:', authError);
      return c.json({ error: authError.message }, 400);
    }

    // Create empresa record in KV store
    const empresaId = crypto.randomUUID();
    const empresaData = {
      id: empresaId,
      nome: `Empresa de ${name}`,
      owner_id: authData.user.id,
      created_at: new Date().toISOString(),
      subscription_status: 'trial',
      trial_start: new Date().toISOString(),
      trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
    };

    await kv.set(`empresa:${empresaId}`, empresaData);
    await kv.set(`user:${authData.user.id}:empresa`, empresaId);

    return c.json({ 
      success: true, 
      message: 'Conta criada com sucesso! Faça login para continuar.',
      user: authData.user 
    });
  } catch (error: any) {
    console.error('Error during signup:', error);
    return c.json({ error: error.message || 'Erro ao criar conta' }, 500);
  }
});

// Get empresa data for authenticated user
app.get("/make-server-eed79e88/empresa", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get empresa ID for user
    const empresaId = await kv.get(`user:${user.id}:empresa`);
    
    if (!empresaId) {
      return c.json({ error: 'Empresa não encontrada' }, 404);
    }

    // Get empresa data
    const empresaData = await kv.get(`empresa:${empresaId}`);
    
    if (!empresaData) {
      return c.json({ error: 'Dados da empresa não encontrados' }, 404);
    }

    return c.json(empresaData);
  } catch (error: any) {
    console.error('Error fetching empresa:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get projects for empresa
app.get("/make-server-eed79e88/projects", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get empresa ID
    const empresaId = await kv.get(`user:${user.id}:empresa`);
    
    if (!empresaId) {
      return c.json({ error: 'Empresa não encontrada' }, 404);
    }

    // Get all projects for empresa
    const projects = await kv.getByPrefix(`project:${empresaId}:`);

    return c.json({ projects: projects || [] });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Create project
app.post("/make-server-eed79e88/projects", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const empresaId = await kv.get(`user:${user.id}:empresa`);
    
    if (!empresaId) {
      return c.json({ error: 'Empresa não encontrada' }, 404);
    }

    const body = await c.req.json();
    const { name, area, tipo_amostragem } = body;

    const projectId = crypto.randomUUID();
    const projectData = {
      id: projectId,
      empresa_id: empresaId,
      name,
      area,
      tipo_amostragem,
      created_at: new Date().toISOString(),
      created_by: user.id,
      status: 'criado',
    };

    await kv.set(`project:${empresaId}:${projectId}`, projectData);

    return c.json({ success: true, project: projectData });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Gemini AI endpoint for generating reports
app.post("/make-server-eed79e88/ai/generate-report", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { projectId, reportType } = body;

    // Note: In production, integrate with Google Gemini API
    // For now, return a simulated response
    const simulatedReport = {
      type: reportType,
      generated_at: new Date().toISOString(),
      content: `Relatório ${reportType === 'technical' ? 'Técnico' : 'Executivo'} gerado por IA.`,
      summary: 'Análise completa do inventário florestal com base nos dados fornecidos.',
    };

    // Log AI usage
    const empresaId = await kv.get(`user:${user.id}:empresa`);
    const usageKey = `ai_usage:${empresaId}:${new Date().toISOString().split('T')[0]}`;
    const currentUsage = await kv.get(usageKey) || 0;
    await kv.set(usageKey, currentUsage + 1);

    return c.json({ success: true, report: simulatedReport });
  } catch (error: any) {
    console.error('Error generating AI report:', error);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);