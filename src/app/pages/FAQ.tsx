import { useState } from 'react';
import { Plus, Minus, Search, HelpCircle, MessageCircle } from 'lucide-react';
import { Input } from '../components/ui/input';
import { PageHeader, HeaderButton, HeaderStats } from '../components/layout/PageHeader';

const FAQS = [
  {
    q: 'Como funciona a identificação automática de espécies?',
    a: 'O AMBISAFE possui banco de dados integrado ao Inventário Florestal Nacional. Ao selecionar o Estado e digitar o nome popular, o sistema sugere nome científico, bioma e família botânica, corrigindo automaticamente erros de digitação e sinonímias.',
  },
  {
    q: 'Os cálculos estatísticos seguem as normas dos órgãos ambientais?',
    a: 'Sim. O sistema realiza cálculos de fitossociologia (Densidade, Dominância, Frequência, IVI) e diversidade (Shannon, Simpson, Pielou) seguindo a literatura clássica da engenharia florestal. Os relatórios são gerados em formatos aceitos por órgãos municipais, estaduais e federais.',
  },
  {
    q: 'Posso importar meus dados de uma planilha Excel que já tenho?',
    a: 'Sim. Você não precisa digitar árvore por árvore. Basta fazer upload do arquivo .csv ou .xlsx e a IA fará o mapeamento das colunas (DAP, Altura, Espécie) automaticamente.',
  },
  {
    q: 'O sistema funciona para quais tipos de inventário?',
    a: 'A plataforma atende Amostragem Casual Simples (parcelas alocadas aleatoriamente) e Inventário 100% - Censo Florestal (todos os indivíduos mensurados individualmente).',
  },
  {
    q: 'Meus dados estarão seguros e privados?',
    a: 'Sim. Os dados dos seus projetos são criptografados e pertencem exclusivamente a você. Não compartilhamos informações de áreas privadas ou coordenadas geográficas com terceiros.',
  },
  {
    q: 'O AMBISAFE gera o relatório técnico final em PDF/Word?',
    a: 'Sim. Além da planilha de cálculos, o sistema utiliza IA para redigir a estrutura do relatório (Metodologia e Resultados explicados), economizando horas de escrita.',
  },
  {
    q: 'Preciso instalar algum software?',
    a: 'Não. O AMBISAFE é 100% na nuvem (SaaS). Acesse do escritório pelo computador ou do campo via tablet/celular, com qualquer navegador e conexão à internet.',
  },
  {
    q: 'Como é feito o cálculo de suficiência amostral?',
    a: 'O AMBISAFE calcula automaticamente o erro de amostragem e o intervalo de confiança. Se a amostragem for insuficiente para atingir o erro máximo permitido pelo órgão ambiental (geralmente 10% ou 20%), o sistema emitirá alerta sugerindo inclusão de novas parcelas.',
  },
];

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-colors ${open ? 'border-[#00420d]/25' : 'border-gray-100'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 md:px-5 py-4 text-left gap-4 focus:outline-none hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-sm md:text-[15px] text-gray-900">{q}</span>
        <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${open ? 'bg-[#00420d] text-[#acd115]' : 'bg-gray-100 text-gray-500'}`}>
          {open ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </span>
      </button>
      <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: open ? '600px' : '0px' }}>
        <p className="px-4 md:px-5 pb-5 text-sm text-gray-600 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [busca, setBusca] = useState('');
  const termo = busca.trim().toLowerCase();
  const lista = FAQS.map((f, i) => ({ ...f, i })).filter(f => !termo || f.q.toLowerCase().includes(termo) || f.a.toLowerCase().includes(termo));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Perguntas frequentes"
        subtitle="Tudo o que você precisa saber sobre o AMBISAFE"
        actions={
          <HeaderButton onClick={() => window.dispatchEvent(new Event('ambisafe:ajuda'))} className="w-full md:w-auto">
            <HelpCircle className="w-5 h-5" /> Perguntar à IA
          </HeaderButton>
        }
      >
        <HeaderStats items={[{ label: 'Perguntas', value: FAQS.length, active: true }, { label: 'Suporte', value: 'WhatsApp' }]} className="md:max-w-sm" />
      </PageHeader>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-3">
          <div className="relative mb-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar uma dúvida..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-white border-gray-200"
            />
          </div>
          {lista.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-10">Nenhuma pergunta encontrada. Tente outra palavra ou pergunte à IA.</p>
          )}
          {lista.map(item => (
            <FaqItem
              key={item.i}
              q={item.q}
              a={item.a}
              open={openIdx === item.i || (!!termo && lista.length <= 3)}
              onToggle={() => setOpenIdx(openIdx === item.i ? null : item.i)}
            />
          ))}
        </div>

        <aside className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 md:p-6 lg:sticky lg:top-6">
          <div className="w-11 h-11 rounded-xl bg-[#00420d]/10 flex items-center justify-center mb-3">
            <MessageCircle className="w-5 h-5 text-[#00420d]" />
          </div>
          <p className="font-semibold text-gray-900">Ainda tem dúvidas?</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">Fale com nosso suporte pelo WhatsApp ou pergunte à IA da Central de Ajuda.</p>
          <a
            href="https://wa.me/5583991144456?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20o%20AMBISAFE."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-11 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 bg-[#00420d] hover:bg-[#0B3D2E] transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> Abrir WhatsApp
          </a>
        </aside>
      </div>
    </div>
  );
}
