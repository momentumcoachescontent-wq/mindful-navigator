import { useState } from "react";
import { ArrowRight, ArrowLeft, Shield, AlertTriangle, AlertCircle, Check, Eye, EyeOff, FileText, Phone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface Question {
  id: number;
  text: string;
  category: string;
  weight: number;
}

interface RiskLevel {
  max?: number;
  min?: number;
  title: string;
  color: string;
}

interface RiskMapProps {
  content: {
    questions: Question[];
    risk_levels: {
      green: RiskLevel;
      yellow: RiskLevel;
      red: RiskLevel;
    };
    has_discrete_mode: boolean;
    has_exit_plan: boolean;
  };
}

type RiskStep = "intro" | "questions" | "result" | "actions" | "exit_plan";

const riskColors = {
  green: {
    bg: "bg-emerald-500",
    bgLight: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-600",
  },
  yellow: {
    bg: "bg-amber-500",
    bgLight: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-600",
  },
  red: {
    bg: "bg-red-500",
    bgLight: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-600",
  },
};

interface RiskDescription {
  meaning: string;
  actions: string[];
  limits: string;
  evidence?: string;
  emergency?: boolean;
}

const riskDescriptions: Record<"green" | "yellow" | "red", RiskDescription> = {
  green: {
    meaning: "Tu situación muestra señales de una relación con dinámicas saludables o conflictos normales que pueden trabajarse.",
    actions: [
      "Mantén tus límites actuales y sigue reforzándolos",
      "Practica comunicación asertiva regularmente",
      "Cultiva tu red de apoyo y autocuidado",
    ],
    limits: "Sigue expresando tus necesidades con claridad. Celebra los pequeños avances.",
  },
  yellow: {
    meaning: "Hay señales de alerta que merecen atención. No es momento de ignorar lo que sientes.",
    actions: [
      "Habla con alguien de confianza sobre lo que estás viviendo",
      "Documenta situaciones que te incomoden (fechas, hechos)",
      "Usa las herramientas H.E.R.O. y C.A.L.M. para manejar situaciones",
    ],
    limits: "Es momento de ser más firme. 'Esto no está bien para mí y necesita cambiar.'",
    evidence: "Guarda mensajes, correos o notas de conversaciones importantes.",
  },
  red: {
    meaning: "Tu seguridad puede estar en riesgo. No estás exagerando. Esto es serio.",
    actions: [
      "Contacta a alguien de confianza AHORA",
      "Llama a una línea de ayuda especializada",
      "Prepara un plan de salida (ver abajo)",
    ],
    limits: "Prioriza tu seguridad sobre la relación. No tienes que convencer a nadie.",
    evidence: "Guarda evidencia en un lugar seguro fuera de tu hogar o en la nube.",
    emergency: true,
  },
};

const exitPlanChecklist = [
  { id: 1, text: "Identificar 2-3 personas de confianza que puedan ayudarte", icon: Users },
  { id: 2, text: "Tener documentos importantes guardados en lugar seguro", icon: FileText },
  { id: 3, text: "Guardar algo de dinero de emergencia si es posible", icon: Shield },
  { id: 4, text: "Conocer números de emergencia y líneas de ayuda", icon: Phone },
  { id: 5, text: "Tener un lugar seguro identificado donde ir si es necesario", icon: Shield },
  { id: 6, text: "Preparar una bolsa con cosas esenciales", icon: Shield },
];

export function RiskMap({ content }: RiskMapProps) {
  const [step, setStep] = useState<RiskStep>("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [isDiscreteMode, setIsDiscreteMode] = useState(false);
  const [completedChecklist, setCompletedChecklist] = useState<number[]>([]);

  const questions = content.questions;
  const totalQuestions = questions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  const calculateRiskScore = () => {
    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id]) {
        score += q.weight;
      }
    });
    return score;
  };

  const getRiskLevel = (): "green" | "yellow" | "red" => {
    const score = calculateRiskScore();
    if (score >= (content.risk_levels.red.min || 19)) return "red";
    if (score > (content.risk_levels.green.max || 8)) return "yellow";
    return "green";
  };

  const handleAnswer = (answer: boolean) => {
    setAnswers(prev => ({ ...prev, [questions[currentQuestion].id]: answer }));

    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setStep("result");
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const toggleChecklistItem = (id: number) => {
    setCompletedChecklist(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const renderIntro = () => (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
        <Shield className="w-10 h-10 text-white" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-display font-bold text-foreground">
          Mapa de Riesgo
        </h3>
        <p className="text-muted-foreground">
          Este cuestionario te ayudará a entender mejor tu situación y obtener recomendaciones personalizadas.
        </p>
      </div>

      <div className="bg-card rounded-xl p-4 text-left space-y-2 shadow-soft">
        <p className="text-sm font-medium text-foreground">Lo que obtendrás:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            Evaluación de riesgo (semáforo)
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            3 microacciones para hoy
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            Límites recomendados
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            Plan de salida (si aplica)
          </li>
        </ul>
      </div>

      {content.has_discrete_mode && (
        <button
          onClick={() => setIsDiscreteMode(!isDiscreteMode)}
          className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isDiscreteMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {isDiscreteMode ? "Modo discreto activado" : "Activar modo discreto"}
        </button>
      )}

      <Button onClick={() => setStep("questions")} variant="calm" className="w-full">
        Comenzar evaluación
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );

  const renderQuestions = () => {
    const question = questions[currentQuestion];

    if (isDiscreteMode) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Pregunta {currentQuestion + 1} de {totalQuestions}</span>
              {currentQuestion > 0 && (
                <button onClick={handleBack} className="flex items-center gap-1 hover:text-foreground">
                  <ArrowLeft className="w-3 h-3" /> Anterior
                </button>
              )}
            </div>
            <Progress value={progress} />
          </div>

          <div className="bg-card rounded-xl p-5 shadow-soft">
            <p className="text-muted-foreground/60 text-xs leading-relaxed">{question.text}</p>
            <p className="text-[10px] text-muted-foreground/30 mt-2 italic">Modo discreto: texto reducido por tu seguridad</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => handleAnswer(true)} variant="outline" className="flex-1 h-14">
              Sí
            </Button>
            <Button onClick={() => handleAnswer(false)} variant="outline" className="flex-1 h-14">
              No
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Pregunta {currentQuestion + 1} de {totalQuestions}</span>
            {currentQuestion > 0 && (
              <button onClick={handleBack} className="flex items-center gap-1 hover:text-foreground">
                <ArrowLeft className="w-3 h-3" /> Anterior
              </button>
            )}
          </div>
          <Progress value={progress} />
        </div>

        <div className="bg-card rounded-xl p-5 shadow-soft">
          <p className="text-foreground font-medium leading-relaxed">{question.text}</p>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => handleAnswer(true)} variant="outline" className="flex-1 h-14">
            Sí
          </Button>
          <Button onClick={() => handleAnswer(false)} variant="outline" className="flex-1 h-14">
            No
          </Button>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    const riskLevel = getRiskLevel();
    const colors = riskColors[riskLevel];
    const description = riskDescriptions[riskLevel];
    const levelInfo = content.risk_levels[riskLevel];

    return (
      <div className="space-y-6">
        {/* Semáforo visual */}
        <div className="text-center space-y-4">
          <div className={cn(
            "w-24 h-24 mx-auto rounded-full flex items-center justify-center",
            colors.bg
          )}>
            {riskLevel === "green" && <Shield className="w-12 h-12 text-white" />}
            {riskLevel === "yellow" && <AlertTriangle className="w-12 h-12 text-white" />}
            {riskLevel === "red" && <AlertCircle className="w-12 h-12 text-white" />}
          </div>

          <div>
            <h3 className={cn("text-xl font-display font-bold", colors.text)}>
              {levelInfo.title}
            </h3>
          </div>
        </div>

        {/* Qué significa */}
        <div className={cn("rounded-xl p-4 border", colors.bgLight, colors.border)}>
          <p className="text-sm font-medium text-foreground mb-2">¿Qué significa esto?</p>
          <p className="text-sm text-muted-foreground">{description.meaning}</p>
        </div>

        {/* Microacciones */}
        <div className="bg-card rounded-xl p-4 shadow-soft space-y-3">
          <p className="text-sm font-medium text-foreground">3 microacciones para hoy:</p>
          <ol className="space-y-2">
            {description.actions.map((action, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-foreground">{action}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Límites */}
        <div className="bg-secondary/10 rounded-xl p-4 border border-secondary/20">
          <p className="text-sm font-medium text-foreground mb-2">💪 Qué límites poner:</p>
          <p className="text-sm text-muted-foreground">{description.limits}</p>
        </div>

        {/* Evidencia (solo amarillo y rojo) */}
        {description.evidence && (
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-sm font-medium text-foreground mb-2">📝 Qué evidencia guardar:</p>
            <p className="text-sm text-muted-foreground">{description.evidence}</p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="space-y-3">
          {riskLevel === "red" && content.has_exit_plan && (
            <Button onClick={() => setStep("exit_plan")} variant="destructive" className="w-full">
              <AlertCircle className="w-4 h-4" />
              Ver Plan de Salida
            </Button>
          )}

          <Button onClick={() => setStep("intro")} variant="outline" className="w-full">
            Hacer otra evaluación
          </Button>
        </div>
      </div>
    );
  };

  const renderExitPlan = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-500 flex items-center justify-center">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-display font-bold text-foreground">
          Plan de Salida
        </h3>
        <p className="text-sm text-muted-foreground">
          Prepárate para cuando necesites actuar. No tienes que hacer todo hoy.
        </p>
      </div>

      {/* Líneas de ayuda */}
      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 space-y-2">
        <p className="text-sm font-medium text-destructive">📞 Líneas de ayuda 24/7:</p>
        <ul className="text-sm space-y-1">
          <li className="text-foreground">• Línea de emergencia: 911</li>
          <li className="text-foreground">• Línea de la Mujer: 800-911-2000</li>
          <li className="text-foreground">• SAPTEL: 55 5259-8121</li>
        </ul>
      </div>

      {/* Checklist */}
      <div className="bg-card rounded-xl p-4 shadow-soft space-y-3">
        <p className="text-sm font-medium text-foreground">Tu checklist de preparación:</p>
        <ul className="space-y-2">
          {exitPlanChecklist.map((item) => {
            const Icon = item.icon;
            const isComplete = completedChecklist.includes(item.id);
            return (
              <li key={item.id}>
                <button
                  onClick={() => toggleChecklistItem(item.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all",
                    isComplete ? "bg-primary/10" : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                    isComplete ? "bg-primary border-primary" : "border-muted-foreground"
                  )}>
                    {isComplete && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={cn(
                    "text-sm",
                    isComplete ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {item.text}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-4">
          {completedChecklist.length} de {exitPlanChecklist.length} completados
        </p>
        <Button onClick={() => setStep("result")} variant="outline">
          <ArrowLeft className="w-4 h-4" />
          Volver a resultados
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {step === "intro" && renderIntro()}
      {step === "questions" && renderQuestions()}
      {step === "result" && renderResult()}
      {step === "exit_plan" && renderExitPlan()}
    </div>
  );
}
