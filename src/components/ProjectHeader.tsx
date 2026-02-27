import { Calendar, MapPin, Building2 } from "lucide-react";
import { ClientData } from "@/types"; // <-- Importação atualizada!

interface ProjectHeaderProps {
  client: ClientData;
}

const ProjectHeader = ({ client }: ProjectHeaderProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8 text-primary-foreground">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-white" />
        <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/4 translate-y-1/4 rounded-full bg-white" />
      </div>
      
      <div className="relative">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              <Building2 className="h-4 w-4" />
              LBRIT - AgriX
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Implantação {client.name}
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-xl">
              Acompanhamento do progresso de implantação - Curva S Planejado vs Realizado
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 backdrop-blur-sm">
              <MapPin className="h-5 w-5 text-accent" />
              <div>
                <p className="text-xs text-primary-foreground/70">Localização</p>
                <p className="font-medium">{client.location || "Não informada"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 backdrop-blur-sm">
              <Calendar className="h-5 w-5 text-accent" />
              <div>
                <p className="text-xs text-primary-foreground/70">Go Live</p>
                <p className="font-medium">{client.goLiveDateFormatted || "Não definido"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;