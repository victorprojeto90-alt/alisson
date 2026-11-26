import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Palette, Upload, Trash2, Check, Loader2, ImageIcon, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CORES_PADRAO, hexValido, luminancia, temaCores, urlLogoMarca } from '../../lib/relatorio/tema';

const SUGESTOES = ['#00420D', '#14532D', '#0F766E', '#1E3A8A', '#334155', '#7C2D12', '#4C1D95', '#111827'];
const SUGESTOES_DESTAQUE = ['#ACD115', '#22C55E', '#F59E0B', '#38BDF8', '#F97316', '#E11D48', '#A3A3A3', '#FACC15'];
const TIPOS = ['image/png', 'image/jpeg', 'image/webp'];

function CampoCor({ label, valor, onChange, sugestoes, ajuda }: { label: string; valor: string; onChange: (v: string) => void; sugestoes: string[]; ajuda: string }) {
  const [texto, setTexto] = useState(valor);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <label className="relative w-12 h-12 rounded-xl border border-gray-200 overflow-hidden cursor-pointer shrink-0" style={{ background: valor }}>
          <input
            type="color"
            value={valor}
            onChange={e => { onChange(e.target.value.toUpperCase()); setTexto(e.target.value.toUpperCase()); }}
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label={label}
          />
        </label>
        <Input
          value={texto}
          maxLength={7}
          onChange={e => {
            let v = e.target.value.toUpperCase();
            if (v && !v.startsWith('#')) v = '#' + v;
            setTexto(v);
            if (hexValido(v)) onChange(v);
          }}
          className="font-mono uppercase h-12"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sugestoes.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => { onChange(c); setTexto(c); }}
            className={`w-7 h-7 rounded-lg border transition-transform hover:scale-110 ${valor === c ? 'ring-2 ring-offset-1 ring-gray-900 border-white' : 'border-gray-200'}`}
            style={{ background: c }}
            aria-label={`Usar ${c}`}
          />
        ))}
      </div>
      <p className="text-[11px] text-gray-400">{ajuda}</p>
    </div>
  );
}

// Miniatura da capa e de uma tabela, para a pessoa ver o resultado antes de salvar
function Previa({ ativa, nome, logo, primaria, destaque, contato }: { ativa: boolean; nome: string; logo: string | null; primaria: string; destaque: string; contato: string }) {
  const t = temaCores(ativa ? primaria : CORES_PADRAO.primaria, ativa ? destaque : CORES_PADRAO.secundaria);
  const sobre = '#' + t.sobrePrimaria;
  return (
    <div className="flex gap-3 justify-center">
      <div className="w-[150px] aspect-[210/297] bg-white rounded-md shadow-md border border-gray-100 overflow-hidden flex flex-col text-[6px]">
        {ativa ? (
          <div className="h-[16%] flex items-center px-2.5">
            {logo ? <img src={logo} alt="" className="max-h-[70%] max-w-[70%] object-contain" /> : <span className="font-bold text-[8px] truncate" style={{ color: '#' + t.escura }}>{nome || 'Sua empresa'}</span>}
          </div>
        ) : null}
        <div className={`${ativa ? 'h-[22%]' : 'h-[38%]'} px-2.5 flex flex-col justify-end pb-2`} style={{ background: '#' + t.primaria }}>
          {!ativa && <span className="font-black text-[9px] text-white mb-auto mt-3">AMBI<span style={{ color: '#ACD115' }}>SAFE</span></span>}
          <span className="font-bold" style={{ color: sobre, opacity: 0.85 }}>RELATÓRIO TÉCNICO DE</span>
          <span className="font-bold text-[8px]" style={{ color: sobre }}>INVENTÁRIO FLORESTAL</span>
        </div>
        <div className="h-[2px]" style={{ background: '#' + t.destaque }} />
        <div className="px-2.5 pt-3 flex-1">
          <span className="text-gray-400">PROJETO</span>
          <p className="font-bold text-[8px] text-gray-800 leading-tight">Fazenda Exemplo</p>
          <div className="mt-2 rounded-sm p-1.5 space-y-1" style={{ background: '#' + t.zebra, borderLeft: `2px solid #${t.media}` }}>
            <div className="h-1 w-3/4 bg-gray-300 rounded" />
            <div className="h-1 w-1/2 bg-gray-300 rounded" />
          </div>
        </div>
        <p className="text-center text-gray-400 pb-1.5 text-[5px]">{ativa ? 'Gerado pelo sistema AMBISAFE' : 'Documento gerado pela plataforma AMBISAFE'}</p>
      </div>
      <div className="w-[150px] aspect-[210/297] bg-white rounded-md shadow-md border border-gray-100 overflow-hidden flex flex-col text-[6px] p-2.5">
        <div className="flex items-center justify-between border-b pb-1" style={{ borderColor: '#' + t.linha }}>
          {ativa
            ? (logo ? <img src={logo} alt="" className="h-3 max-w-[50%] object-contain" /> : <span className="font-bold truncate max-w-[50%]" style={{ color: '#' + t.escura }}>{nome || 'Sua empresa'}</span>)
            : <span className="font-black text-[7px]" style={{ color: '#00420D' }}>AMBI<span style={{ color: '#ACD115' }}>SAFE</span></span>}
          <span className="text-gray-400 text-[4.5px]">Relatório Técnico</span>
        </div>
        <p className="font-bold mt-2 text-[7px]" style={{ color: '#' + t.escura }}>4 RESULTADOS</p>
        <div className="h-[1.5px] w-5 mb-1.5" style={{ background: '#' + t.destaque }} />
        <div className="space-y-0.5 mb-2">{[1, 2, 3].map(i => <div key={i} className="h-[3px] bg-gray-200 rounded" />)}</div>
        <div className="rounded-sm overflow-hidden">
          <div className="h-2.5 px-1 flex items-center font-bold" style={{ background: '#' + t.primaria, color: sobre }}>Espécie</div>
          {[0, 1, 2, 3].map(i => <div key={i} className="h-2" style={{ background: i % 2 ? '#' + t.zebra : '#fff', borderBottom: `0.5px solid #${t.linha}` }} />)}
        </div>
        <div className="mt-2 flex items-end gap-1 h-8">
          {[60, 100, 85, 45, 25].map((h, i) => <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i < 2 ? '#' + t.media : '#' + t.suave }} />)}
        </div>
        <div className="mt-auto border-t pt-1 text-[4.5px] text-gray-400" style={{ borderColor: '#' + t.linha }}>
          {ativa ? [contato, 'Gerado pelo sistema AMBISAFE'].filter(Boolean).join(' · ') : 'Fazenda Exemplo · Patos/PB'}
        </div>
      </div>
    </div>
  );
}

