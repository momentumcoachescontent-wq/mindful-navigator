import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Smile, Meh, Frown, Zap, Battery, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

interface MoodCheckInProps {
  onComplete: (data: { mood: number; energy: number; stress: number }) => void;
}

const moodOptions = [
  { value: 1, icon: Frown, label: "Difícil", color: "text-coral" },
  { value: 2, icon: Meh, label: "Regular", color: "text-warning" },
  { value: 3, icon: Smile, label: "Bien", color: "text-success" },
];

export function MoodCheckIn({ onComplete }: MoodCheckInProps) {
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number>(5);
  const [stress, setStress] = useState<number>(5);
  const [step, setStep] = useState(0);

  const handleSubmit = () => {
    if (mood !== null) {
      onComplete({ mood, energy, stress });
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-soft space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-display font-semibold text-foreground">
          ¿Cómo te sientes hoy?
        </h3>
        <p className="text-sm text-muted-foreground">
          Tu check-in diario ayuda a identificar patrones
        </p>
      </div>

      {step === 0 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex gap-3 justify-center">
            {moodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setMood(option.value);
                  setStep(1);
                }}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300",
                  mood === option.value
                    ? "border-primary bg-primary/10 scale-105"
                    : "border-transparent bg-muted hover:bg-muted/80"
                )}
              >
                <option.icon className={cn("w-10 h-10", option.color)} />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          {/* Energy slider */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning" />
              <span className="text-sm font-medium">Energía</span>
              <span className="ml-auto text-sm text-muted-foreground">{energy}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Stress slider */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-coral" />
              <span className="text-sm font-medium">Estrés</span>
              <span className="ml-auto text-sm text-muted-foreground">{stress}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={stress}
              onChange={(e) => setStress(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-coral"
            />
          </div>

          <Button variant="calm" className="w-full" onClick={handleSubmit}>
            Guardar check-in
          </Button>
        </div>
      )}
    </div>
  );
}
