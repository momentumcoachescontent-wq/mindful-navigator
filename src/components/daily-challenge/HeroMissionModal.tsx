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
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HERO_CATEGORIES } from '@/lib/daily-challenge-config';

interface HeroMissionModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (metadata: Record<string, unknown>) => Promise<{ success: boolean; xpEarned?: number }>;
}

export function HeroMissionModal({ open, onClose, onComplete }: HeroMissionModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [evidence, setEvidence] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  const handleComplete = async () => {
    if (!selectedCategory || !evidence.trim()) return;
    
    setIsSubmitting(true);
    const result = await onComplete({
      category: selectedCategory,
      evidence: evidence.trim(),
    });
    setIsSubmitting(false);
    
    if (result.success) {
      setEarnedXP(result.xpEarned || 20);
      setCompleted(true);
    }
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setEvidence('');
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
              Has detectado una señal H.E.R.O. Esto te ayuda a reconocer patrones.
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
            🔍 Misión: Detecta (H.E.R.O.)
          </DialogTitle>
          <DialogDescription>
            Identifica 1 señal en una situación real o pasada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-3">¿Qué tipo de señal detectaste?</p>
            <div className="grid grid-cols-2 gap-2">
              {HERO_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "p-3 rounded-xl border-2 text-left transition-all",
                    selectedCategory === cat.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="text-2xl block mb-1">{cat.icon}</span>
                  <span className="font-medium text-sm">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedCategory && (
            <div className="animate-fade-up">
              <p className="text-sm font-medium mb-2">
                Describe brevemente la situación:
              </p>
              <Textarea
                placeholder="Ejemplo: Cuando le dije que no podía ayudarle, me dijo que era egoísta..."
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                className="min-h-[80px]"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {evidence.length}/200 caracteres
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleComplete}
              disabled={!selectedCategory || !evidence.trim() || isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Completar misión'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
