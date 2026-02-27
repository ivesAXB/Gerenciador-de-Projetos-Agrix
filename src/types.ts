// src/types.ts

export interface SCurveDataPoint {
  date: string;       // Ex: "Jan/26"
  month: string;      // Ex: "Jan/26" (Redundante, mas alguns gráficos pedem)
  plannedCumulative: number; // 0 a 100
  realizedCumulative: number; // 0 a 100
  // Campos opcionais que ajudam na lógica visual
  isGoLiveMonth?: boolean;
  plannedTasks?: number;
  realizedTasks?: number;
}

export interface ProjectTask {
  id: string;
  name: string;
  status: string;
  date: string;
}

export interface ProjectPhase {
  name: string;
  start: string;
  end: string;
  status: string; // "Concluído" | "Em Andamento" | "Nova"
  subProcesses: string[]; // Nomes das tarefas para exibição simples na Timeline
  tasksDetails?: ProjectTask[]; // Detalhes completos (para uso futuro)
}

export interface ProjectKPIs {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  plannedAtGoLive: number;
  realizedAtGoLive: number;
  finalPlanned: number;
  finalRealized: number;
  variance: number;
  daysRemaining?: number; // Opcional, pois depende do dia atual vs fim
}

export interface ClientData {
  id: string;
  name: string;
  location?: string;
  lastUpdated?: string;
  
  goLiveDate: string;
  goLiveDateFormatted?: string;
  goLiveIndex?: number; // Índice no array para o gráfico desenhar a linha vertical
  
  projectStartDate?: string;
  projectEndDate?: string;
  
  totalTasks: number;
  
  // O gráfico usa sCurveDataPercent na versão original, vamos manter o nome
  sCurveDataPercent: SCurveDataPoint[]; 
  
  projectKPIs: ProjectKPIs;
  projectPhases: ProjectPhase[];
}