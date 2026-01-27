import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Heart, Shield, Crown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SOS_CARD_TYPES } from '@/lib/daily-challenge-config';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SOSCardMissionModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (metadata: Record<string, unknown>) => Promise<{ success: boolean; xpEarned?: number }>;
}

// Pre-defined SOS cards
const SOS_CARDS = {
  say: [
    { title: 'Establecer límite claro', content: '"Entiendo tu posición, pero mi respuesta es no. No voy a cambiar de opinión sobre esto."' },
    { title: 'Pedir tiempo', content: '"Necesito tiempo para pensar esto. Te responderé mañana."' },
    { title: 'Expresar sentimientos', content: '"Cuando haces/dices eso, me siento [emoción]. Necesito que [petición clara]."' },
    { title: 'Finalizar discusión', content: '"No voy a continuar esta conversación si me sigues hablando así. Podemos retomar cuando estemos más tranquilos."' },
  ],
  not_say: [
    { title: 'Evitar justificaciones', content: 'No digas: "Lo siento, es que yo..." - Tu límite no necesita excusas.' },
    { title: 'No negociar límites', content: 'No digas: "Bueno, quizás si tú..." - Un límite no es una negociación.' },
    { title: 'Evitar minimizar', content: 'No digas: "No es para tanto, pero..." - Tus sentimientos son válidos.' },
    { title: 'No asumir culpa', content: 'No digas: "Tienes razón, soy..." - No aceptes culpas que no te corresponden.' },
  ],
  do: [
    { title: 'Respira antes de responder', content: 'Cuenta hasta 5 antes de reaccionar. Tu respuesta meditada vale más que una impulsiva.' },
    { title: 'Sal del espacio', content: 'Si sientes escalada emocional, tienes derecho a salir. "Necesito un momento" es válido.' },
    { title: 'Documenta si es necesario', content: 'Si la situación se repite, anota fecha, hora y qué pasó. La evidencia protege.' },
    { title: 'Contacta a alguien', content: 'Habla con tu persona de confianza después. Procesar con apoyo es más sano.' },
  ],
};

export function SOSCardMissionModal({ open, onClose, onComplete }: SOSCardMissionModalProps) {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [currentCard, setCurrentCard] = useState<{ title: string; content: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  useEffect(() => {
    if (open && !selectedType) {
      // Randomly select a card type
      const types = Object.keys(SOS_CARDS);
      const randomType = types[Math.floor(Math.random() * types.length)];
      selectRandomCard(randomType);
    }
  }, [open]);

  const selectRandomCard = (type: string) => {
    const cards = SOS_CARDS[type as keyof typeof SOS_CARDS];
    const randomCard = cards[Math.floor(Math.random() * cards.length)];
    setSelectedType(type);
    setCurrentCard(randomCard);
    setIsSaved(false);
  };

  const handleSaveCard = async () => {
    if (!user || !currentCard || !selectedType) return;
    
    await supabase.from('sos_cards').insert([{
      user_id: user.id,
      card_type: selectedType,
      title: currentCard.title,
      content: currentCard.content,
      is_favorite: true,
    }] as never);
    
    setIsSaved(true);
  };

  const handleComplete = async () => {
    if (!currentCard || !selectedType) return;
    
    setIsSubmitting(true);
    const result = await onComplete({
      cardType: selectedType,
      cardTitle: currentCard.title,
      saved: isSaved,
    });
    setIsSubmitting(false);
    
    if (result.success) {
      setEarnedXP(result.xpEarned || 30);
      setCompleted(true);
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setCurrentCard(null);
    setIsSaved(false);
    setCompleted(false);
    onClose();
  };

  const getTypeInfo = (type: string) => {
    return SOS_CARD_TYPES.find(t => t.id === type);
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
              {isSaved 
                ? 'Tu Tarjeta SOS está guardada. Accede a ella cuando la necesites.'
                : 'Recuerda esta tarjeta para tu próxima situación difícil.'
              }
            </p>
            <Button onClick={handleClose}>Continuar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const typeInfo = selectedType ? getTypeInfo(selectedType) : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Tarjeta SOS del día
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Tu herramienta de emergencia para situaciones difíciles
          </DialogDescription>
        </DialogHeader>

        {currentCard && typeInfo && (
          <div className="space-y-4">
            {/* Card type selector */}
            <div className="flex gap-2">
              {SOS_CARD_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => selectRandomCard(type.id)}
                  className={cn(
                    "flex-1 p-2 rounded-lg border-2 text-center transition-all text-xs",
                    selectedType === type.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="block text-lg mb-1">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>

            {/* Card content */}
            <div className={cn(
              "p-4 rounded-xl border-2",
              typeInfo.id === 'say' && "border-primary/30 bg-primary/5",
              typeInfo.id === 'not_say' && "border-destructive/30 bg-destructive/5",
              typeInfo.id === 'do' && "border-success/30 bg-success/5"
            )}>
              <div className="flex items-start justify-between mb-3">
                <Badge className={cn(
                  typeInfo.id === 'say' && "bg-primary/20 text-primary",
                  typeInfo.id === 'not_say' && "bg-destructive/20 text-destructive",
                  typeInfo.id === 'do' && "bg-success/20 text-success"
                )}>
                  {typeInfo.icon} {typeInfo.label}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => selectRandomCard(selectedType)}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              
              <h4 className="font-bold mb-2">{currentCard.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentCard.content}
              </p>
            </div>

            {/* Save to favorites */}
            <Button 
              variant={isSaved ? "secondary" : "outline"} 
              className="w-full"
              onClick={handleSaveCard}
              disabled={isSaved}
            >
              <Heart className={cn("w-4 h-4 mr-2", isSaved && "fill-current")} />
              {isSaved ? 'Guardada en favoritas' : 'Guardar en favoritas'}
            </Button>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleComplete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Completando...' : 'Completar misión'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
