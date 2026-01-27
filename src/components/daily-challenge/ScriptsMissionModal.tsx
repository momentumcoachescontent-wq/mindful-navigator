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
import { Check, Sparkles, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SCRIPT_TEMPLATES } from '@/lib/daily-challenge-config';
import { useToast } from '@/hooks/use-toast';

interface ScriptsMissionModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (metadata: Record<string, unknown>) => Promise<{ success: boolean; xpEarned?: number }>;
}

export function ScriptsMissionModal({ open, onClose, onComplete }: ScriptsMissionModalProps) {
  const [selectedScript, setSelectedScript] = useState<string | null>(null);
  const [adaptedScript, setAdaptedScript] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const { toast } = useToast();

  const handleSelectScript = (scriptId: string) => {
    setSelectedScript(scriptId);
    const template = SCRIPT_TEMPLATES.find(s => s.id === scriptId);
    if (template) {
      setAdaptedScript(template.template);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(adaptedScript);
    toast({
      title: "Copiado",
      description: "Script copiado al portapapeles",
    });
  };

  const handleComplete = async () => {
    if (!selectedScript || !adaptedScript.trim()) return;
    
    setIsSubmitting(true);
    const result = await onComplete({
      scriptType: selectedScript,
      adaptedScript: adaptedScript.trim(),
    });
    setIsSubmitting(false);
    
    if (result.success) {
      setEarnedXP(result.xpEarned || 25);
      setCompleted(true);
    }
  };

  const handleClose = () => {
    setSelectedScript(null);
    setAdaptedScript('');
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
              Tu script está listo. Practica decirlo en voz alta para que se sienta natural.
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
            💬 Misión: Scripts de límites
          </DialogTitle>
          <DialogDescription>
            Escoge un script y adáptalo a tu situación
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Script selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Elige el tono del mensaje:</p>
            <div className="grid grid-cols-3 gap-2">
              {SCRIPT_TEMPLATES.map((script) => (
                <button
                  key={script.id}
                  onClick={() => handleSelectScript(script.id)}
                  className={cn(
                    "p-3 rounded-xl border-2 text-center transition-all",
                    selectedScript === script.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="font-medium text-sm">{script.level}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Adapted script */}
          {selectedScript && (
            <div className="animate-fade-up space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Adapta el script a tu caso:</p>
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  <Copy className="w-4 h-4 mr-1" />
                  Copiar
                </Button>
              </div>
              <Textarea
                value={adaptedScript}
                onChange={(e) => setAdaptedScript(e.target.value)}
                className="min-h-[100px]"
                placeholder="Personaliza el mensaje..."
              />
              <p className="text-xs text-muted-foreground">
                Cambia las partes entre corchetes [...] por tu situación específica
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleComplete}
              disabled={!selectedScript || !adaptedScript.trim() || isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Completar misión'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
