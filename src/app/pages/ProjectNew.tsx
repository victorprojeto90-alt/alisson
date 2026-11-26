import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { PageHeader } from '../components/layout/PageHeader';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2, AlertTriangle, MapPin, Ruler, Settings2, ClipboardList, Lightbulb, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BIOMAS, ESTADOS, TIPOS_INVENTARIO, FINALIDADES, PARCELAS_SUGERIDAS, PRECISOES, CONFIANCAS,
  rotuloBioma, rotuloFinalidade, rotuloTipo,
} from '../components/project/camposInventario';
import { cn } from '../components/ui/utils';

interface FormData {
  nome: string;
  data_inventario: string;
  descricao: string;
  municipio: string;
  estado: string;
  bioma: string;
  area_total_ha: string;
  tipo_inventario: string;
  motivo_inventario: string;
  precisao_requerida: string;
  nivel_confianca: string;
  tamanho_parcela_m2: string;
  fator_forma: string;
}

const STEPS = [
  { label: 'Identificação', titulo: 'Onde é o inventário?', icon: MapPin },
  { label: 'Metodologia', titulo: 'Como e para que será feito?', icon: ClipboardList },
  { label: 'Parâmetros', titulo: 'Parâmetros dos cálculos', icon: Settings2 },
];

const DICAS = [
  'Use o nome da propriedade ou do empreendimento. A área total é usada para estimar o volume da área toda.',
  'A finalidade muda o texto do relatório: objetivo, conclusão e referências à legislação.',
  'Na dúvida, mantenha os padrões: parcela de 400 m² (20 × 20 m), fator de forma 0,70, 90% de confiança e 10% de precisão.',
];

const hoje = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function Campo({ label, obrigatorio, ajuda, children, className }: { label: string; obrigatorio?: boolean; ajuda?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-sm text-gray-700">{label}{obrigatorio && <span className="text-red-500"> *</span>}</Label>
      {children}
      {ajuda && <p className="text-[11px] text-gray-400">{ajuda}</p>}
    </div>
  );
}

function CartaoOpcao({ ativo, onClick, icon: Icon, titulo, desc }: { ativo: boolean; onClick: () => void; icon: typeof MapPin; titulo: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative text-left w-full rounded-2xl border-2 p-4 transition-all flex items-start gap-3',
        ativo ? 'border-[#16A34A] bg-[#f4f8f3] shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'
      )}
    >
      <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', ativo ? 'bg-[#00420d] text-[#acd115]' : 'bg-gray-100 text-gray-500')}>
        <Icon className="w-5 h-5" />
      </span>
      <span className="min-w-0 pr-5">
        <span className="block font-semibold text-gray-900 text-sm">{titulo}</span>
        <span className="block text-xs text-gray-500 mt-0.5">{desc}</span>
      </span>
      {ativo && <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#16A34A] text-white flex items-center justify-center"><Check className="w-3.5 h-3.5" /></span>}
    </button>
  );
}

const INPUT = 'h-12 rounded-xl bg-white';

