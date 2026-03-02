import { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Trees, AlertTriangle } from 'lucide-react';
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

const TIPOS_INVENTARIO = [
  {
    value: 'casual_simples',
    label: 'Amostragem Casual Simples',
    desc: 'Parcelas alocadas aleatoriamente na área de estudo',
  },
  {
    value: 'sistematico',
    label: 'Amostragem Sistemática',
    desc: 'Parcelas distribuídas em grid regular sobre a área',
  },
  {
    value: 'estratificado',
    label: 'Amostragem Estratificada',
    desc: 'Área dividida em estratos homogêneos com parcelas proporcionais',
  },
  {
    value: 'censo',
    label: 'Inventário 100% (Censo)',
    desc: 'Todos os indivíduos da área são mensurados',
  },
];

const MOTIVOS = [
  {
    value: 'licenciamento',
    label: 'Licenciamento Ambiental',
    desc: 'Para instrução de processos junto a órgãos ambientais',
  },
  {
    value: 'manejo',
    label: 'Manejo Florestal Sustentável',
    desc: 'Para elaboração de Plano de Manejo (PMFS)',
  },
  {
    value: 'supressao',
    label: 'Supressão Vegetal',
    desc: 'Para supressão autorizada de vegetação nativa',
  },
  {
    value: 'academico',
    label: 'Levantamento Acadêmico',
    desc: 'Para pesquisa científica ou trabalhos universitários',
  },
];

interface FormData {
  nome: string;
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
  { label: 'Identificação', desc: 'Nome e localização' },
  { label: 'Metodologia', desc: 'Tipo de inventário' },
  { label: 'Parâmetros', desc: 'Configurações técnicas' },
];

