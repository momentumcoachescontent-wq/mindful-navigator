import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Check, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CALM_STEPS } from '@/lib/daily-challenge-config';

interface CalmMissionModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (metadata: Record<string, unknown>) => Promise<{ success: boolean; xpEarned?: number }>;
}

export function CalmMissionModal({ open, onClose, onComplete }: CalmMissionModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<string[]>(['', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  // Get today's focus step (rotates daily)
  const todaysFocus = new Date().getDay() % CALM_STEPS.length;

  const handleNext = () => {
    if (currentStep < CALM_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    const result = await onComplete({
      steps: CALM_STEPS.map((step, i) => ({
        step: step.id,
        response: responses[i],
      })),
      focusStep: CALM_STEPS[todaysFocus].id,
    });
    setIsSubmitting(false);
    
    if (result.success) {
      setEarnedXP(result.xpEarned || 20);
      setCompleted(true);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setResponses(['', '', '', '']);
    setCompleted(false);
    onClose();
  };

  const updateResponse = (value: string) => {
    const newResponses = [...responses];
    newResponses[currentStep] = value;
    setResponses(newResponses);
  };

  if (completed) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-display font-bold mb-2">¡Misión completada!</h3>
            <Badge className="bg-primary/20 text-primary border-primary/30 mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              +{earnedXP} XP
            </Badge>
            <p className="text-sm text-muted-foreground mb-6">
              Has completado C.A.L.M. Esto fortalece tu regulación emocional.
            </p>
            <Button onClick={handleClose}>Continuar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentStepData = CALM_STEPS[currentStep];
  const isFocusStep = currentStep === todaysFocus;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🧘 Misión: Regula (C.A.L.M.)
          </DialogTitle>
          <DialogDescription>
            Ejercicio guiado de regulación emocional
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {CALM_STEPS.map((step, i) => (
              <div
                key={step.id}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all",
                  i === currentStep
                    ? "bg-primary text-primary-foreground"
                    : i < currentStep
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i < currentStep ? <Check className="w-4 h-4" /> : step.icon}
              </div>
            ))}
          </div>

          {/* Current step */}
          <div className={cn(
            "p-4 rounded-xl",
            isFocusStep 
              ? "bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/30"
              : "bg-muted/50"
          )}>
            {isFocusStep && (
              <Badge className="bg-primary text-primary-foreground mb-2">
                ✨ Foco del día
              </Badge>
            )}
            <h4 className="text-lg font-bold flex items-center gap-2 mb-2">
              <span className="text-2xl">{currentStepData.icon}</span>
              {currentStepData.label}
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              {currentStepData.description}
            </p>
            
            <Textarea
              placeholder="Escribe tu reflexión..."
              value={responses[currentStep]}
              onChange={(e) => updateResponse(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          <div className="flex justify-between gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : handleClose()}
            >
              {currentStep > 0 ? 'Anterior' : 'Cancelar'}
            </Button>
            
            {currentStep < CALM_STEPS.length - 1 ? (
              <Button onClick={handleNext} className="gap-1">
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleComplete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : 'Completar misión'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
