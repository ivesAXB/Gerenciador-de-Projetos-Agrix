import { SCurveDataPoint } from "@/types"; // <-- Caminho corrigido aqui!
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface ComparisonTableProps {
  data: SCurveDataPoint[];
  goLiveIndex: number;
}

const ComparisonTable = ({ data, goLiveIndex }: ComparisonTableProps) => {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-card-foreground">
          Comparativo Mensal - Planejado vs Realizado
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Evolução percentual acumulado por período
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Período</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Planejado (%)</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Realizado (%)</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Variação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row, index) => {
              // Calcula a variação bruta
              const rawVariance = row.realizedCumulative - row.plannedCumulative;
              // Transforma em número para as verificações de > 0 ou < 0
              const variance = Number(rawVariance.toFixed(2));
              
              const isGoLive = index === goLiveIndex;
              const isPostGoLive = index > goLiveIndex;
              
              return (
                <tr key={row.month} className={cn("transition-colors", isGoLive && "bg-accent/10 border-l-4 border-l-accent", isPostGoLive && "bg-muted/30", !isGoLive && !isPostGoLive && "hover:bg-muted/30")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-card-foreground">{row.month}</span>
                      {isGoLive && <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full font-medium">GO LIVE</span>}
                      {isPostGoLive && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Pós Go Live</span>}
                    </div>
                  </td>
                  {/* Forçamos a exibição de 2 casas decimais (.toFixed(2)) para manter o visual alinhado */}
                  <td className="px-4 py-3 text-right"><span className="font-medium text-primary">{row.plannedCumulative.toFixed(2)}%</span></td>
                  <td className="px-4 py-3 text-right"><span className="font-medium text-secondary">{row.realizedCumulative.toFixed(2)}%</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className={cn("inline-flex items-center gap-1 font-medium", variance > 0 && "text-secondary", variance < 0 && "text-destructive", variance === 0 && "text-muted-foreground")}>
                      {variance > 0 && <ArrowUp className="h-4 w-4" />}
                      {variance < 0 && <ArrowDown className="h-4 w-4" />}
                      {variance === 0 && <Minus className="h-4 w-4" />}
                      {variance > 0 ? "+" : ""}{variance.toFixed(2)}%
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonTable;