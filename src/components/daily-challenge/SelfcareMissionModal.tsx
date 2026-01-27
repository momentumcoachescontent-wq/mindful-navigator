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
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SELFCARE_ACTIONS } from '@/lib/daily-challenge-config';

interface SelfcareMissionModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (metadata: Record<string, unknown>) => Promise<{ success: boolean; xpEarned?: number }>;
}

export function SelfcareMissionModal({ open, onClose, onComplete }: SelfcareMissionModalProps) {
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  const toggleAction = (actionId: string) => {
    setSelectedActions(prev => 
      prev.includes(actionId) 
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  const handleComplete = async () => {
    if (selectedActions.length === 0) return;
    
    setIsSubmitting(true);
    const result = await onComplete({
      actions: selectedActions,
    });
    setIsSubmitting(false);
    
    if (result.success) {
      setEarnedXP(result.xpEarned || 25);
      setCompleted(true);
    }
  };

  const handleClose = () => {
    setSelectedActions([]);
    setCompleted(false);
    onClose();
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
              El autocuidado es un acto revolucionario. ¡Sigue cuidándote!
            </p>
            <Button onClick={handleClose}>Continuar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            💜 Misión: Plan de autocuidado
          </DialogTitle>
          <DialogDescription>
            Elige al menos 1 micro-acción de cuidado personal para hoy
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {SELFCARE_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => toggleAction(action.id)}
                className={cn(
                  "p-3 rounded-xl border-2 flex items-center gap-2 transition-all",
                  selectedActions.includes(action.id)
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>

          {selectedActions.length > 0 && (
            <p className="text-sm text-muted-foreground text-center animate-fade-up">
              {selectedActions.length} acción(es) seleccionada(s)
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleComplete}
              disabled={selectedActions.length === 0 || isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Completar misión'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