export default function MarcaRelatorioCard() {
  const { empresa, recarregarPerfil } = useAuth();
  const [ativa, setAtiva] = useState(!!empresa?.marca_ativa);
  const [nome, setNome] = useState(empresa?.marca_nome ?? empresa?.name ?? '');
  const [logoPath, setLogoPath] = useState<string | null>(empresa?.marca_logo_path ?? null);
  const [primaria, setPrimaria] = useState(hexValido(empresa?.marca_cor_primaria) ? empresa!.marca_cor_primaria!.toUpperCase() : CORES_PADRAO.primaria);
  const [destaque, setDestaque] = useState(hexValido(empresa?.marca_cor_secundaria) ? empresa!.marca_cor_secundaria!.toUpperCase() : CORES_PADRAO.secundaria);
  const [contato, setContato] = useState(empresa?.marca_contato ?? '');
  const [enviando, setEnviando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const logoUrl = urlLogoMarca(logoPath);
  const corClara = luminancia(primaria) > 0.5;

  const enviarLogo = async (arquivo: File) => {
    if (!empresa) return;
    if (!TIPOS.includes(arquivo.type)) { toast.error('Use um arquivo PNG, JPG ou WebP.'); return; }
    if (arquivo.size > 2 * 1024 * 1024) { toast.error('O logo pode ter no máximo 2 MB.'); return; }
    setEnviando(true);
    const ext = arquivo.type === 'image/png' ? 'png' : arquivo.type === 'image/webp' ? 'webp' : 'jpg';
    const caminho = `${empresa.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('marcas').upload(caminho, arquivo, { contentType: arquivo.type, cacheControl: '3600' });
    setEnviando(false);
    if (error) { toast.error('Não foi possível enviar o logo: ' + error.message); return; }
    setLogoPath(caminho);
    toast.success('Logo enviado. Clique em "Salvar marca" para aplicar.');
  };

  const salvar = async () => {
    if (!empresa) return;
    if (ativa && !nome.trim()) { toast.error('Informe o nome que vai aparecer nos relatórios.'); return; }
    setSalvando(true);
    const anterior = empresa.marca_logo_path;
    const { error } = await supabase.from('empresas').update({
      marca_ativa: ativa,
      marca_nome: nome.trim() || null,
      marca_logo_path: logoPath,
      marca_cor_primaria: primaria,
      marca_cor_secundaria: destaque,
      marca_contato: contato.trim() || null,
    }).eq('id', empresa.id);
    if (error) {
      setSalvando(false);
      toast.error('Erro ao salvar a marca: ' + error.message);
      return;
    }
    if (anterior && anterior !== logoPath) {
      await supabase.storage.from('marcas').remove([anterior]).catch(() => undefined);
    }
    await recarregarPerfil();
    setSalvando(false);
    toast.success(ativa ? 'Pronto! Os próximos relatórios saem com a sua marca.' : 'Marca salva. Os relatórios continuam com a marca AMBISAFE.');
  };

  return (
    <Card id="marca" className="shadow-sm lg:col-span-2 scroll-mt-28">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00420d]/10 rounded-lg flex items-center justify-center shrink-0">
              <Palette className="w-5 h-5 text-[#00420d]" />
            </div>
            <div>
              <CardTitle className="text-base">Marca nos relatórios</CardTitle>
              <CardDescription className="text-xs">Seu logo, suas cores e o nome da sua empresa no PDF, no Word e no Excel</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-5">
            <div className="rounded-xl bg-[#f4f8f3] p-4 text-xs text-gray-600 space-y-2">
              <p className="flex items-center gap-1.5 font-semibold text-gray-800"><Info className="w-4 h-4 text-[#16A34A]" /> Como funciona</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Ligue <b>“Usar minha marca”</b> e escreva o nome que deve aparecer nos relatórios.</li>
                <li>Envie o seu logo (PNG com fundo transparente fica melhor, até 2 MB) e escolha suas cores.</li>
                <li>Clique em <b>Salvar marca</b>. Os próximos arquivos exportados já saem com a sua identidade.</li>
              </ol>
              <p>Com a marca ligada, a AMBISAFE aparece só como um crédito pequeno no rodapé. Desligada, os relatórios saem com a marca AMBISAFE.</p>
            </div>

            <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4 cursor-pointer">
              <div>
                <p className="font-semibold text-sm text-gray-900">Usar minha marca nos relatórios</p>
                <p className="text-xs text-gray-500">{ativa ? 'Ligado: relatórios com a sua marca' : 'Desligado: relatórios com a marca AMBISAFE'}</p>
              </div>
              <Switch checked={ativa} onCheckedChange={setAtiva} />
            </label>

            <div className={`space-y-5 transition-opacity ${ativa ? '' : 'opacity-50'}`}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nome nos relatórios</Label>
                  <Input value={nome} maxLength={120} placeholder={empresa?.name ?? 'Nome da sua empresa'} onChange={e => setNome(e.target.value)} />
                  <p className="text-[11px] text-gray-400">Aparece no cabeçalho quando não houver logo e na planilha.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Contato no rodapé <span className="text-gray-400 font-normal">(opcional)</span></Label>
                  <Input value={contato} maxLength={200} placeholder="(83) 99999-9999 · contato@suaempresa.com.br" onChange={e => setContato(e.target.value)} />
                  <p className="text-[11px] text-gray-400">Telefone, e-mail ou site, em uma linha.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Logo</Label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-full sm:w-56 h-24 rounded-xl border border-dashed border-gray-300 bg-[repeating-conic-gradient(#f3f4f6_0_25%,#fff_0_50%)] bg-[length:16px_16px] flex items-center justify-center overflow-hidden">
                    {logoUrl ? <img src={logoUrl} alt="Logo" className="max-h-20 max-w-[90%] object-contain" /> : <span className="flex flex-col items-center text-xs text-gray-400"><ImageIcon className="w-6 h-6 mb-1" />Sem logo</span>}
                  </div>
                  <div className="flex gap-2">
                    <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) enviarLogo(f); e.target.value = ''; }} />
                    <Button type="button" variant="outline" className="gap-2 rounded-xl" disabled={enviando} onClick={() => inputRef.current?.click()}>
                      {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {logoPath ? 'Trocar logo' : 'Enviar logo'}
                    </Button>
                    {logoPath && (
                      <Button type="button" variant="ghost" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl" onClick={() => setLogoPath(null)}>
                        <Trash2 className="w-4 h-4" /> Remover
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-gray-400">PNG, JPG ou WebP, até 2 MB. Prefira o logo horizontal.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <CampoCor label="Cor principal" valor={primaria} onChange={setPrimaria} sugestoes={SUGESTOES} ajuda="Faixa da capa, cabeçalho das tabelas e títulos." />
                <CampoCor label="Cor de destaque" valor={destaque} onChange={setDestaque} sugestoes={SUGESTOES_DESTAQUE} ajuda="Filetes e detalhes. Pode ser a segunda cor do seu logo." />
              </div>
              {corClara && ativa && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">A cor principal é bem clara: os títulos vão usar um tom mais escuro dela para ficarem legíveis.</p>
              )}
            </div>

            <Button onClick={salvar} disabled={salvando || enviando} className="bg-[#00420d] hover:bg-[#00420d]/90 text-white">
              {salvando ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Salvando...</> : <><Check className="w-4 h-4 mr-2" />Salvar marca</>}
            </Button>
          </div>

          <div className="rounded-2xl bg-gray-50 p-4 lg:sticky lg:top-24 self-start">
            <p className="text-xs font-semibold text-gray-500 mb-3 text-center">Prévia do relatório</p>
            <Previa ativa={ativa} nome={nome} logo={logoUrl} primaria={primaria} destaque={destaque} contato={contato} />
            <p className="text-[11px] text-gray-400 text-center mt-3">Capa e página interna, como vão sair no PDF e no Word.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
