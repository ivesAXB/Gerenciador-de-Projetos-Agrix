import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SCurveDataPoint } from "@/types"; // <-- Importação corrigida!

interface SCurveChartProps {
  data: SCurveDataPoint[];
  goLiveIndex: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 shadow-xl">
        <p className="font-semibold text-card-foreground mb-2">{label}</p>
        
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">
              {entry.dataKey === "plannedCumulative" ? "Planejado:" : "Realizado:"}
            </span>
            <span className="font-medium text-card-foreground">{entry.value}%</span>
          </div>
        ))}

        {payload.length === 2 && (
          <div className="mt-2 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Variação:{" "}
              <span className={payload[1].value - payload[0].value >= 0 ? "text-secondary" : "text-destructive"}>
                {payload[1].value - payload[0].value > 0 ? "+" : ""}
                {/* Aqui aplicamos o .toFixed(2) para travar em 2 casas decimais */}
                {(payload[1].value - payload[0].value).toFixed(1)}%
              </span>
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const SCurveChart = ({ data, goLiveIndex }: SCurveChartProps) => {
  const goLiveMonth = data[goLiveIndex]?.month || "";

  return (
    // Trocado h-[500px] por h-full para respeitar o limite do Dashboard e não cortar
    <div className="w-full h-full min-h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        {/* Margens ajustadas para dar respiro ao texto Go Live (top) e aos Meses (bottom) */}
        <AreaChart data={data} margin={{ top: 35, right: 30, left: 0, bottom: 15 }}>
          <defs>
            <linearGradient id="plannedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="realizedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" vertical={false} />
          
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "hsl(220, 15%, 45%)", fontSize: 12 }} 
            dy={10} 
          />
          
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "hsl(220, 15%, 45%)", fontSize: 12 }} 
            domain={[0, 100]} 
            tickFormatter={(value) => `${value}%`} 
            dx={-10} 
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <ReferenceLine 
            x={goLiveMonth} 
            stroke="hsl(35, 90%, 55%)" 
            strokeWidth={3} 
            strokeDasharray="8 4" 
            label={{ value: "GO LIVE", position: "top", fill: "hsl(35, 90%, 45%)", fontSize: 14, fontWeight: "bold" }} 
          />
          
          <Area 
            type="monotone" 
            dataKey="plannedCumulative" 
            stroke="hsl(220, 70%, 50%)" 
            strokeWidth={3} 
            fill="url(#plannedGradient)" 
            name="plannedCumulative" 
            dot={{ fill: "hsl(220, 70%, 50%)", strokeWidth: 2, r: 4 }} 
            activeDot={{ r: 6, stroke: "white", strokeWidth: 2 }} 
          />
          
          <Area 
            type="monotone" 
            dataKey="realizedCumulative" 
            stroke="hsl(160, 60%, 45%)" 
            strokeWidth={3} 
            fill="url(#realizedGradient)" 
            name="realizedCumulative" 
            dot={{ fill: "hsl(160, 60%, 45%)", strokeWidth: 2, r: 4 }} 
            activeDot={{ r: 6, stroke: "white", strokeWidth: 2 }} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SCurveChart;