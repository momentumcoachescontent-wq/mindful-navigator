import { AlertTriangle, CheckCircle, Info, Lightbulb, BookOpen, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ScanResultData {
  summary: string;
  alertLevel: "low" | "medium" | "high";
  redFlags: string[];
  observations: string[];
  recommendedTools: { name: string; reason: string }[];
  actionPlan: string[];
}

interface ScanResultProps {
  result: ScanResultData;
  onSaveToJournal: () => void;
  onCreatePlan: () => void;
}

const alertStyles = {
  low: {
    bg: "bg-success/10",
    border: "border-success/30",
    text: "text-success",
    icon: CheckCircle,
    label: "Nivel bajo",
  },
  medium: {
    bg: "bg-warning/10",
    border: "border-warning/30",
    text: "text-warning",
    icon: Info,
    label: "Nivel medio",
  },
  high: {
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    text: "text-destructive",
    icon: AlertTriangle,
    label: "Nivel alto",
  },
};

export function ScanResult({ result, onSaveToJournal, onCreatePlan }: ScanResultProps) {
  const alertStyle = alertStyles[result.alertLevel];
  const AlertIcon = alertStyle.icon;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Alert Level */}
      <div className={cn("rounded-2xl p-4 border-2", alertStyle.bg, alertStyle.border)}>
        <div className="flex items-start gap-3">
          <AlertIcon className={cn("w-6 h-6 flex-shrink-0 mt-0.5", alertStyle.text)} />
          <div>
            <p className={cn("font-semibold", alertStyle.text)}>{alertStyle.label}</p>
            <p className="text-sm text-foreground mt-1">{result.summary}</p>
          </div>
        </div>
      </div>

      {/* Red Flags */}
      {result.redFlags.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-coral" />
            Señales de alerta detectadas
          </h4>
          <ul className="space-y-2">
            {result.redFlags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-coral mt-2 flex-shrink-0" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Observations */}
      <div className="space-y-3">
        <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-warning" />
          Qué observar
        </h4>
        <ul className="space-y-2">
          {result.observations.map((obs, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-warning mt-2 flex-shrink-0" />
              {obs}
            </li>
          ))}
        </ul>
      </div>

      {/* Recommended Tools */}
      <div className="space-y-3">
        <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Herramientas recomendadas
        </h4>
        <div className="grid gap-2">
          {result.recommendedTools.map((tool, i) => (
            <div key={i} className="bg-muted rounded-xl p-3">
              <p className="font-medium text-foreground text-sm">{tool.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{tool.reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Plan */}
      <div className="space-y-3">
        <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-success" />
          Plan de acción (3 pasos)
        </h4>
        <ol className="space-y-2">
          {result.actionPlan.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-foreground pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <Button
          onClick={onSaveToJournal}
          className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all duration-300"
          size="lg"
        >
          <BookOpen className="w-4 h-4" />
          <span>Guardar en Diario</span>
        </Button>
      </div>
    </div>
  );
}