export default function ProjectNew() {
  const navigate = useNavigate();
  const { empresa, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormData>({
    nome: '',
    data_inventario: hoje(),
    descricao: '',
    municipio: '',
    estado: '',
    bioma: '',
    area_total_ha: '',
    tipo_inventario: 'casual_simples',
    motivo_inventario: '',
    precisao_requerida: '10',
    nivel_confianca: '90',
    tamanho_parcela_m2: '400',
    fator_forma: '0,70',
  });

  const set = (field: keyof FormData, value: string) => setForm(prev => ({ ...prev, [field]: value }));
  const num = (v: string) => Number(v.replace(',', '.'));

  const validar = (s = step) => {
    if (s === 0) {
      if (!form.nome.trim()) { toast.error('Informe o nome do empreendimento.'); return false; }
      if (!form.area_total_ha || isNaN(num(form.area_total_ha)) || num(form.area_total_ha) <= 0) { toast.error('Informe a área total em hectares.'); return false; }
    }
    if (s === 1) {
      if (!form.tipo_inventario) { toast.error('Escolha o tipo de inventário.'); return false; }
      if (!form.motivo_inventario) { toast.error('Escolha a finalidade do inventário.'); return false; }
    }
    if (s === 2) {
      if (!(num(form.tamanho_parcela_m2) > 0)) { toast.error('Informe o tamanho da parcela.'); return false; }
      const ff = num(form.fator_forma);
      if (!(ff > 0 && ff <= 1)) { toast.error('O fator de forma deve ficar entre 0,1 e 1.'); return false; }
    }
    return true;
  };

  const avancar = () => { if (validar()) { setStep(s => Math.min(s + 1, STEPS.length - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
  const voltar = () => { if (step === 0) navigate('/app/projetos'); else { setStep(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
  const irPara = (i: number) => {
    if (i <= step) { setStep(i); return; }
    for (let s = step; s < i; s++) if (!validar(s)) { setStep(s); return; }
    setStep(i);
  };

  const criar = async () => {
    for (let s = 0; s < STEPS.length; s++) if (!validar(s)) { setStep(s); return; }
    if (!empresa?.id) { toast.error('Empresa não identificada.'); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('projetos')
      .insert({
        empresa_id: empresa.id,
        nome: form.nome.trim(),
        data_inventario: form.data_inventario || null,
        descricao: form.descricao.trim() || null,
        municipio: form.municipio.trim() || null,
        estado: form.estado || null,
        bioma: form.bioma || null,
        area_total_ha: num(form.area_total_ha),
        tipo_inventario: form.tipo_inventario,
        motivo_inventario: form.motivo_inventario,
        precisao_requerida: Number(form.precisao_requerida),
        nivel_confianca: Number(form.nivel_confianca),
        tamanho_parcela_m2: num(form.tamanho_parcela_m2),
        fator_forma: num(form.fator_forma),
        status: 'rascunho',
      })
      .select()
      .single();
    setLoading(false);
    if (error) { toast.error('Erro ao criar o inventário: ' + error.message); return; }
    toast.success('Inventário criado! Agora envie a planilha de campo.');
    navigate(`/app/projetos/${data.id}`);
  };

  if (!authLoading && !empresa) {
    return (
      <div className="p-4 md:p-8 max-w-lg mx-auto pt-16 text-center">
        <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-yellow-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Conta não configurada</h2>
        <p className="text-gray-500 text-sm mb-6">Sua conta ainda não está ligada a uma empresa. Saia e entre de novo; se continuar, fale com o suporte.</p>
        <Button onClick={() => navigate('/app/dashboard')} className="bg-[#00420d] hover:bg-[#0B5A1E] text-white">Ir para o início</Button>
      </div>
    );
  }

  const ultimo = step === STEPS.length - 1;
  const resumo: [string, string][] = [
    ['Empreendimento', form.nome.trim() || '—'],
    ['Local', form.municipio ? `${form.municipio}${form.estado ? '/' + form.estado : ''}` : form.estado || '—'],
    ['Bioma', rotuloBioma(form.bioma) || '—'],
    ['Área total', form.area_total_ha ? `${num(form.area_total_ha).toLocaleString('pt-BR')} ha` : '—'],
    ['Tipo', rotuloTipo(form.tipo_inventario) || '—'],
    ['Finalidade', rotuloFinalidade(form.motivo_inventario) || '—'],
    ['Parcela', form.tamanho_parcela_m2 ? `${num(form.tamanho_parcela_m2).toLocaleString('pt-BR')} m²` : '—'],
    ['Fator de forma', form.fator_forma ? num(form.fator_forma).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '—'],
    ['Confiança / precisão', `${form.nivel_confianca}% / ${form.precisao_requerida}%`],
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <PageHeader
        onBack={voltar}
        eyebrow="Novo inventário florestal"
        title={STEPS[step].titulo}
        subtitle={`Passo ${step + 1} de ${STEPS.length}`}
      >
        <div className="flex gap-2 md:max-w-2xl">
          {STEPS.map((s, i) => {
            const feito = i < step;
            const atual = i === step;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => irPara(i)}
                className={cn(
                  'rounded-2xl py-2.5 px-2 flex items-center justify-center gap-2 transition-all min-w-0 sm:flex-1',
                  atual ? 'flex-1' : 'w-14 shrink-0',
                  atual ? 'bg-white text-[#00420d] shadow-md' : feito ? 'bg-[#acd115]/25 text-white' : 'bg-white/10 text-white/70'
                )}
              >
                <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0', atual ? 'bg-[#00420d] text-white' : feito ? 'bg-[#acd115] text-[#00420d]' : 'bg-white/15')}>
                  {feito ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </span>
                <span className={cn('text-xs sm:text-sm font-semibold truncate', atual ? '' : 'hidden sm:inline')}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </PageHeader>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5 md:gap-6 items-start">
        <div className="space-y-5">
          {step === 0 && (
            <>
              <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 md:p-6 space-y-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-[#16A34A]" /> Identificação</h2>
                <Campo label="Nome do empreendimento" obrigatorio>
                  <Input className={INPUT} placeholder="Ex.: Fazenda Santa Helena" value={form.nome} onChange={e => set('nome', e.target.value)} />
                </Campo>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Campo label="Área total inventariada (ha)" obrigatorio ajuda="Use vírgula ou ponto para decimais.">
                    <Input className={INPUT} inputMode="decimal" placeholder="Ex.: 125,40" value={form.area_total_ha} onChange={e => set('area_total_ha', e.target.value)} />
                  </Campo>
                  <Campo label="Data do inventário">
                    <Input className={INPUT} type="date" value={form.data_inventario} onChange={e => set('data_inventario', e.target.value)} />
                  </Campo>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 md:p-6 space-y-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Ruler className="w-4 h-4 text-[#16A34A]" /> Localização</h2>
                <div className="grid grid-cols-[1fr_110px] gap-3">
                  <Campo label="Município">
                    <Input className={INPUT} placeholder="Ex.: Patos" value={form.municipio} onChange={e => set('municipio', e.target.value)} />
                  </Campo>
                  <Campo label="UF">
                    <Select value={form.estado} onValueChange={v => set('estado', v)}>
                      <SelectTrigger className={INPUT}><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>{ESTADOS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                    </Select>
                  </Campo>
                </div>
                <Campo label="Bioma">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BIOMAS.map(b => (
                      <button
                        key={b.value}
                        type="button"
                        onClick={() => set('bioma', form.bioma === b.value ? '' : b.value)}
                        className={cn('h-11 rounded-xl border text-sm font-medium transition-colors', form.bioma === b.value ? 'bg-[#00420d] text-white border-[#00420d]' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300')}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </Campo>
                <Campo label="Descrição / anotações" ajuda="Opcional. Fica só para consulta da equipe.">
                  <textarea
                    rows={3}
                    value={form.descricao}
                    onChange={e => set('descricao', e.target.value)}
                    placeholder="Ex.: parcelas distribuídas na faixa leste da propriedade..."
                    className="w-full rounded-xl border border-input bg-white px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/30 resize-none"
                  />
                </Campo>
              </section>
            </>
          )}

          {step === 1 && (
            <>
              <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 md:p-6 space-y-3">
                <h2 className="font-semibold text-gray-900">Finalidade <span className="text-red-500">*</span></h2>
                <p className="text-xs text-gray-500 -mt-2">Para que o inventário vai ser usado.</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {FINALIDADES.map(f => (
                    <CartaoOpcao key={f.value} ativo={form.motivo_inventario === f.value} onClick={() => set('motivo_inventario', f.value)} icon={f.icon} titulo={f.label} desc={f.desc} />
                  ))}
                </div>
              </section>
              <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 md:p-6 space-y-3">
                <h2 className="font-semibold text-gray-900">Tipo de inventário <span className="text-red-500">*</span></h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {TIPOS_INVENTARIO.map(t => (
                    <CartaoOpcao key={t.value} ativo={form.tipo_inventario === t.value} onClick={() => set('tipo_inventario', t.value)} icon={t.icon} titulo={t.label} desc={t.desc} />
                  ))}
                </div>
              </section>
            </>
          )}

          {step === 2 && (
            <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 md:p-6 space-y-5">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Settings2 className="w-4 h-4 text-[#16A34A]" /> Parâmetros técnicos</h2>
              <Campo label="Tamanho da parcela (m²)" obrigatorio ajuda="400 m² = parcela de 20 × 20 m.">
                <div className="flex flex-wrap gap-2 mb-2">
                  {PARCELAS_SUGERIDAS.map(p => (
                    <button key={p} type="button" onClick={() => set('tamanho_parcela_m2', String(p))}
                      className={cn('h-9 px-3 rounded-xl border text-sm font-medium', num(form.tamanho_parcela_m2) === p ? 'bg-[#00420d] text-white border-[#00420d]' : 'bg-white border-gray-200 text-gray-700')}>
                      {p.toLocaleString('pt-BR')} m²
                    </button>
                  ))}
                </div>
                <Input className={INPUT} inputMode="decimal" value={form.tamanho_parcela_m2} onChange={e => set('tamanho_parcela_m2', e.target.value)} />
              </Campo>
              <div className="grid sm:grid-cols-3 gap-4">
                <Campo label="Fator de forma (ff)" ajuda="Padrão: 0,70">
                  <Input className={INPUT} inputMode="decimal" value={form.fator_forma} onChange={e => set('fator_forma', e.target.value)} />
                </Campo>
                <Campo label="Nível de confiança">
                  <Select value={form.nivel_confianca} onValueChange={v => set('nivel_confianca', v)}>
                    <SelectTrigger className={INPUT}><SelectValue /></SelectTrigger>
                    <SelectContent>{CONFIANCAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Campo>
                <Campo label="Precisão requerida">
                  <Select value={form.precisao_requerida} onValueChange={v => set('precisao_requerida', v)}>
                    <SelectTrigger className={INPUT}><SelectValue /></SelectTrigger>
                    <SelectContent>{PRECISOES.map(p => <SelectItem key={p} value={p}>{p}%</SelectItem>)}</SelectContent>
                  </Select>
                </Campo>
              </div>
            </section>
          )}

          {/* Botões: no celular ficam presos acima da barra de baixo */}
          <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:static z-10 -mx-4 md:mx-0 px-4 md:px-0 py-3 md:py-0 bg-white/95 md:bg-transparent backdrop-blur md:backdrop-blur-none border-t border-gray-100 md:border-0 flex gap-3">
            <Button variant="outline" onClick={voltar} className="h-12 rounded-xl gap-2 px-5">
              <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Cancelar' : 'Voltar'}
            </Button>
            {!ultimo ? (
              <Button onClick={avancar} className="h-12 rounded-xl gap-2 flex-1 md:flex-none md:ml-auto md:px-8 bg-[#00420d] hover:bg-[#0B5A1E] text-white">
                Continuar <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={criar} disabled={loading} className="h-12 rounded-xl gap-2 flex-1 md:flex-none md:ml-auto md:px-8 bg-[#16A34A] hover:bg-[#15803d] text-white">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : <><CheckCircle2 className="w-4 h-4" /> Criar inventário</>}
              </Button>
            )}
          </div>
        </div>

        <aside className={cn('space-y-4 lg:sticky lg:top-6', ultimo ? '' : 'hidden lg:block')}>
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 md:p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Resumo do inventário</h3>
            <dl className="divide-y divide-gray-50 text-sm">
              {resumo.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-2">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className={cn('font-medium text-right truncate max-w-[60%]', v === '—' ? 'text-gray-300' : 'text-gray-900')}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-2xl bg-[#f4f8f3] p-4 flex gap-3">
            <Lightbulb className="w-5 h-5 text-[#16A34A] shrink-0" />
            <p className="text-xs text-gray-600 leading-relaxed">{DICAS[step]}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
