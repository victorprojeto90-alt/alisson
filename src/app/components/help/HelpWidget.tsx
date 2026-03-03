import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useLocation } from 'react-router';
import {
  MessageCircleQuestion, X, Send, ThumbsUp, ThumbsDown,
  Loader2, BookOpen, ArrowLeft, HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { projectId } from '/utils/supabase/info';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  pages: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  questionId?: string;
  feedbackSent?: boolean;
}

const PAGE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  'projetos/novo': 'Novo Inventário',
  'projetos/detalhe': 'Detalhes do Projeto',
  relatorios: 'Relatórios',
  configuracoes: 'Configurações',
  geral: 'Sistema',
};

function getPageKey(pathname: string): string {
  if (pathname === '/app/dashboard') return 'dashboard';
  if (pathname.includes('/projetos/novo')) return 'projetos/novo';
  if (pathname.includes('/projetos/')) return 'projetos/detalhe';
  if (pathname.includes('/relatorios')) return 'relatorios';
  if (pathname.includes('/configuracoes')) return 'configuracoes';
  return 'geral';
}

function matchArticles(articles: HelpArticle[], pageKey: string, question: string): HelpArticle[] {
  const lowerQ = question.toLowerCase();
  const keywords = lowerQ.split(/\s+/).filter(w => w.length > 3);

  const scored = articles.map(a => {
    let score = 0;
    if (a.pages.includes(pageKey)) score += 5;
    keywords.forEach(kw => {
      if (a.title.toLowerCase().includes(kw)) score += 3;
      if (a.content.toLowerCase().includes(kw)) score += 1;
    });
    return { article: a, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.article);
}

const EDGE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-eed79e88/ai/ajuda`;

export default function HelpWidget() {
  const { user, empresa } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const pageKey = getPageKey(location.pathname);
  const pageLabel = PAGE_LABELS[pageKey] ?? 'Sistema';

  useEffect(() => {
    supabase.from('help_articles').select('*').then(({ data }) => {
      if (data) setArticles(data);
    });
  }, []);

  useEffect(() => {
    if (open) {
      setSelectedArticle(null);
    }
  }, [location.pathname, open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const suggestedArticles = articles.filter(a => a.pages.includes(pageKey)).slice(0, 3);

  const sendQuestion = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    const relevantArticles = matchArticles(articles, pageKey, question);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          question,
          page: pageLabel,
          articles: relevantArticles.map(a => ({ title: a.title, content: a.content })),
        }),
      });

      const data = await res.json();
      const answer = data.answer ?? 'Não consegui processar sua pergunta. Tente novamente ou contate o suporte.';

      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);

      // Save to DB
      const { data: saved } = await supabase
        .from('help_questions')
        .insert({
          user_id: user?.id,
          empresa_id: empresa?.id ?? null,
          page: pageKey,
          question,
          answer,
        })
        .select('id')
        .single();

      if (saved?.id) {
        setMessages(prev =>
          prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, questionId: saved.id } : m
          )
        );
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Erro de conexão. Verifique sua internet e tente novamente.' },
      ]);
    }

    setLoading(false);
  };

  const sendFeedback = async (idx: number, questionId: string, helpful: boolean) => {
    await supabase.from('help_questions').update({ helpful }).eq('id', questionId);
    setMessages(prev =>
      prev.map((m, i) => i === idx ? { ...m, feedbackSent: true } : m)
    );
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  };

  const toggleOpen = () => {
    setOpen(prev => !prev);
    if (!open) setMessages([]);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-50 w-13 h-13 w-[52px] h-[52px] bg-[#16A34A] hover:bg-[#15803d] text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="Central de Ajuda"
        aria-label="Abrir ajuda"
      >
        {open
          ? <X className="w-5 h-5" />
          : <HelpCircle className="w-6 h-6" />
        }
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-[76px] right-6 z-50 w-[380px] max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: '540px' }}
        >
          {/* Header */}
          <div className="bg-[#0B3D2E] px-4 py-3 flex items-center gap-3 flex-shrink-0">
            {selectedArticle ? (
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-7 h-7 bg-[#16A34A] rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageCircleQuestion className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">
                {selectedArticle ? selectedArticle.title : 'Central de Ajuda'}
              </p>
              {!selectedArticle && (
                <p className="text-white/50 text-xs">
                  Página: {pageLabel}
                </p>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Article Detail View */}
          {selectedArticle ? (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="prose prose-sm max-w-none">
                <p className="text-xs text-gray-400 mb-3">{selectedArticle.category}</p>
                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedArticle.content}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Suggested Articles */}
              {suggestedArticles.length > 0 && messages.length === 0 && (
                <div className="flex-shrink-0 border-b border-gray-100">
                  <div className="px-4 py-2.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Artigos para esta tela
                    </p>
                    <div className="space-y-1">
                      {suggestedArticles.map(article => (
                        <button
                          key={article.id}
                          onClick={() => setSelectedArticle(article)}
                          className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <BookOpen className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                          <span className="text-sm text-gray-700 group-hover:text-[#0B3D2E] flex-1 truncate">
                            {article.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && suggestedArticles.length === 0 && (
                  <div className="text-center py-8">
                    <MessageCircleQuestion className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 mb-1">Tem alguma dúvida?</p>
                    <p className="text-xs text-gray-400">
                      Digite sua pergunta abaixo e a IA da AMBISAFE vai responder.
                    </p>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div key={idx}>
                    <div
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[#0B3D2E] text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                    {/* Feedback buttons for assistant messages */}
                    {msg.role === 'assistant' && msg.questionId && !msg.feedbackSent && (
                      <div className="flex items-center gap-1 mt-1 ml-1">
                        <span className="text-xs text-gray-400">Útil?</span>
                        <button
                          onClick={() => sendFeedback(idx, msg.questionId!, true)}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => sendFeedback(idx, msg.questionId!, false)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    {msg.feedbackSent && msg.role === 'assistant' && (
                      <p className="text-xs text-gray-400 ml-1 mt-1">Obrigado pelo feedback!</p>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#16A34A]" />
                      <span className="text-sm text-gray-500">Processando...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex-shrink-0 border-t border-gray-100 p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Faça sua pergunta..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]/20 transition-colors"
                    disabled={loading}
                  />
                  <button
                    onClick={sendQuestion}
                    disabled={!input.trim() || loading}
                    className="w-9 h-9 bg-[#16A34A] hover:bg-[#15803d] disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 text-center">
                  Powered by Gemini · AMBISAFE Support
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
