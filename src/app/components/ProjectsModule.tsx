import { useState, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import ScoreAmbisafe from '../components/ScoreAmbisafe';
import ForestChart from '../components/ForestChart';
import { 
  Trees, 
  Upload, 
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  Leaf,
  Plus,
  Download,
  Brain,
  ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { useApi } from '../hooks/useApi';

interface Project {
  id: string;
  name: string;
  area: string;
  tipo_amostragem: string;
  status: string;
  created_at: string;
  score?: number;
}

export default function ProjectsModule() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Fazenda Santa Helena',
      area: '1.250 ha',
      tipo_amostragem: 'Estratificada',
      status: 'Em análise',
      created_at: '2026-02-15',
      score: 92
    },
    {
      id: '2',
      name: 'Reserva Amazônia Verde',
      area: '3.800 ha',
      tipo_amostragem: 'Amostragem Casual Simples',
      status: 'Concluído',
      created_at: '2026-01-20',
      score: 88
    }
  ]);

  const [showNewProject, setShowNewProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectArea, setNewProjectArea] = useState('');
  const [newProjectType, setNewProjectType] = useState('Amostragem Casual Simples');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { apiCall, loading } = useApi();

  const tiposAmostragem = [
    'Amostragem Casual Simples',
    'Estratificada',
    'Dois Estágios',
    'Conglomerado',
    'Inventário 100%'
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      
      if (file.name.endsWith('.csv')) {
        Papa.parse(data as string, {
          header: true,
          complete: (results) => {
            setFileData(results.data);
            console.log('CSV Data:', results.data);
          }
        });
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        setFileData(json);
        console.log('XLSX Data:', json);
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName || !newProjectArea) {
      alert('Preencha nome e área do projeto');
      return;
    }

    try {
      const result = await apiCall('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: newProjectName,
          area: newProjectArea,
          tipo_amostragem: newProjectType
        })
      });

      const newProject: Project = {
        id: result.project.id,
        name: newProjectName,
        area: newProjectArea,
        tipo_amostragem: newProjectType,
        status: 'Criado',
        created_at: new Date().toISOString(),
      };

      setProjects([newProject, ...projects]);
      setShowNewProject(false);
      setNewProjectName('');
      setNewProjectArea('');
      setUploadedFile(null);
      setFileData(null);
      
      alert('Projeto criado com sucesso!');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Erro ao criar projeto. Tente novamente.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'concluído':
        return 'success';
      case 'em análise':
        return 'warning';
      case 'criado':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (selectedProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedProject(null)}>
            ← Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{selectedProject.name}</h1>
            <p className="text-muted-foreground">
              {selectedProject.area} • {selectedProject.tipo_amostragem}
            </p>
          </div>
          <Badge variant={getStatusColor(selectedProject.status)}>
            {selectedProject.status}
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <ScoreAmbisafe
            score={selectedProject.score || 0}
            breakdown={{
              regularidade: 88,
              diversidade: 92,
              sustentabilidade: 95,
              conformidade: 90,
              consistencia: 85
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle>Indicadores Principais</CardTitle>
              <CardDescription>Métricas do inventário florestal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Volume Total</span>
                </div>
                <span className="text-lg font-bold">12.450 m³</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                  <span className="text-sm font-medium">Volume por Hectare</span>
                </div>
                <span className="text-lg font-bold">145 m³/ha</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Trees className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium">Densidade</span>
                </div>
                <span className="text-lg font-bold">420 árv/ha</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Leaf className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">Índice Shannon</span>
                </div>
                <span className="text-lg font-bold">3.42</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid md:grid-cols-2 gap-6">
          <ForestChart type="volume" />
          <ForestChart type="species" />
        </div>

        <ForestChart type="diversity" />

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios com IA</CardTitle>
              <CardDescription>Documentos técnicos gerados automaticamente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-between" variant="outline">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <span>Relatório Técnico Completo</span>
                </div>
                <Download className="w-4 h-4" />
              </Button>
              <Button className="w-full justify-between" variant="outline">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <span>Relatório Executivo</span>
                </div>
                <Download className="w-4 h-4" />
              </Button>
              <Button className="w-full justify-between" variant="outline">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <span>Plano de Manejo Sustentável</span>
                </div>
                <Download className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas Avançadas</CardTitle>
              <CardDescription>Análises estatísticas do inventário</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Erro Amostral:</span>
                <span className="font-semibold">±5.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Intervalo de Confiança:</span>
                <span className="font-semibold">95%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Desvio Padrão:</span>
                <span className="font-semibold">32.4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Média:</span>
                <span className="font-semibold">145.8 m³/ha</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mediana:</span>
                <span className="font-semibold">142.1 m³/ha</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVI Médio:</span>
                <span className="font-semibold">68.5</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showNewProject) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => {
            setShowNewProject(false);
            setUploadedFile(null);
            setFileData(null);
          }}>
            ← Voltar
          </Button>
          <h1 className="text-3xl font-bold">Novo Projeto</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Projeto</CardTitle>
            <CardDescription>Defina as características do inventário florestal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Projeto</label>
              <Input
                placeholder="Ex: Fazenda Santa Helena"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Área Total (hectares)</label>
              <Input
                placeholder="Ex: 1250"
                value={newProjectArea}
                onChange={(e) => setNewProjectArea(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Amostragem</label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-input-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={newProjectType}
                onChange={(e) => setNewProjectType(e.target.value)}
              >
                {tiposAmostragem.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload de Planilha
            </CardTitle>
            <CardDescription>
              Envie sua planilha CSV ou XLSX com os dados do inventário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {!uploadedFile ? (
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-medium mb-2">
                  Clique para selecionar ou arraste o arquivo aqui
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: CSV, XLSX, XLS
                </p>
              </div>
            ) : (
              <div className="border border-muted rounded-lg p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-secondary" />
                    <div>
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                        {fileData && ` • ${fileData.length} linhas detectadas`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUploadedFile(null);
                      setFileData(null);
                    }}
                  >
                    Remover
                  </Button>
                </div>

                {fileData && (
                  <div className="mt-4 p-4 bg-secondary/10 rounded-lg">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Análise IA: Colunas Detectadas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(fileData[0] || {}).map((col) => (
                        <Badge key={col} variant="outline">
                          {col}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setShowNewProject(false);
              setUploadedFile(null);
              setFileData(null);
            }}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateProject}
            className="flex-1"
            disabled={loading || !newProjectName || !newProjectArea}
          >
            {loading ? 'Criando...' : 'Criar Projeto'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Projetos</h1>
          <p className="text-muted-foreground">
            Gerencie seus inventários florestais
          </p>
        </div>
        <Button onClick={() => setShowNewProject(true)} className="w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      <div className="grid gap-4">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedProject(project)}
          >
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trees className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold mb-1">{project.name}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span>Área: {project.area}</span>
                      <span>•</span>
                      <span>{project.tipo_amostragem}</span>
                      <span>•</span>
                      <span>Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {project.score && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{project.score}</div>
                      <div className="text-xs text-muted-foreground">Score</div>
                    </div>
                  )}
                  <Badge variant={getStatusColor(project.status)} className="whitespace-nowrap">
                    {project.status}
                  </Badge>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Trees className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum Projeto Criado</h3>
            <p className="text-muted-foreground mb-6">
              Crie seu primeiro projeto de inventário florestal
            </p>
            <Button onClick={() => setShowNewProject(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Projeto
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}