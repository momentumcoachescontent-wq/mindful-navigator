import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreathingExerciseProps {
  onClose: () => void;
}

const phases = [
  { name: "Inhala", duration: 4, instruction: "Respira profundamente" },
  { name: "Sostén", duration: 4, instruction: "Mantén el aire" },
  { name: "Exhala", duration: 6, instruction: "Suelta lentamente" },
  { name: "Pausa", duration: 2, instruction: "Prepárate" },
];

export function BreathingExercise({ onClose }: BreathingExerciseProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(phases[0].duration);
  const [totalCycles, setTotalCycles] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isComplete) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          const nextPhase = (currentPhase + 1) % phases.length;
          
          if (nextPhase === 0) {
            const newCycles = totalCycles + 1;
            setTotalCycles(newCycles);
            
            if (newCycles >= 5) {
              setIsComplete(true);
              return 0;
            }
          }
          
          setCurrentPhase(nextPhase);
          return phases[nextPhase].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentPhase, totalCycles, isComplete]);

  const phase = phases[currentPhase];
  const progress = ((phase.duration - secondsLeft) / phase.duration) * 100;

  if (isComplete) {
    return (
      <div className="text-center space-y-8 animate-fade-up">
        <div className="w-32 h-32 mx-auto rounded-full bg-turquoise/20 flex items-center justify-center">
          <span className="text-5xl">✨</span>
        </div>
        <div>
          <h2 className="text-2xl font-display font-semibold text-primary-foreground mb-2">
            ¡Lo lograste!
          </h2>
          <p className="text-primary-foreground/70">
            Has completado el ejercicio. ¿Cómo te sientes ahora?
          </p>
        </div>
        <Button variant="glass" size="lg" onClick={onClose}>
          Continuar
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center space-y-8 w-full max-w-sm">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-6 right-6 text-primary-foreground/70 hover:text-primary-foreground"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </Button>

      <div className="space-y-2">
        <p className="text-primary-foreground/60 text-sm">
          Ciclo {totalCycles + 1} de 5
        </p>
        <h2 className="text-4xl font-display font-bold text-primary-foreground">
          {phase.name}
        </h2>
        <p className="text-primary-foreground/70">{phase.instruction}</p>
      </div>

      {/* Breathing circle */}
      <div className="relative w-56 h-56 mx-auto">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary-foreground/20"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className="text-turquoise transition-all duration-1000"
            strokeDasharray={`${progress * 2.83} 283`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl font-display font-bold text-primary-foreground">
            {secondsLeft}
          </span>
        </div>
      </div>

      <div 
        className={`w-24 h-24 mx-auto rounded-full bg-turquoise/30 flex items-center justify-center transition-transform duration-1000 ${
          phase.name === "Inhala" ? "scale-125" : 
          phase.name === "Exhala" ? "scale-75" : "scale-100"
        }`}
      >
        <div className={`w-16 h-16 rounded-full bg-turquoise/50 transition-transform duration-1000 ${
          phase.name === "Inhala" ? "scale-110" : 
          phase.name === "Exhala" ? "scale-75" : "scale-100"
        }`} />
      </div>
    </div>
  );
}
