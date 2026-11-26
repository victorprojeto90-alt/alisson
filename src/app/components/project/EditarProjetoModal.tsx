import { useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertTriangle, Loader2, Save, X, MapPin, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { BIOMAS, ESTADOS, TIPOS_INVENTARIO, FINALIDADES, PRECISOES, CONFIANCAS } from './camposInventario';
import { cn } from '../ui/utils';

// Tudo o que pode ser corrigido depois de criado. Área, tipo, parcela, fator de forma
// e nível de confiança entram nos cálculos: se mudarem num inventário já processado,
// avisamos para reprocessar.
export interface ProjetoEditavel {
  id: string;
  nome: string;
  data_inventario: string | null;
  descricao: string | null;
  municipio: string | null;
  estado: string | null;
  bioma: string | null;
  area_total_ha: number | null;
  status: string;
  tipo_inventario?: string | null;
  motivo_inventario?: string | null;
  tamanho_parcela_m2?: number | null;
  fator_forma?: number | null;
  nivel_confianca?: number | null;
  precisao_requerida?: number | null;
}

interface Props {
  projeto: ProjetoEditavel;
  onClose: () => void;
  onSaved: (atualizado: ProjetoEditavel) => void;
  destacarFinalidade?: boolean;
}

const INPUT = 'h-11 rounded-xl';
const num = (v: string) => Number(String(v).replace(',', '.'));
const br = (v: number | null | undefined, padrao: number) => String(v ?? padrao).replace('.', ',');

function Campo({ label, children, className, obrigatorio }: { label: string; children: ReactNode; className?: string; obrigatorio?: boolean }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-sm text-gray-700">{label}{obrigatorio && <span className="text-red-500"> *</span>}</Label>
      {children}
    </div>
  );
}

