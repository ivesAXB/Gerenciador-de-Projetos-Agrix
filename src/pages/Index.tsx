import { useState, useCallback, useRef } from "react";
import { toPng } from 'html-to-image';
import { 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  FileSpreadsheet, 
  Plus, 
  Loader2,
  Download // <-- Ícone novo para o botão de exportar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { processExcelFile } from "@/lib/excelProcessor";
import { ClientData } from "@/types";

// Componentes do Dashboard
import SCurveChart from "@/components/SCurveChart";
import KPICard from "@/components/KPICard";
import ProjectHeader from "@/components/ProjectHeader";
import PhaseTimeline from "@/components/PhaseTimeline";
import ComparisonTable from "@/components/ComparisonTable";

// Componentes UI
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Index = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<ClientData[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Âncora para a área que será exportada
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Encontra o projeto selecionado no array
  const currentProject = projects.find(p => p.id === selectedProjectId);
  const kpis = currentProject?.projectKPIs;

  // --- Função Mágica de Exportação ---
  // --- Função Mágica de Exportação (Nova Versão) ---
  const handleExportDashboard = async () => {
    if (!dashboardRef.current || !currentProject) return;

    setIsExporting(true);
    toast({
      title: "Gerando relatório...",
      description: "Isso pode levar alguns segundos.",
    });

    try {
      // O html-to-image é muito superior para ler Flexbox e Tailwind
      const dataUrl = await toPng(dashboardRef.current, { 
        quality: 1,
        backgroundColor: "#ffffff",
        pixelRatio: 2, // Garante a alta resolução (antigo scale: 2)
      });
      
      const link = document.createElement("a");
      link.href = dataUrl;
      const safeName = currentProject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      link.download = `Relatorio_AgriX_${safeName}_${dateStr}.png`;
      link.click();

      toast({
        title: "Sucesso!",
        description: "Relatório exportado com sucesso. Verifique seus downloads.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar a imagem do relatório.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  // --- Lógica de Drag & Drop e Upload ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await processFiles(files);
    }
  };

  const processFiles = async (files: File[]) => {
    const excelFiles = files.filter(f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
    
    if (excelFiles.length === 0) {
      toast({
        title: "Formato inválido",
        description: "Por favor, envie apenas arquivos Excel (.xlsx ou .xls)",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const newProjects: ClientData[] = [];
      
      for (const file of excelFiles) {
        const data = await processExcelFile(file);
        newProjects.push(data);
      }

      setProjects(prev => {
        const filtered = prev.filter(p => !newProjects.some(np => np.name === p.name));
        return [...filtered, ...newProjects];
      });

      if (!selectedProjectId && newProjects.length > 0) {
        setSelectedProjectId(newProjects[0].id);
      } else if (newProjects.length === 1) {
        setSelectedProjectId(newProjects[0].id);
      }

      toast({
        title: "Sucesso!",
        description: `${newProjects.length} projeto(s) importado(s) com sucesso.`,
      });

    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao processar",
        description: "Verifique se a planilha segue o padrão do ClickUp.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Renderização ---

  // Tela Vazia
  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card 
          className={`w-full max-w-2xl p-12 border-dashed border-2 flex flex-col items-center text-center transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-card'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="bg-primary/10 p-4 rounded-full mb-6">
            <FileSpreadsheet className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Importar Projeto do ClickUp</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Arraste seu arquivo <strong>.xlsx</strong> exportado do ClickUp aqui, ou clique no botão abaixo para selecionar.
          </p>
          
          <div className="relative">
            <Button disabled={isProcessing} size="lg" className="px-8">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Selecionar Arquivo
                </>
              )}
            </Button>
            <input 
              type="file" 
              accept=".xlsx, .xls"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileInput}
              disabled={isProcessing}
            />
          </div>
        </Card>
      </div>
    );
  }

  // Dashboard Preenchido
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Top Bar: Seletor e Botões */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="bg-primary/10 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Dashboard de Projetos</h2>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="w-[280px] mt-1 font-semibold">
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* NOVO BOTÃO DE EXPORTAR */}
            <Button 
              variant="default" 
              className="w-full sm:w-auto gap-2"
              onClick={handleExportDashboard}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Exportar Relatório
            </Button>

            <div className="relative w-full sm:w-auto">
              <Button variant="outline" className="w-full gap-2">
                <Plus className="w-4 h-4" /> Importar Outro
              </Button>
              <input 
                type="file" 
                accept=".xlsx, .xls"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileInput}
              />
            </div>
          </div>
        </div>

        {currentProject && kpis ? (
          // === INÍCIO DA ÁREA DE CAPTURA DO RELATÓRIO ===
          <div ref={dashboardRef} className="space-y-8 bg-white p-6 rounded-xl text-slate-900" style={{ backgroundColor: "#ffffff" }}>
            {/* Header do Projeto */}
            <ProjectHeader client={currentProject} />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard 
                title="Planejado Final" 
                value={`${kpis.finalPlanned}%`} 
                subtitle="Meta do projeto" 
                icon={Target} 
                variant="default" 
              />
              <KPICard 
                title="Realizado Final" 
                value={`${kpis.finalRealized}%`} 
                subtitle={`${kpis.completedTasks} de ${kpis.totalTasks} tarefas`} 
                icon={CheckCircle2} 
                variant="success" 
              />
              <KPICard 
                title="Até o Go Live" 
                value={`${kpis.realizedAtGoLive}%`} 
                subtitle={`Planejado: ${kpis.plannedAtGoLive}%`} 
                icon={TrendingUp} 
                variant="warning" 
              />
              <KPICard 
                title="Variação" 
                value={`${kpis.variance}%`} 
                subtitle="Diferença Plan vs Real" 
                icon={AlertTriangle} 
                variant="danger" 
              />
            </div>

            {/* Main Chart */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-card-foreground">Curva S - Planejado vs Realizado</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Acompanhamento do progresso acumulado desde o início até o Go Live
                </p>
              </div>
              
              <div className="h-[400px] w-full">
                <SCurveChart 
                  data={currentProject.sCurveDataPercent} 
                  goLiveIndex={currentProject.goLiveIndex} 
                />
              </div>

              {/* Legenda Manual */}
              <div className="mt-6 flex flex-wrap gap-6 justify-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-8 rounded bg-primary/80" />
                  <span className="text-muted-foreground">Planejado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-8 rounded bg-secondary" />
                  <span className="text-muted-foreground">Realizado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 border-l-2 border-dashed border-red-500 mx-2" />
                  <span className="text-muted-foreground">Marco Go Live ({currentProject.goLiveDateFormatted})</span>
                </div>
              </div>
            </div>

            {/* Bottom Grid: Tabela e Timeline */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <ComparisonTable 
                  data={currentProject.sCurveDataPercent} 
                  goLiveIndex={currentProject.goLiveIndex} 
                />
              </div>
              <div>
                <PhaseTimeline phases={currentProject.projectPhases} />
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground pt-8 border-t">
              <p>Dashboard de Implantação • {currentProject.name}</p>
              <p className="text-xs mt-1 opacity-70">Dados importados em {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          // === FIM DA ÁREA DE CAPTURA ===
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            Erro ao carregar dados do projeto selecionado.
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;