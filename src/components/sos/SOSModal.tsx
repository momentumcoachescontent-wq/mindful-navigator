import { X, MessageCircle, Wind, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { BreathingExercise } from "./BreathingExercise";
import { ProfessionalResources } from "./ProfessionalResources";

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SOSModal({ isOpen, onClose }: SOSModalProps) {
  const [showBreathing, setShowBreathing] = useState(false);
  const [showResources, setShowResources] = useState(false);

  if (!isOpen) return null;

  if (showBreathing) {
    return (
      <div className="fixed inset-0 z-[100] bg-secondary/95 flex items-center justify-center p-6">
        <BreathingExercise onClose={() => {
          setShowBreathing(false);
          onClose();
        }} />
      </div>
    );
  }

  if (showResources) {
    return (
      <ProfessionalResources 
        onBack={() => setShowResources(false)} 
        onClose={() => {
          setShowResources(false);
          onClose();
        }} 
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-xl flex items-end justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-elevated p-6 animate-slide-up space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-semibold text-foreground">
            Apoyo Rápido
          </h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Estás a salvo aquí. Elige lo que necesitas ahora.
        </p>

        <div className="space-y-3">
          <Button
            variant="warmth"
            className="w-full justify-start gap-3"
            onClick={() => setShowBreathing(true)}
          >
            <Wind className="w-5 h-5" />
            <span>Ejercicio de calma (90 seg)</span>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={() => {/* TODO: Send to trusted contacts */}}
          >
            <MessageCircle className="w-5 h-5" />
            <span>Mensaje a contacto de confianza</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={() => setShowResources(true)}
          >
            <BookOpen className="w-5 h-5" />
            <span>Recursos de ayuda profesional</span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          Esta app es un apoyo, no reemplaza ayuda profesional de emergencia.
        </p>
      </div>
    </div>
  );
}