export default function EditarProjetoModal({ projeto, onClose, onSaved, destacarFinalidade }: Props) {
  const [nome, setNome] = useState(projeto.nome);
  const [dataInventario, setDataInventario] = useState(projeto.data_inventario ?? '');
  const [descricao, setDescricao] = useState(projeto.descricao ?? '');
  const [municipio, setMunicipio] = useState(projeto.municipio ?? '');
  const [estado, setEstado] = useState(projeto.estado ?? '');
  const [bioma, setBioma] = useState(projeto.bioma ?? '');
  const [area, setArea] = useState(projeto.area_total_ha != null ? br(projeto.area_total_ha, 0) : '');
  const [motivo, setMotivo] = useState(projeto.motivo_inventario ?? '');
  const [tipo, setTipo] = useState(projeto.tipo_inventario ?? 'casual_simples');
  const [parcela, setParcela] = useState(br(projeto.tamanho_parcela_m2, 400));
  const [ff, setFf] = useState(Number(projeto.fator_forma ?? 0.7).toFixed(2).replace('.', ','));
  const [confianca, setConfianca] = useState(String(projeto.nivel_confianca ?? 90));
  const [precisao, setPrecisao] = useState(String(projeto.precisao_requerida ?? 10));
  const [saving, setSaving] = useState(false);
  const refFinalidade = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (destacarFinalidade) setTimeout(() => refFinalidade.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
  }, [destacarFinalidade]);

  const jaProcessado = projeto.status === 'processado' || projeto.status === 'finalizado';
  const mudouCalculo =
    num(area) !== Number(projeto.area_total_ha) ||
    tipo !== (projeto.tipo_inventario ?? 'casual_simples') ||
    num(parcela) !== Number(projeto.tamanho_parcela_m2 ?? 400) ||
    num(ff) !== Number(projeto.fator_forma ?? 0.7) ||
    Number(confianca) !== Number(projeto.nivel_confianca ?? 90);
  const avisoRecalculo = jaProcessado && mudouCalculo;

  const salvar = async () => {
    if (!nome.trim()) { toast.error('Informe o nome do empreendimento.'); return; }
    if (!(num(area) > 0)) { toast.error('Informe a área total em hectares.'); return; }
    if (!motivo) { toast.error('Escolha a finalidade do inventário.'); return; }
    if (!(num(parcela) > 0)) { toast.error('Informe o tamanho da parcela.'); return; }
    if (!(num(ff) > 0 && num(ff) <= 1)) { toast.error('O fator de forma deve ficar entre 0,1 e 1.'); return; }

    setSaving(true);
    const { data, error } = await supabase
      .from('projetos')
      .update({
        nome: nome.trim(),
        data_inventario: dataInventario || null,
        descricao: descricao.trim() || null,
        municipio: municipio.trim() || null,
        estado: estado || null,
        bioma: bioma || null,
        area_total_ha: num(area),
        motivo_inventario: motivo,
        tipo_inventario: tipo,
        tamanho_parcela_m2: num(parcela),
        fator_forma: num(ff),
        nivel_confianca: Number(confianca),
        precisao_requerida: Number(precisao),
      })
      .eq('id', projeto.id)
      .select()
      .single();
    setSaving(false);
    if (error) { toast.error('Erro ao salvar: ' + error.message); return; }
    toast.success(avisoRecalculo ? 'Inventário atualizado. Reprocesse para atualizar os resultados.' : 'Inventário atualizado!');
    onSaved(data as ProjetoEditavel);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !saving && onClose()} />
      <div className="relative bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[92vh] flex flex-col pb-[env(safe-area-inset-bottom)]">
        <div className="bg-gradient-to-br from-[#00420d] via-[#0B5A1E] to-[#16A34A] text-white px-6 pt-5 pb-4 rounded-t-3xl flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <p className="text-white/70 text-xs">Editar inventário</p>
            <h3 className="text-lg font-bold leading-tight truncate">{projeto.nome}</h3>
          </div>
          <button onClick={() => !saving && onClose()} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0" aria-label="Fechar"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto px-5 md:px-6 py-5 space-y-6">
          <section className="space-y-4">
            <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-[#16A34A]" /> Identificação</h4>
            <Campo label="Nome do empreendimento" obrigatorio><Input className={INPUT} value={nome} onChange={e => setNome(e.target.value)} /></Campo>
            <div className="grid sm:grid-cols-2 gap-4">
              <Campo label="Área total (ha)" obrigatorio><Input className={INPUT} inputMode="decimal" value={area} onChange={e => setArea(e.target.value)} /></Campo>
              <Campo label="Data do inventário"><Input className={INPUT} type="date" value={dataInventario} onChange={e => setDataInventario(e.target.value)} /></Campo>
            </div>
            <div className="grid grid-cols-[1fr_100px] gap-3">
              <Campo label="Município"><Input className={INPUT} value={municipio} onChange={e => setMunicipio(e.target.value)} /></Campo>
              <Campo label="UF">
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger className={INPUT}><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>{ESTADOS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                </Select>
              </Campo>
            </div>
            <Campo label="Bioma">
              <Select value={bioma} onValueChange={setBioma}>
                <SelectTrigger className={INPUT}><SelectValue placeholder="Selecione o bioma" /></SelectTrigger>
                <SelectContent>{BIOMAS.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
              </Select>
            </Campo>
            <Campo label="Descrição / anotações">
              <textarea rows={2} value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full rounded-xl border border-input bg-white px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/30 resize-none" />
            </Campo>
          </section>

          <section className="space-y-4">
            <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2"><Settings2 className="w-4 h-4 text-[#16A34A]" /> Metodologia e parâmetros</h4>
            <div ref={refFinalidade} className={cn('rounded-2xl', destacarFinalidade && !motivo ? 'ring-2 ring-amber-300 p-3 -m-1' : '')}>
              <Campo label="Finalidade" obrigatorio>
                <div className="grid grid-cols-2 gap-2">
                  {FINALIDADES.map(f => (
                    <button key={f.value} type="button" onClick={() => setMotivo(f.value)}
                      className={cn('min-h-11 px-3 py-2 rounded-xl border text-sm font-medium text-left flex items-center gap-2', motivo === f.value ? 'bg-[#00420d] text-white border-[#00420d]' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300')}>
                      <f.icon className="w-4 h-4 shrink-0" /> {f.label}
                    </button>
                  ))}
                </div>
              </Campo>
            </div>
            <Campo label="Tipo de inventário">
              <div className="grid grid-cols-2 gap-2">
                {TIPOS_INVENTARIO.map(t => (
                  <button key={t.value} type="button" onClick={() => setTipo(t.value)}
                    className={cn('min-h-11 px-3 py-2 rounded-xl border text-sm font-medium text-left flex items-center gap-2', tipo === t.value ? 'bg-[#00420d] text-white border-[#00420d]' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300')}>
                    <t.icon className="w-4 h-4 shrink-0" /> {t.label}
                  </button>
                ))}
              </div>
            </Campo>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Campo label="Parcela (m²)"><Input className={INPUT} inputMode="decimal" value={parcela} onChange={e => setParcela(e.target.value)} /></Campo>
              <Campo label="Fator de forma"><Input className={INPUT} inputMode="decimal" value={ff} onChange={e => setFf(e.target.value)} /></Campo>
              <Campo label="Confiança">
                <Select value={confianca} onValueChange={setConfianca}>
                  <SelectTrigger className={INPUT}><SelectValue /></SelectTrigger>
                  <SelectContent>{CONFIANCAS.map(c => <SelectItem key={c.value} value={c.value}>{c.value}%</SelectItem>)}</SelectContent>
                </Select>
              </Campo>
              <Campo label="Precisão">
                <Select value={precisao} onValueChange={setPrecisao}>
                  <SelectTrigger className={INPUT}><SelectValue /></SelectTrigger>
                  <SelectContent>{PRECISOES.map(p => <SelectItem key={p} value={p}>{p}%</SelectItem>)}</SelectContent>
                </Select>
              </Campo>
            </div>
          </section>

          {avisoRecalculo && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800">Este inventário já foi processado e você mudou um dado usado nos cálculos. Depois de salvar, clique em <strong>Reprocessar</strong> para atualizar os resultados e o relatório.</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 md:px-6 py-4 border-t border-gray-100 shrink-0">
          <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button className="flex-1 h-11 rounded-xl bg-[#00420d] hover:bg-[#0B5A1E] text-white gap-2" onClick={salvar} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar<span className="hidden sm:inline"> alterações</span></>}
          </Button>
        </div>
      </div>
    </div>
  );
}
