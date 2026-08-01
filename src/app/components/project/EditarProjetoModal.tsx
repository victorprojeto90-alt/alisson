import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertTriangle, CalendarDays, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const BIOMAS = [
  { value: 'amazonia', label: 'Amazônia' },
  { value: 'cerrado', label: 'Cerrado' },
  { value: 'mata_atlantica', label: 'Mata Atlântica' },
  { value: 'caatinga', label: 'Caatinga' },
  { value: 'pampa', label: 'Pampa' },
  { value: 'pantanal', label: 'Pantanal' },
];

const ESTADOS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
];

// Campos de identificação (Passo 1 do formulário de Novo Inventário) que fazem
// sentido editar depois de criado. area_total_ha é o único que alimenta o motor de
// cálculo (calculations.ts usa area_total_ha para Fator de Correção, erro amostral,
// IC e volume estimado) — os demais são só metadados exibidos em telas/relatórios.
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
}

interface Props {
  projeto: ProjetoEditavel;
  onClose: () => void;
  onSaved: (atualizado: ProjetoEditavel) => void;
}

export default function EditarProjetoModal({ projeto, onClose, onSaved }: Props) {
  const [nome, setNome] = useState(projeto.nome);
  const [dataInventario, setDataInventario] = useState(projeto.data_inventario ?? '');
  const [descricao, setDescricao] = useState(projeto.descricao ?? '');
  const [municipio, setMunicipio] = useState(projeto.municipio ?? '');
  const [estado, setEstado] = useState(projeto.estado ?? '');
  const [bioma, setBioma] = useState(projeto.bioma ?? '');
  const [areaTotalHa, setAreaTotalHa] = useState(String(projeto.area_total_ha ?? ''));
  const [saving, setSaving] = useState(false);

  // Inventário já processado/finalizado tem resultado calculado com a área antiga —
  // mudar a área o torna estatisticamente desatualizado (FC, erro amostral, IC e Score
  // AMBISAFE dependem de area_total_ha). Bioma/município/estado/nome/data/descrição não
  // entram no motor de cálculo, então não precisam desse aviso.
  const jaProcessado = projeto.status === 'processado' || projeto.status === 'finalizado';
  const areaAlterada = Number(areaTotalHa) !== Number(projeto.area_total_ha);
  const mostrarAvisoRecalculo = jaProcessado && areaAlterada;

  const handleSave = async () => {
    // Mesmas regras de validação do Passo 1 de ProjectNew.tsx
    if (!nome.trim()) { toast.error('Informe o nome do empreendimento'); return; }
    if (!areaTotalHa || isNaN(Number(areaTotalHa)) || Number(areaTotalHa) <= 0) {
      toast.error('Informe a área total em hectares');
      return;
    }

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
        area_total_ha: Number(areaTotalHa),
      })
      .eq('id', projeto.id)
      .select()
      .single();
    setSaving(false);

    if (error) {
      toast.error('Erro ao salvar alterações: ' + error.message);
      return;
    }

    toast.success(
      mostrarAvisoRecalculo
        ? 'Inventário atualizado. Não esqueça de reprocessar para atualizar os resultados.'
        : 'Inventário atualizado com sucesso!'
    );
    onSaved(data as ProjetoEditavel);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => !saving && onClose()} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Editar Inventário</h3>
          <button onClick={() => !saving && onClose()} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-nome">Nome do Empreendimento *</Label>
            <Input id="edit-nome" value={nome} onChange={e => setNome(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-data" className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
              Data do Inventário
            </Label>
            <Input id="edit-data" type="date" value={dataInventario} onChange={e => setDataInventario(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-descricao">Descrição / Anotações</Label>
            <textarea
              id="edit-descricao"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-municipio">Município</Label>
              <Input id="edit-municipio" value={municipio} onChange={e => setMunicipio(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Bioma</Label>
            <Select value={bioma} onValueChange={setBioma}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o bioma" />
              </SelectTrigger>
              <SelectContent>
                {BIOMAS.map(b => (
                  <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-area">Área total inventariada (ha) *</Label>
            <Input
              id="edit-area"
              type="number"
              step="0.01"
              min="0.01"
              value={areaTotalHa}
              onChange={e => setAreaTotalHa(e.target.value)}
            />
          </div>

          {mostrarAvisoRecalculo && (
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-700">
                Este inventário já foi processado. Alterar a área total pode tornar os resultados já
                calculados desatualizados — o erro amostral, o intervalo de confiança e o Score AMBISAFE
                dependem diretamente da área total. Recomendamos <strong>reprocessar o inventário</strong> depois
                de salvar, na aba Resultados.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-[#16A34A] hover:bg-[#15803d] text-white gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
            ) : (
              <><Save className="w-4 h-4" /> Salvar Alterações</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