export default function ProjectNew() {
  const navigate = useNavigate();
  const { empresa, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormData>({
    nome: '',
    municipio: '',
    estado: '',
    bioma: '',
    area_total_ha: '',
    tipo_inventario: 'casual_simples',
    motivo_inventario: 'licenciamento',
    precisao_requerida: '10',
    nivel_confianca: '95',
    tamanho_parcela_m2: '400',
    fator_forma: '0.7',
  });

  const set = (field: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const validateStep = () => {
    if (step === 0) {
      if (!form.nome.trim()) { toast.error('Informe o nome do empreendimento'); return false; }
      if (!form.area_total_ha || isNaN(Number(form.area_total_ha)) || Number(form.area_total_ha) <= 0) {
        toast.error('Informe a área total em hectares'); return false;
      }
    }
    if (step === 1) {
      if (!form.tipo_inventario) { toast.error('Selecione o tipo de inventário'); return false; }
      if (!form.motivo_inventario) { toast.error('Selecione o motivo do inventário'); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!empresa?.id) { toast.error('Empresa não identificada'); return; }

    setLoading(true);
    const { data, error } = await supabase
      .from('projetos')
      .insert({
        empresa_id: empresa.id,
        nome: form.nome.trim(),
        municipio: form.municipio.trim() || null,
        estado: form.estado || null,
        bioma: form.bioma || null,
        area_total_ha: Number(form.area_total_ha),
        tipo_inventario: form.tipo_inventario,
        motivo_inventario: form.motivo_inventario,
        precisao_requerida: Number(form.precisao_requerida),
        nivel_confianca: Number(form.nivel_confianca),
        tamanho_parcela_m2: Number(form.tamanho_parcela_m2),
        fator_forma: Number(form.fator_forma),
        status: 'rascunho',
      })
      .select()
      .single();

    setLoading(false);
    if (error) { toast.error('Erro ao criar projeto: ' + error.message); return; }
    toast.success('Projeto criado com sucesso!');
    navigate(`/app/projetos/${data.id}`);
  };

  if (!authLoading && !empresa) {
    return (
      <div className="p-4 md:p-8 max-w-lg mx-auto pt-16 text-center">
        <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-yellow-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Conta não configurada</h2>
        <p className="text-gray-500 text-sm mb-6">
          Sua conta ainda não foi vinculada a uma empresa. Acesse o Dashboard para ver as instruções de correção.
        </p>
        <Button onClick={() => navigate('/app/dashboard')} className="bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white">
          Ir para o Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => step === 0 ? navigate('/app/dashboard') : setStep(s => s - 1)}
          className="text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Inventário Florestal</h1>
          <p className="text-gray-400 text-sm">Passo {step + 1} de {STEPS.length}: {STEPS[step].label}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              i < step ? 'bg-[#16A34A] text-white' :
              i === step ? 'bg-[#0B3D2E] text-white' :
              'bg-gray-100 text-gray-400'
            }`}>
              {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <div className="hidden sm:block flex-1">
              <p className={`text-xs font-medium ${i <= step ? 'text-gray-900' : 'text-gray-400'}`}>
                {s.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 transition-colors ${i < step ? 'bg-[#16A34A]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          {/* Step 0: Identificação */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <CardTitle className="text-lg mb-1">Identificação do Empreendimento</CardTitle>
                <CardDescription>Informações básicas do projeto</CardDescription>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome do Empreendimento *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Fazenda Santa Helena - Inventário Supressão"
                  value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="municipio">Município</Label>
                  <Input
                    id="municipio"
                    placeholder="Ex: Manaus"
                    value={form.municipio}
                    onChange={e => set('municipio', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Estado</Label>
                  <Select value={form.estado} onValueChange={v => set('estado', v)}>
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
                <Select value={form.bioma} onValueChange={v => set('bioma', v)}>
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
                <Label htmlFor="area">Área Total (ha) *</Label>
                <Input
                  id="area"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Ex: 1250.50"
                  value={form.area_total_ha}
                  onChange={e => set('area_total_ha', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 1: Metodologia */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <CardTitle className="text-lg mb-1">Metodologia do Inventário</CardTitle>
                <CardDescription>Defina o tipo e o motivo do levantamento</CardDescription>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Tipo de Inventário *</Label>
                <RadioGroup
                  value={form.tipo_inventario}
                  onValueChange={v => set('tipo_inventario', v)}
                  className="space-y-2"
                >
                  {TIPOS_INVENTARIO.map(tipo => (
                    <div
                      key={tipo.value}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        form.tipo_inventario === tipo.value
                          ? 'border-[#16A34A] bg-green-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                      onClick={() => set('tipo_inventario', tipo.value)}
                    >
                      <RadioGroupItem value={tipo.value} id={tipo.value} className="mt-0.5" />
                      <Label htmlFor={tipo.value} className="cursor-pointer">
                        <span className="font-semibold text-gray-900">{tipo.label}</span>
                        <p className="text-xs text-gray-500 mt-0.5 font-normal">{tipo.desc}</p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Motivo do Inventário *</Label>
                <RadioGroup
                  value={form.motivo_inventario}
                  onValueChange={v => set('motivo_inventario', v)}
                  className="space-y-2"
                >
                  {MOTIVOS.map(motivo => (
                    <div
                      key={motivo.value}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        form.motivo_inventario === motivo.value
                          ? 'border-[#16A34A] bg-green-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                      onClick={() => set('motivo_inventario', motivo.value)}
                    >
                      <RadioGroupItem value={motivo.value} id={`m_${motivo.value}`} className="mt-0.5" />
                      <Label htmlFor={`m_${motivo.value}`} className="cursor-pointer">
                        <span className="font-semibold text-gray-900">{motivo.label}</span>
                        <p className="text-xs text-gray-500 mt-0.5 font-normal">{motivo.desc}</p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Step 2: Parâmetros técnicos */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <CardTitle className="text-lg mb-1">Parâmetros Técnicos</CardTitle>
                <CardDescription>Configurações para os cálculos estatísticos</CardDescription>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tamanho da Parcela (m²) *</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="400"
                    value={form.tamanho_parcela_m2}
                    onChange={e => set('tamanho_parcela_m2', e.target.value)}
                  />
                  <p className="text-xs text-gray-400">Padrão: 400 m² (20×20)</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Fator de Forma (ff)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="1"
                    placeholder="0.7"
                    value={form.fator_forma}
                    onChange={e => set('fator_forma', e.target.value)}
                  />
                  <p className="text-xs text-gray-400">Padrão: 0,70</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Precisão Requerida (%)</Label>
                  <Select value={form.precisao_requerida} onValueChange={v => set('precisao_requerida', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="10">10% (recomendado)</SelectItem>
                      <SelectItem value="15">15%</SelectItem>
                      <SelectItem value="20">20%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Nível de Confiança</Label>
                  <Select value={form.nivel_confianca} onValueChange={v => set('nivel_confianca', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90%</SelectItem>
                      <SelectItem value="95">95% (recomendado)</SelectItem>
                      <SelectItem value="99">99%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Resumo */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mt-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <Trees className="w-4 h-4 text-[#16A34A]" />
                  Resumo do Projeto
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Nome:</span> <span className="font-medium">{form.nome || '—'}</span></div>
                  <div><span className="text-gray-500">Área:</span> <span className="font-medium">{form.area_total_ha ? `${form.area_total_ha} ha` : '—'}</span></div>
                  <div><span className="text-gray-500">Tipo:</span> <span className="font-medium">{TIPOS_INVENTARIO.find(t => t.value === form.tipo_inventario)?.label || '—'}</span></div>
                  <div><span className="text-gray-500">Motivo:</span> <span className="font-medium">{MOTIVOS.find(m => m.value === form.motivo_inventario)?.label || '—'}</span></div>
                  {form.municipio && <div><span className="text-gray-500">Local:</span> <span className="font-medium">{form.municipio}{form.estado ? `/${form.estado}` : ''}</span></div>}
                  {form.bioma && <div><span className="text-gray-500">Bioma:</span> <span className="font-medium">{BIOMAS.find(b => b.value === form.bioma)?.label}</span></div>}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => step === 0 ? navigate('/app/dashboard') : setStep(s => s - 1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step === 0 ? 'Cancelar' : 'Anterior'}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={handleNext}
            className="bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white gap-2"
          >
            Próximo
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#16A34A] hover:bg-[#15803d] text-white gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> Criar Inventário</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
