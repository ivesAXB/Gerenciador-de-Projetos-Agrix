import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
  trend?: number;
}

const variantStyles = {
  default: "bg-card border-border",
  success: "bg-secondary/10 border-secondary/30",
  warning: "bg-accent/10 border-accent/30",
  danger: "bg-destructive/10 border-destructive/30",
};

const iconStyles = {
  default: "bg-primary/10 text-primary",
  success: "bg-secondary/20 text-secondary",
  warning: "bg-accent/20 text-accent",
  danger: "bg-destructive/20 text-destructive",
};

const KPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  trend,
}: KPICardProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-card-foreground">{value}</p>
            {trend !== undefined && (
              <span
                className={cn(
                  "text-sm font-medium",
                  trend >= 0 ? "text-secondary" : "text-destructive"
                )}
              >
                {trend >= 0 ? "+" : ""}
                {trend}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn("rounded-lg p-3", iconStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {/* Decorative element */}
      <div
        className={cn(
          "absolute -bottom-4 -right-4 h-24 w-24 rounded-full opacity-10",
          variant === "default" && "bg-primary",
          variant === "success" && "bg-secondary",
          variant === "warning" && "bg-accent",
          variant === "danger" && "bg-destructive"
        )}
      />
    </div>
  );
};

export default KPICard;
