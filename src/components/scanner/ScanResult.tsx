import { useState } from "react";
import { AlertTriangle, CheckCircle, Info, Lightbulb, BookOpen, ListChecks, Music, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ScanResultData {
  summary: string;
  alertLevel: "low" | "medium" | "high";
  redFlags: string[];
  observations: string;
  recommendedTools: { name: string; reason: string }[];
  actionPlan: { step: number; action: string }[];
  validationMessage: string;
}

interface ScanResultProps {
  result: ScanResultData;
  onSaveToJournal: () => void;
  onCreatePlan: () => void;
  isSaved?: boolean;
}

const alertStyles = {
  low: {
    bg: "bg-success/10",
    border: "border-success/30",
    text: "text-success",
    icon: CheckCircle,
    label: "Nivel bajo - Terreno Seguro",
  },
  medium: {
    bg: "bg-warning/10",
    border: "border-warning/30",
    text: "text-warning",
    icon: Info,
    label: "Nivel medio - Cautela Requerida",
  },
  high: {
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    text: "text-destructive",
    icon: AlertTriangle,
    label: "Nivel alto - Alerta Crítica",
  },
};

export default function ScanResult({ result, onSaveToJournal, onCreatePlan, isSaved }: ScanResultProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const alertStyle = alertStyles[result.alertLevel];
  const AlertIcon = alertStyle.icon;

  const slides = [
    { id: 'summary', title: 'El Veredicto' },
    { id: 'flags', title: 'Patrón Identificado' },
    { id: 'obs', title: 'Qué Observar' },
    { id: 'tools', title: 'Armería Recomendada' },
    { id: 'plan', title: 'Plan de Acción' }
  ];

  const nextSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentSlide(s => Math.min(s + 1, slides.length - 1));
  };

  const prevSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentSlide(s => Math.max(s - 1, 0));
  };

  return (
    <div className="relative min-h-[65vh] flex flex-col bg-card text-card-foreground border-2 border-primary brutal-card shadow-[8px_8px_0px_0px_hsl(var(--primary))] animate-fade-in overflow-hidden">

      {/* Progress Bar (Stories style) */}
      <div className="flex gap-1 p-6 pb-0 z-20">
        {slides.map((_, i) => (
          <div key={i} className="h-1.5 flex-1 bg-muted rounded-none overflow-hidden">
            <div
              className={cn("h-full transition-all duration-300",
                i < currentSlide ? "bg-primary w-full" : i === currentSlide ? "bg-primary w-[90%] animate-pulse" : "w-0"
              )}
            />
          </div>
        ))}
      </div>

      <div className="flex-1 w-full relative p-6 z-10 flex flex-col justify-center">
        {/* Slide 0: Summary */}
        {currentSlide === 0 && (
          <div className="space-y-6 animate-fade-up">
            <div className="inline-flex items-center gap-3 bg-background border-2 border-current px-4 py-2 shadow-[4px_4px_0px_0px_currentColor] mb-6" style={{ color: `hsl(var(--${result.alertLevel === 'high' ? 'destructive' : result.alertLevel === 'medium' ? 'warning' : 'success'}))` }}>
              <AlertIcon className="w-6 h-6" />
              <h2 className="text-xl font-display font-bold uppercase tracking-wider">{alertStyle.label}</h2>
            </div>
            <p className="text-xl md:text-2xl leading-relaxed font-medium">{result.summary}</p>
            {result.validationMessage && (
              <div className="mt-8 border-l-4 border-success pl-4 italic opacity-80">
                " {result.validationMessage} "
              </div>
            )}
          </div>
        )}

        {/* Slide 1: Red Flags */}
        {currentSlide === 1 && (
          <div className="space-y-6 animate-slide-in">
            <h3 className="text-2xl font-display font-black uppercase flex items-center gap-2 text-coral mb-8 tracking-tighter">
              <AlertTriangle className="w-8 h-8" /> Patrón Identificado
            </h3>
            {result.redFlags.length > 0 ? (
              <ul className="space-y-4">
                {result.redFlags.map((flag, i) => (
                  <li key={i} className="flex gap-4 items-start bg-background p-4 border-2 border-coral shadow-[4px_4px_0px_0px_hsl(var(--coral))] font-medium text-lg">
                    <span className="w-2 h-2 bg-coral mt-2.5 flex-shrink-0" />
                    {flag}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-lg">No se detectaron señales críticas inminentes.</p>
            )}
          </div>
        )}

        {/* Slide 2: Observations */}
        {currentSlide === 2 && (
          <div className="space-y-6 animate-slide-in">
            <h3 className="text-2xl font-display font-black uppercase flex items-center gap-2 text-warning mb-8 tracking-tighter">
              <Lightbulb className="w-8 h-8" /> Qué Observar
            </h3>
            <div className="bg-background border-2 border-warning p-6 text-foreground text-xl md:text-2xl leading-relaxed shadow-[6px_6px_0px_0px_hsl(var(--warning))] font-medium">
              {result.observations}
            </div>
          </div>
        )}

        {/* Slide 3: Tools */}
        {currentSlide === 3 && (
          <div className="space-y-6 animate-slide-in">
            <h3 className="text-2xl font-display font-black uppercase flex items-center gap-2 text-primary mb-8 tracking-tighter">
              <BookOpen className="w-8 h-8" /> Armería Recomendada
            </h3>
            <div className="space-y-4">
              {result.recommendedTools.map((tool, i) => (
                <div key={i} className="bg-background border-2 border-[hsl(var(--turquoise)_/_1)] p-5 shadow-[4px_4px_0px_0px_hsl(var(--primary))]">
                  <p className="font-bold text-xl uppercase tracking-wider">{tool.name}</p>
                  <p className="text-muted-foreground mt-2 leading-relaxed">{tool.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slide 4: Action Plan & Finish */}
        {currentSlide === 4 && (
          <div className="space-y-6 animate-slide-in flex flex-col h-full justify-center">
            <h3 className="text-2xl font-display font-black uppercase flex items-center gap-2 text-success tracking-tighter">
              <ListChecks className="w-8 h-8" /> Plan de Acción
            </h3>
            <ol className="space-y-4 flex-1">
              {result.actionPlan.map((step: any, i) => (
                <li key={i} className="flex gap-4 items-center bg-background p-4 border-2 border-success/50 shadow-[4px_4px_0px_0px_hsl(var(--success))]">
                  <span className="text-3xl font-display font-black text-success pr-4 border-r-2 border-success/30">
                    0{step.step || i + 1}
                  </span>
                  <span className="font-medium text-lg leading-tight pl-2">
                    {step.action || step.description || step.text || (typeof step === 'string' ? step : "Acata este paso.")}
                  </span>
                </li>
              ))}
            </ol>

            <div className="pt-8 flex flex-col gap-4 relative z-30">
              {isSaved ? (
                <Button onClick={onCreatePlan} className="w-full brutal-btn bg-success hover:bg-success/90 text-success-foreground py-6 text-lg" size="lg">
                  <CheckCircle className="w-5 h-5 mr-2" /> VER REGISTRO EN EL DIARIO
                </Button>
              ) : (
                <Button onClick={onSaveToJournal} className="w-full brutal-btn bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg" size="lg">
                  <BookOpen className="w-5 h-5 mr-2" /> FIJAR CONTRATO EN DIARIO
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center p-6 border-t-2 border-primary/20 bg-background/50 z-20">
        <Button variant="ghost" onClick={prevSlide} disabled={currentSlide === 0} className="font-bold uppercase tracking-wider disabled:opacity-30 relative z-30">
          <ChevronLeft className="w-5 h-5 mr-1" /> Atrás
        </Button>
        <span className="text-xs font-bold text-muted-foreground tracking-widest">{currentSlide + 1} / {slides.length}</span>
        {currentSlide < slides.length - 1 ? (
          <Button onClick={nextSlide} className="brutal-btn bg-primary hover:bg-primary text-primary-foreground relative z-30">
            Siguiente <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        ) : (
          <div className="w-[110px]" /> /* Spacer to keep alignment */
        )}
      </div>

      {/* Invisible clickable layers to advance by tapping edges (TikTok style) */}
      <div className="absolute top-10 bottom-24 right-0 w-1/2 z-0 cursor-e-resize" onClick={nextSlide} />
      <div className="absolute top-10 bottom-24 left-0 w-1/2 z-0 cursor-w-resize" onClick={prevSlide} />
    </div>
  );
}
