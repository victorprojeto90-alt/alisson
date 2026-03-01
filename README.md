# AMBISAFE Geotecnologias

**Plataforma Nacional Inteligente de Gestão Florestal e Ambiental**

## 🌳 Visão Geral

AMBISAFE é uma plataforma SaaS completa para gestão de inventários florestais, combinando cálculos estatísticos avançados com inteligência artificial. A plataforma oferece uma solução superior ao modelo tradicional de inventário, com dashboard executivo e relatórios técnicos gerados automaticamente.

## ✨ Funcionalidades Principais

### 📊 Inventário Florestal Completo
- Suporte a múltiplos tipos de amostragem:
  - Amostragem Casual Simples
  - Estratificada
  - Dois Estágios
  - Conglomerado
  - Inventário 100%
- Upload inteligente de planilhas (CSV, XLSX)
- Detecção automática de colunas
- Validação de dados com IA

### 🧮 Cálculos Estatísticos
- Área basal: G = (π * D²) / 40000
- Volume individual: V = G * HT * FatorForma
- Volume por hectare
- Densidade (Nha)
- Índice de Valor de Importância (IVI)
- Diversidade de Shannon: H' = -Σ (pi * ln(pi))
- Erro amostral, Intervalo de confiança
- Desvio padrão, Média, Variância, Mediana

### 🎯 Score AMBISAFE
Sistema de pontuação proprietário (0-100) baseado em:
- 30% Regularidade Estatística
- 20% Diversidade
- 20% Sustentabilidade de Exploração
- 20% Conformidade Ambiental
- 10% Consistência de Dados

Classificação:
- 🟢 Verde (80-100): Excelente
- 🟡 Amarelo (50-79): Bom
- 🔴 Vermelho (0-49): Necessita Atenção

### 🤖 Integração com IA (Gemini)
- Relatórios técnicos automáticos
- Relatórios executivos simplificados
- Explicação de resultados estatísticos
- Detecção de anomalias
- Simulação de cenários
- Planos de manejo sugeridos
- Chat interno por projeto

### 📈 Dashboard Executivo
- Volume total e por hectare
- Valor estimado da floresta
- Índice de biodiversidade
- Score AMBISAFE
- Projeção de crescimento
- Simulação de manejo sustentável

### 👑 Painel Admin Supremo
Controle completo da plataforma:
- Métricas de negócio (MRR, Churn, Conversão)
- Gestão de empresas e usuários
- Consumo de IA por empresa
- Logs de auditoria
- Controle de assinaturas
- Notificações globais

### 🏢 Multi-tenant
- Isolamento completo de dados por empresa
- Controle de permissões (Admin, Engenheiro, Visualizador)
- Gestão de licenças ambientais
- Alertas automáticos

## 🎨 Design System

### Cores Principais
- **Verde Escuro (Primary)**: `#0B3D2E`
- **Verde Médio (Secondary)**: `#16A34A`
- **Verde Claro (Accent)**: `#10B981`
- **Branco**: `#FFFFFF`
- **Grafite**: Tons de cinza

### Tipografia
Interface limpa e tecnológica com hierarquia visual clara.

## 💰 Modelo de Negócio

### Plano Único
- **R$ 300/mês**
- Trial automático de 14 dias
- Sem cartão de crédito no trial
- Cancelamento automático após trial
- Usuários ilimitados
- Projetos ilimitados
- Todas as funcionalidades incluídas

## 🔐 Segurança

- Row Level Security (RLS) no Supabase
- Autenticação nativa do Supabase
- Criptografia de dados sensíveis
- Backup automático
- Rate limiting na API
- Logs permanentes de auditoria

## 📱 Responsividade

A plataforma é totalmente responsiva:
- **Desktop**: Interface completa com sidebar e dashboards expandidos
- **Mobile**: Dashboard simplificado, indicadores rápidos e alertas prioritários

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** com TypeScript
- **Tailwind CSS v4** para estilização
- **Lucide React** para ícones
- **Recharts** para gráficos
- **React Router** para navegação
- **XLSX & Papa Parse** para upload de planilhas

### Backend
- **Supabase**
  - PostgreSQL com PostGIS
  - Auth nativo
  - Row Level Security (RLS)
  - Edge Functions (Hono)
  - KV Store para dados

### IA
- **Google Gemini API** para análises e relatórios

### Pagamentos
- Stripe ou Mercado Pago (a implementar)

## 🚀 Como Usar

### Para Usuários

1. **Cadastro**: Acesse a landing page e clique em "Teste Grátis 14 Dias"
2. **Criar Projeto**: No dashboard, vá em "Projetos" > "Novo Projeto"
3. **Upload de Dados**: Envie sua planilha CSV ou XLSX com os dados do inventário
4. **Análise**: A IA detecta automaticamente as colunas e processa os dados
5. **Visualização**: Veja o Score AMBISAFE, indicadores e estatísticas
6. **Relatórios**: Gere relatórios técnicos e executivos com IA

### Estrutura de Planilha

Colunas esperadas:
- **DAP** ou **CAP**: Diâmetro à Altura do Peito / Circunferência
- **HT**: Altura Total
- **Parcela**: Identificador da parcela
- **Espécie**: Nome da espécie
- Outras colunas opcionais conforme necessário

## 📂 Estrutura do Projeto

```
/src
  /app
    /components
      /ui         # Componentes base (Button, Card, Input, etc)
      ProjectsModule.tsx
      ScoreAmbisafe.tsx
    /contexts
      AuthContext.tsx
    /hooks
      useApi.ts
    /lib
      supabase.ts
      utils.ts
    /pages
      LandingPage.tsx
      AuthPage.tsx
      Dashboard.tsx
    App.tsx
  /styles
    theme.css
    fonts.css
/supabase
  /functions
    /server
      index.tsx    # Edge Functions com Hono
      kv_store.tsx # KV Store utilities
```

## 🔑 Variáveis de Ambiente

Necessárias no Supabase Edge Functions:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

## 🌐 Endpoints da API

### Autenticação
- `POST /make-server-eed79e88/signup` - Criar conta
- Login via Supabase Auth diretamente

### Empresa
- `GET /make-server-eed79e88/empresa` - Dados da empresa do usuário

### Projetos
- `GET /make-server-eed79e88/projects` - Listar projetos
- `POST /make-server-eed79e88/projects` - Criar projeto

### IA
- `POST /make-server-eed79e88/ai/generate-report` - Gerar relatório com IA

## 📝 Próximos Passos

### Funcionalidades a Implementar
- [ ] Integração real com Google Gemini API
- [ ] Sistema de pagamentos (Stripe/Mercado Pago)
- [ ] Exportação de relatórios em PDF
- [ ] Gráficos interativos de análise
- [ ] Sistema de notificações por email
- [ ] Histórico de versões de projetos
- [ ] Colaboração em tempo real
- [ ] API pública para integrações
- [ ] App mobile nativo

### Melhorias Técnicas
- [ ] Testes automatizados (Jest, React Testing Library)
- [ ] CI/CD pipeline
- [ ] Monitoramento e analytics
- [ ] Otimização de performance
- [ ] Cache de dados frequentes
- [ ] Documentação da API com Swagger

## 🎓 Posicionamento

**AMBISAFE não é**: "Software de inventário"

**AMBISAFE é**: **Plataforma Nacional Inteligente de Gestão Florestal e Ambiental**

## 📞 Suporte

Para suporte técnico ou dúvidas, entre em contato através da plataforma.

---

**AMBISAFE Geotecnologias** - Transformando dados florestais em decisões estratégicas.
