import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

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
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 focus:outline-none hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-sm" style={{ color: '#00420d' }}>{q}</span>
        <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border border-gray-200 bg-white">
          {open
            ? <Minus className="w-3.5 h-3.5 text-gray-500" />
            : <Plus className="w-3.5 h-3.5 text-gray-500" />
          }
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '500px' : '0px' }}
      >
        <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Perguntas Frequentes</h1>
        <p className="text-gray-400 text-sm mt-1">Tudo o que você precisa saber sobre o AMBISAFE</p>
      </div>

      <div className="space-y-3">
        {FAQS.map((item, i) => (
          <FaqItem
            key={i}
            q={item.q}
            a={item.a}
            open={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          />
        ))}
      </div>

      <div className="mt-10 bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
        <p className="text-gray-600 text-sm mb-1">Ainda tem dúvidas?</p>
        <p className="font-semibold text-gray-900 mb-3">Fale com nosso suporte via WhatsApp</p>
        <a
          href="https://wa.me/5583999999999"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors"
          style={{ backgroundColor: '#00420d' }}
        >
          Abrir WhatsApp
        </a>
      </div>
    </div>
  );
}
