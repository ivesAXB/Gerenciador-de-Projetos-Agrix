import * as XLSX from 'xlsx';
import { ClientData, ProjectPhase, SCurveDataPoint } from '../types';

interface ClickUpTask {
  'Task ID': string;
  'Task Name': string;
  'Parent ID'?: string;
  'Status': string;
  'Due Date'?: string | number;
  'Date Done'?: string | number;
  'Start Date'?: string | number;
}

const parseDate = (dateVal: any): Date | null => {
  if (!dateVal) return null;
  if (typeof dateVal === 'number') {
    const date = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000); 
  }
  if (typeof dateVal === 'string') {
    const parts = dateVal.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
  }
  return null;
};

const formatDate = (date: Date): string => {
  const rawMonth = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  const month = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);
  const year = date.toLocaleDateString('pt-BR', { year: '2-digit' });
  return `${month}/${year}`;
};

export const processExcelFile = async (file: File): Promise<ClientData> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  
  const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

  let projectName = file.name.replace('.xlsx', '').replace('.xls', '');
  
  if (rawData.length > 1 && rawData[1] && typeof rawData[1][0] === 'string') {
    const a2Value = rawData[1][0].trim();
    if (a2Value !== 'Task ID' && a2Value !== '') {
      projectName = a2Value;
    }
  }

  const jsonData: ClickUpTask[] = [];
  let headerMap: Record<string, number> = {};
  let foundHeaders = false;

  for (const row of rawData) {
    if (!row || !Array.isArray(row) || row.length === 0) continue;

    if (row.includes('Task ID') && row.includes('Task Name')) {
      row.forEach((colName, index) => {
        if (typeof colName === 'string') {
          headerMap[colName.trim()] = index;
        }
      });
      foundHeaders = true;
      continue;
    }

    if (!foundHeaders) continue;

    const taskId = row[headerMap['Task ID']];
    const taskName = row[headerMap['Task Name']];
    
    if (!taskName || String(taskName).trim() === '') continue;
    if (taskId === 'Task ID') continue;

    jsonData.push({
      'Task ID': String(taskId),
      'Task Name': String(taskName),
      'Parent ID': row[headerMap['Parent ID']] ? String(row[headerMap['Parent ID']]) : undefined,
      'Status': String(row[headerMap['Status']] || ''),
      'Due Date': row[headerMap['Due Date']],
      'Date Done': row[headerMap['Date Done']],
      'Start Date': row[headerMap['Start Date']]
    });
  }

  if (jsonData.length === 0) {
    throw new Error("Não foi possível encontrar as tarefas.");
  }

  const formatPhaseName = (rawName: string): string => {
    let cleanName = rawName;
    cleanName = cleanName.replace(/Monte Cristo\s*-\s*/gi, '');
    cleanName = cleanName.replace(/Bodoquena\s*-\s*/gi, '');
    cleanName = cleanName.replace(/Pomar Agrícola\s*-\s*/gi, '');
    return cleanName.trim();
  };

  const phasesMap = new Map<string, ProjectPhase>();
  
  // NOVA ESTRUTURA: Agora guardamos o Due Date e o Date Done separadamente
  const allTasks: { 
    id: string, 
    name: string, 
    dueDate: Date | null, 
    dateDone: Date | null, 
    isDone: boolean, 
    parentId: string 
  }[] = [];
  
  const parentLookup = new Map<string, string>();
  let goLiveDate: Date | null = null;
  
  jsonData.forEach((row) => {
    const taskId = row['Task ID'];
    const parentId = row['Parent ID'];
    const taskName = row['Task Name'];

    if (parentId) {
      parentLookup.set(taskId, parentId);
    }

    if (!parentId) {
        const nameLower = taskName.toLowerCase();
        if (nameLower.includes("fase") && (nameLower.includes("go-live") || nameLower.includes("início produtivo") || nameLower.includes("produção"))) {
            const d = parseDate(row['Start Date']);
            if (d) {
                goLiveDate = d;
            } else {
                const fallbackDate = parseDate(row['Due Date']);
                if (fallbackDate) goLiveDate = fallbackDate;
            }
        }

        const rawStatus = row['Status'].toUpperCase();
        let mappedStatus = 'Em Andamento';
        if (rawStatus.includes('CONCLUÍDO')) mappedStatus = 'Concluído';
        else if (rawStatus.includes('NOVA')) mappedStatus = 'Nova';

        const finalPhaseName = formatPhaseName(taskName);

        let phaseStart = "";
        let phaseEnd = "";
        const rowStartDate = parseDate(row['Start Date']);
        const rowEndDate = parseDate(row['Due Date']);

        if (rowStartDate) {
            phaseStart = rowStartDate.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit' }).replace('/', '-');
        }
        if (rowEndDate) {
            phaseEnd = rowEndDate.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit' }).replace('/', '-');
        }

        phasesMap.set(taskId, {
            name: finalPhaseName,
            start: phaseStart,
            end: phaseEnd,
            status: mappedStatus,
            subProcesses: [],
            tasksDetails: []
        });
    } else {
        const isDone = row['Status']?.toUpperCase() === 'CONCLUÍDO';
        
        // Extrai as duas datas
        allTasks.push({
            id: taskId,
            name: taskName,
            dueDate: parseDate(row['Due Date']),
            dateDone: parseDate(row['Date Done']),
            isDone: isDone,
            parentId: parentId
        });
    }
  });

  const getTopLevelPhaseId = (taskId: string): string | null => {
    let currentId = taskId;
    const visited = new Set<string>();
    while (currentId && !phasesMap.has(currentId)) {
        if (visited.has(currentId)) break;
        visited.add(currentId);
        currentId = parentLookup.get(currentId) || '';
    }
    return phasesMap.has(currentId) ? currentId : null;
  };

  const phaseDatesMap = new Map<string, Date[]>();

  const formatTaskName = (rawName: string): string => {
    let cleanName = rawName;
    cleanName = cleanName.replace(/https:\/\/app\.clickup\.com[^\s]+/g, '');
    cleanName = cleanName.replace(/Yago Rocha da Luz/g, ''); 
    cleanName = cleanName.replace(/\n/g, ' - ');
    return cleanName.trim();
  };

  allTasks.forEach(task => {
    const topLevelPhaseId = getTopLevelPhaseId(task.id);
    if (topLevelPhaseId && task.dueDate) {
        if (!phaseDatesMap.has(topLevelPhaseId)) phaseDatesMap.set(topLevelPhaseId, []);
        phaseDatesMap.get(topLevelPhaseId)!.push(task.dueDate);
    }

    if (phasesMap.has(task.parentId)) {
        const phase = phasesMap.get(task.parentId)!;
        const displayName = formatTaskName(task.name);
        if (displayName && !phase.subProcesses.includes(displayName)) {
            phase.subProcesses.push(displayName);
        }
    }
  });

  phaseDatesMap.forEach((dates, phaseId) => {
    dates.sort((a, b) => a.getTime() - b.getTime());
    const phase = phasesMap.get(phaseId)!;
    
    if (!phase.start && dates.length > 0) {
        phase.start = dates[0].toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit' }).replace('/', '-');
    }
    if (!phase.end && dates.length > 0) {
        phase.end = dates[dates.length - 1].toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit' }).replace('/', '-');
    }
  });

  const totalTasksCount = allTasks.length; 
  const completedTotal = allTasks.filter(t => t.isDone).length;
  const finalRealized = totalTasksCount > 0 ? Number(((completedTotal / totalTasksCount) * 100).toFixed(2)) : 0;

  // Filtramos apenas as tarefas que têm data de planejamento (Due Date) para montar a base do gráfico
  const tasksWithDates = allTasks.filter(t => t.dueDate !== null) as { 
    id: string, name: string, dueDate: Date, dateDone: Date | null, isDone: boolean 
  }[];
  
  if (tasksWithDates.length === 0) throw new Error("Nenhuma tarefa com data de entrega encontrada.");
  
  tasksWithDates.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  
  const startDate = tasksWithDates[0].dueDate;
  const endDate = tasksWithDates[tasksWithDates.length - 1].dueDate;
  const sCurveDataPercent: SCurveDataPoint[] = [];
  
  let iterDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const finalIterDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
  
  let goLiveIndex = -1;

  while (iterDate <= finalIterDate) {
    const monthEnd = new Date(iterDate.getFullYear(), iterDate.getMonth() + 1, 0);
    const label = formatDate(iterDate);
    
    // PLANEJADO: Lê a coluna "Due Date"
    const plannedCount = tasksWithDates.filter(t => t.dueDate <= monthEnd).length;
    
    // REALIZADO (NOVA LÓGICA): Lê a coluna "Date Done"
    const realizedCount = tasksWithDates.filter(t => {
      if (!t.isDone) return false;
      
      // Se a tarefa foi concluída e tem a data real de término, usa ela!
      if (t.dateDone) {
        return t.dateDone <= monthEnd;
      }
      
      // Fallback: Se estiver "Concluído" no ClickUp mas a coluna "Date Done" veio vazia por algum motivo,
      // a gente assume que foi feita na data limite (Due Date) para não perder o ponto.
      return t.dueDate <= monthEnd;
    }).length;

    const isGoLiveMonth = goLiveDate 
        ? (goLiveDate.getMonth() === iterDate.getMonth() && goLiveDate.getFullYear() === iterDate.getFullYear())
        : false;

    if (isGoLiveMonth) goLiveIndex = sCurveDataPercent.length;

    sCurveDataPercent.push({
        date: label,
        month: label,
        plannedCumulative: Math.min(100, Number(((plannedCount / totalTasksCount) * 100).toFixed(1))),
        realizedCumulative: Math.min(100, Number(((realizedCount / totalTasksCount) * 100).toFixed(1))),
        isGoLiveMonth,
        plannedTasks: plannedCount,
        realizedTasks: realizedCount
    });

    iterDate.setMonth(iterDate.getMonth() + 1);
  }

  let plannedAtGoLive = 0;
  let realizedAtGoLive = 0;
  
  if (goLiveDate) {
      const tasksUntilGoLive = tasksWithDates.filter(t => t.dueDate <= goLiveDate!);
      plannedAtGoLive = Number(((tasksUntilGoLive.length / totalTasksCount) * 100).toFixed(1));
      
      const realizedUntilGoLiveCount = tasksWithDates.filter(t => {
        if (!t.isDone) return false;
        if (t.dateDone) return t.dateDone <= goLiveDate!;
        return t.dueDate <= goLiveDate!;
      }).length;
      
      realizedAtGoLive = Number(((realizedUntilGoLiveCount / totalTasksCount) * 100).toFixed(1));
  }

  return {
    id: crypto.randomUUID(),
    name: projectName,
    location: "Importado via Excel",
    lastUpdated: new Date().toLocaleDateString('pt-BR'),
    goLiveDate: goLiveDate ? goLiveDate.toISOString() : "",
    goLiveDateFormatted: goLiveDate ? goLiveDate.toLocaleDateString('pt-BR') : "Não definido",
    goLiveIndex: goLiveIndex >= 0 ? goLiveIndex : sCurveDataPercent.length - 1,
    projectStartDate: startDate.toLocaleDateString('pt-BR'),
    projectEndDate: endDate.toLocaleDateString('pt-BR'),
    totalTasks: totalTasksCount,
    sCurveDataPercent,
    projectPhases: Array.from(phasesMap.values()),
    projectKPIs: {
        totalTasks: totalTasksCount,
        completedTasks: completedTotal,
        completionRate: finalRealized,
        plannedAtGoLive,
        realizedAtGoLive,
        finalPlanned: 100,
        finalRealized,
        variance: Number((finalRealized - 100).toFixed(1))
    }
  };
};