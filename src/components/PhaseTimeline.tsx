import { ProjectPhase } from "@/types"; // <-- Importação corrigida!
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, PlayCircle, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PhaseTimelineProps {
  phases: ProjectPhase[];
}

const PhaseTimeline = ({ phases }: PhaseTimelineProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Concluído": return <CheckCircle2 className="h-5 w-5 text-secondary" />;
      case "Em Andamento": return <PlayCircle className="h-5 w-5 text-accent" />;
      default: return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Concluído": return "bg-secondary";
      case "Em Andamento": return "bg-accent";
      default: return "bg-muted";
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">Fases do Projeto</h3>
      <Accordion type="multiple" className="space-y-2">
        {phases.map((phase, index) => (
          <AccordionItem key={index} value={`phase-${index}`} className="border border-border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3 w-full">
                <div className="shrink-0">{getStatusIcon(phase.status)}</div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-card-foreground text-sm">{phase.name}</p>
                  <p className="text-xs text-muted-foreground">{phase.start} → {phase.end}</p>
                </div>
                <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white shrink-0", getStatusColor(phase.status))}>
                  {phase.status}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {phase.subProcesses && phase.subProcesses.length > 0 && (
                <ul className="space-y-1.5 pl-8 pb-1">
                  {phase.subProcesses.map((sub, subIdx) => (
                    <li key={subIdx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {sub}
                    </li>
                  ))}
                </ul>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default PhaseTimeline;