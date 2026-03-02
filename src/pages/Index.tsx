import { useState, useCallback, useRef, useEffect } from "react"; // Adicionado useEffect
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
  Download 
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

// Hook de Carga Automática
import { useAutoLoadData } from "../useAutoLoadData"; 

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

  // --- LOGICA DE CARGA AUTOMÁTICA (PROVISÓRIA) ---
  // Criamos uma função ponte para o hook entender como salvar os projetos
  const handleAutoLoad = useCallback((newProject: ClientData) => {
    setProjects(prev => {
      const exists = prev.find(p => p.name === newProject.name);
      if (exists) return prev;
      return [...prev, newProject];
    });
  }, []);

  // Chamada do Hook passando a nossa função de atualização
  useAutoLoadData(handleAutoLoad);

  // Efeito para selecionar automaticamente o primeiro projeto carregado
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // --- RESTANTE DA LÓGICA ---
  const dashboardRef = useRef<HTMLDivElement>(null);
  const currentProject = projects.find(p => p.id === selectedProjectId);
  const kpis = currentProject?.projectKPIs;

  const handleExportDashboard = async () => {
    if (!dashboardRef.current || !currentProject) return;
    setIsExporting(true);
    toast({ title: "Gerando relatório...", description: "Isso pode levar alguns segundos." });

    try {
      const dataUrl = await toPng(dashboardRef.current, { 
        quality: 1,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      
      const link = document.createElement("a");
      link.href = dataUrl;
      const safeName = currentProject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      link.download = `Relatorio_AgriX_${safeName}_${dateStr}.png`;
      link.click();

      toast({ title: "Sucesso!", description: "Relatório exportado com sucesso." });
    } catch (error) {
      toast({ title: "Erro ao exportar", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

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
      toast({ title: "Formato inválido", variant: "destructive" });
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
      if (newProjects.length > 0) setSelectedProjectId(newProjects[0].id);
      toast({ title: "Sucesso!", description: `${newProjects.length} projeto(s) importado(s).` });
    } catch (error) {
      toast({ title: "Erro ao processar", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando dados dos clientes AgriX...</p>
        <div className="opacity-0"> 
          {/* Input invisível apenas para manter a lógica de upload caso a carga falhe */}
          <input type="file" onChange={handleFileInput} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
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
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button onClick={handleExportDashboard} disabled={isExporting} className="gap-2">
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Exportar Relatório
            </Button>
          </div>
        </div>

        {currentProject && kpis ? (
          <div ref={dashboardRef} className="space-y-8 bg-white p-6 rounded-xl text-slate-900 shadow-sm">
            <ProjectHeader client={currentProject} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard title="Planejado Final" value={`${kpis.finalPlanned}%`} icon={Target} variant="default" />
              <KPICard title="Realizado Final" value={`${kpis.finalRealized}%`} icon={CheckCircle2} variant="success" />
              <KPICard title="Até o Go Live" value={`${kpis.realizedAtGoLive}%`} icon={TrendingUp} variant="warning" />
              <KPICard title="Variação" value={`${kpis.variance}%`} icon={AlertTriangle} variant="danger" />
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="h-[400px] w-full">
                <SCurveChart data={currentProject.sCurveDataPercent} goLiveIndex={currentProject.goLiveIndex} />
              </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <ComparisonTable data={currentProject.sCurveDataPercent} goLiveIndex={currentProject.goLiveIndex} />
              </div>
              <PhaseTimeline phases={currentProject.projectPhases} />
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">Projeto não encontrado.</div>
        )}
      </div>
    </div>
  );
};

export default Index;