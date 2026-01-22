import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Heart, Brain, Sparkles, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
  {
    icon: Shield,
    title: "Tu espacio seguro",
    description: "Aquí puedes explorar tus emociones, reconocer patrones y aprender a protegerte con herramientas prácticas.",
    gradient: "from-secondary to-primary",
  },
  {
    icon: Brain,
    title: "Reconoce las señales",
    description: "Aprende a identificar dinámicas que te afectan. El Escáner IA te ayuda a ver con claridad lo que a veces es difícil nombrar.",
    gradient: "from-turquoise to-turquoise-light",
  },
  {
    icon: Heart,
    title: "Pon límites con calma",
    description: "Descubre herramientas como H.E.R.O. y C.A.L.M. para responder con firmeza y sin perder tu paz.",
    gradient: "from-coral to-coral-light",
  },
];

const goals = [
  { id: "limits", label: "Aprender a poner límites", icon: Shield },
  { id: "anxiety", label: "Manejar mi ansiedad", icon: Brain },
  { id: "relationships", label: "Mejorar mis relaciones", icon: Heart },
  { id: "confidence", label: "Ganar confianza en mí", icon: Sparkles },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [step, setStep] = useState<"slides" | "goals">("slides");

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setStep("goals");
    }
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleComplete = () => {
    // TODO: Save goals to user preferences
    navigate("/");
  };

  if (step === "goals") {
    return (
      <div className="min-h-screen bg-background flex flex-col p-6">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-display font-bold text-foreground">
              ¿Qué quieres lograr?
            </h1>
            <p className="text-muted-foreground">
              Selecciona una o más metas para personalizar tu experiencia
            </p>
          </div>

          <div className="space-y-3">
            {goals.map((goal) => {
              const isSelected = selectedGoals.includes(goal.id);
              return (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <goal.icon className="w-6 h-6" />
                  </div>
                  <span className="flex-1 text-left font-medium text-foreground">
                    {goal.label}
                  </span>
                  {isSelected && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-6 space-y-3">
          <Button
            variant="calm"
            size="xl"
            className="w-full"
            onClick={handleComplete}
            disabled={selectedGoals.length === 0}
          >
            Comenzar mi camino
            <Sparkles className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={handleComplete}
          >
            Omitir por ahora
          </Button>
        </div>
      </div>
    );
  }

  const slide = slides[currentSlide];
  const SlideIcon = slide.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip button */}
      <div className="p-4 flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setStep("goals")}>
          Omitir
        </Button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div
          className={cn(
            "w-32 h-32 rounded-3xl bg-gradient-to-br flex items-center justify-center mb-8 animate-float",
            slide.gradient
          )}
        >
          <SlideIcon className="w-16 h-16 text-white" />
        </div>

        <h1 className="text-3xl font-display font-bold text-foreground mb-4 animate-fade-up">
          {slide.title}
        </h1>
        <p className="text-lg text-muted-foreground max-w-sm animate-fade-up" style={{ animationDelay: "0.1s" }}>
          {slide.description}
        </p>
      </div>

      {/* Navigation */}
      <div className="p-6 space-y-6">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentSlide
                  ? "w-8 bg-primary"
                  : "bg-muted"
              )}
            />
          ))}
        </div>

        <Button
          variant="calm"
          size="xl"
          className="w-full"
          onClick={handleNext}
        >
          {currentSlide === slides.length - 1 ? "Continuar" : "Siguiente"}
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
