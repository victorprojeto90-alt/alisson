import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';

export interface RawRow {
  [key: string]: string | number | null;
}

interface DataUploadProps {
  onDataLoaded: (headers: string[], rows: RawRow[]) => void;
}

const MAX_ROWS = 20000;

export default function DataUpload({ onDataLoaded }: DataUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<{ headers: string[]; rows: RawRow[] } | null>(null);
  const [error, setError] = useState('');

  const processFile = useCallback((file: File) => {
    setError('');
    setFileName(file.name);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as RawRow[];
          if (rows.length === 0) { setError('Arquivo CSV vazio ou sem dados válidos.'); return; }
          if (rows.length > MAX_ROWS) { setError(`Arquivo com muitos registros (${rows.length}). Máximo: ${MAX_ROWS}.`); return; }
          const headers = Object.keys(rows[0]);
          setPreview({ headers, rows });
          onDataLoaded(headers, rows);
        },
        error: (err) => setError('Erro ao ler CSV: ' + err.message),
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: null });

          if (jsonData.length === 0) { setError('Planilha vazia ou sem dados na primeira aba.'); return; }
          if (jsonData.length > MAX_ROWS) { setError(`Planilha com muitos registros. Máximo: ${MAX_ROWS}.`); return; }

          const headers = Object.keys(jsonData[0]);
          setPreview({ headers, rows: jsonData });
          onDataLoaded(headers, jsonData);
        } catch {
          setError('Erro ao ler arquivo Excel. Verifique se o arquivo não está corrompido.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError('Formato não suportado. Use CSV ou XLSX.');
    }
  }, [onDataLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const reset = () => {
    setFileName('');
    setPreview(null);
    setError('');
  };

  return (
    <div className="space-y-4">
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={cn(
            'border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer',
            dragOver
              ? 'border-[#16A34A] bg-green-50'
              : 'border-gray-200 hover:border-[#16A34A]/50 hover:bg-gray-50'
          )}
          onClick={() => document.getElementById('file-upload-input')?.click()}
        >
          <input
            id="file-upload-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-14 h-14 bg-[#0B3D2E]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-7 h-7 text-[#0B3D2E]" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">
            {dragOver ? 'Solte o arquivo aqui' : 'Arraste sua planilha aqui'}
          </h3>
          <p className="text-gray-400 text-sm mb-4">ou clique para selecionar o arquivo</p>
          <div className="flex items-center justify-center gap-2">
            <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded-full font-mono">CSV</span>
            <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded-full font-mono">XLSX</span>
            <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded-full font-mono">XLS</span>
          </div>
        </div>
      ) : (
        <div className="border border-green-200 bg-green-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#16A34A]/20 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-[#16A34A]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{fileName}</p>
                <p className="text-xs text-gray-500">
                  {preview.rows.length.toLocaleString('pt-BR')} linhas · {preview.headers.length} colunas detectadas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium bg-green-100 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Carregado
              </span>
              <button onClick={reset} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preview das colunas */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {preview.headers.map(h => (
              <span key={h} className="bg-white border border-gray-200 text-gray-600 text-xs px-2.5 py-1 rounded-full font-mono">
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">Erro ao processar arquivo</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Template hint */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm">
        <p className="font-medium text-blue-800 mb-1">Colunas esperadas na planilha:</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {['Parcela', 'Nº Árvore', 'Nome Comum', 'CAP (cm)', 'HT (m)', 'Nome Científico', 'Família', 'Nº Fuste', 'Observações'].map(col => (
            <span key={col} className={`text-xs px-2 py-0.5 rounded font-mono ${
              ['Parcela', 'CAP (cm)', 'HT (m)'].includes(col)
                ? 'bg-blue-100 text-blue-800 font-semibold'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}>
              {col}
            </span>
          ))}
        </div>
        <p className="text-xs text-blue-600 mt-2">
          <span className="font-semibold bg-blue-100 px-1 rounded">Azul</span> = obrigatório · Branco = opcional
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="text-xs text-gray-400 gap-1"
        onClick={() => {
          // Generate sample CSV
          const csv = 'Parcela,Nome Comum,Nº Árvore,CAP (cm),HT (m),Nome Científico,Família,Nº Fuste\n1,Ipê Amarelo,1,142.0,18.5,Handroanthus albus,Bignoniaceae,1\n1,Jatobá,2,117.8,16.2,Hymenaea courbaril,Fabaceae,1\n2,Cedro,1,163.4,21.0,Cedrela odorata,Meliaceae,1';
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'modelo-inventario-ambisafe.csv';
          a.click();
          URL.revokeObjectURL(url);
        }}
      >
        <Upload className="w-3 h-3" />
        Baixar modelo de planilha
      </Button>
    </div>
  );
}
