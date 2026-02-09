import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Heart, Brain, Sparkles, ChevronRight, Check, User, Briefcase, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

type Step = "slides" | "name" | "demographics" | "goals";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [step, setStep] = useState<Step>("slides");

  // Data State
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleNextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setStep("name");
    }
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: name,
          age_range: ageRange,
          gender: gender,
          occupation: occupation,
          goals: selectedGoals,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success("¡Perfil creado con éxito!");
      navigate("/");
    } catch (error: any) {
      toast.error("Error al guardar perfil: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Render Functions
  if (step === "name") {
    return (
      <div className="min-h-screen bg-background flex flex-col p-6 items-center justify-center animate-fade-in">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <User className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-display font-bold">¿Cómo quieres que te llamemos?</h1>
            <p className="text-muted-foreground">Tu nombre será usado para personalizar tu experiencia.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre o Apodo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Alex"
                className="text-lg py-6"
                autoFocus
              />
            </div>
            <Button
              variant="calm"
              size="xl"
              className="w-full"
              disabled={!name.trim()}
              onClick={() => setStep("demographics")}
            >
              Continuar <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "demographics") {
    return (
      <div className="min-h-screen bg-background flex flex-col p-6 items-center justify-center animate-fade-in">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-display font-bold">Cuéntanos un poco sobre ti</h1>
            <p className="text-muted-foreground">Esto nos ayuda a entender mejor a nuestra comunidad.</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Rango de Edad</Label>
              <Select value={ageRange} onValueChange={setAgeRange}>
                <SelectTrigger className="py-6">
                  <SelectValue placeholder="Selecciona tu rango de edad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18-24">18 - 24 años</SelectItem>
                  <SelectItem value="25-34">25 - 34 años</SelectItem>
                  <SelectItem value="35-44">35 - 44 años</SelectItem>
                  <SelectItem value="45-54">45 - 54 años</SelectItem>
                  <SelectItem value="55+">55+ años</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Género</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="py-6">
                  <SelectValue placeholder="¿Cómo te identificas?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hombre">Hombre</SelectItem>
                  <SelectItem value="Mujer">Mujer</SelectItem>
                  <SelectItem value="No binario">No binario</SelectItem>
                  <SelectItem value="Prefiero no decir">Prefiero no decir</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ocupación</Label>
              <Select value={occupation} onValueChange={setOccupation}>
                <SelectTrigger className="py-6">
                  <SelectValue placeholder="¿A qué te dedicas?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Estudiante">Estudiante</SelectItem>
                  <SelectItem value="Trabajo">Trabajo</SelectItem>
                  <SelectItem value="Estudio y Trabajo">Estudio y Trabajo</SelectItem>
                  <SelectItem value="Desempleado/a">Desempleado/a</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="calm"
              size="xl"
              className="w-full mt-4"
              disabled={!ageRange || !gender || !occupation}
              onClick={() => setStep("goals")}
            >
              Continuar <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "goals") {
    return (
      <div className="min-h-screen bg-background flex flex-col p-6 animate-fade-in">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-display font-bold text-foreground">
              ¿Qué quieres lograr, {name}?
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

        <div className="pt-6 space-y-3 max-w-md mx-auto w-full">
          <Button
            variant="calm"
            size="xl"
            className="w-full"
            onClick={handleComplete}
            disabled={selectedGoals.length === 0 || isLoading}
          >
            {isLoading ? "Guardando..." : "Comenzar mi camino"}
            {!isLoading && <Sparkles className="w-5 h-5 ml-2" />}
          </Button>
        </div>
      </div>
    );
  }

  // Slides Step
  const slide = slides[currentSlide];
  const SlideIcon = slide.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip button */}
      <div className="p-4 flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setStep("name")}>
          Omitir intro
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
          onClick={handleNextSlide}
        >
          {currentSlide === slides.length - 1 ? "Comenzar" : "Siguiente"}
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
