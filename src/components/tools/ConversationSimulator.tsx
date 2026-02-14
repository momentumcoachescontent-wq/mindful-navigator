import { useState, useEffect } from "react";
import { ArrowRight, Check, RefreshCw, Save, Sparkles, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Scenario {
  id: string;
  label: string;
  icon: string;
}

interface Personality {
  id: string;
  label: string;
  description: string;
}

interface ConversationSimulatorProps {
  content: {
    scenarios: Scenario[];
    personalities: Personality[];
    rounds: number;
    feedback_categories: string[];
    script_versions: string[];
  };
}

interface Message {
  role: "user" | "simulator";
  content: string;
}

interface Feedback {
  clarity: number;
  firmness: number;
  empathy: number;
  traps: string[];
  overall: string;
  recommended_tools?: string[];
}

interface Script {
  soft: string;
  firm: string;
  final_warning: string;
}

type SimulatorStep = "scenario" | "personality" | "context" | "chat" | "feedback" | "scripts";

export function ConversationSimulator({ content }: ConversationSimulatorProps) {
  const { session } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<SimulatorStep>("scenario");
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [selectedPersonality, setSelectedPersonality] = useState<Personality | null>(null);
  const [context, setContext] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentRound, setCurrentRound] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [scripts, setScripts] = useState<Script | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const maxRounds = content.rounds;

  const handleScenarioSelect = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setStep("personality");
  };

  const handlePersonalitySelect = (personality: Personality) => {
    setSelectedPersonality(personality);
    setStep("context");
  };

  const handleContextSubmit = () => {
    if (!context.trim()) return;
    setStep("chat");
    generateSimulatorResponse(true);
  };

  const generateSimulatorResponse = async (isFirst = false, currentMessages: Message[] = messages) => {
    if (!selectedScenario || !selectedPersonality) return;

    // Validate session before making authenticated request
    if (!session?.access_token) {
      toast({
        title: "Sesión expirada",
        description: "Por favor inicia sesión nuevamente.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-situation", {
        body: {
          situation: `Simulación de rol: ${selectedScenario.label} - ${context.substring(0, 50)}...`, // Dummy field for old code compatibility
          mode: "roleplay",
          scenario: selectedScenario.label,
          personality: selectedPersonality.id,
          personalityDescription: selectedPersonality.description,
          context,
          messages: currentMessages,
          isFirst,
          currentRound,
          maxRounds,
        },
      });

      if (error) {
        // Try to parse detailed error from Edge Function response
        // @ts-ignore
        const detail = error.context ? await error.context.json().catch(() => ({})) : {};
        throw new Error(detail.error || error.message || "Error desconocido");
      }

      console.log("Edge Function Response Data [v2]:", data);

      let content = "Error: Respuesta vacía o formato inválido";

      if (data?.response) {
        content = data.response;
      } else if (data?.analysis) {
        content = `[Modo Análisis]: ${data.analysis.summary || "Análisis completado sin resumen."}`;
      } else if (data?.success && data?.analysis) {
        // Fallback for success=true format
        content = `[Modo Análisis]: ${data.analysis.summary || "Análisis completado sin resumen."}`;
      }

      const simulatorMessage: Message = {
        role: "simulator",
        content: content,
      };
      setMessages(prev => [...prev, simulatorMessage]);
    } catch (error: any) {
      console.error("Error generating response:", error);
      toast({
        title: "Error de Simulación",
        description: error.message || "No se pudo generar la respuesta.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserMessage = () => {
    if (!currentInput.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: currentInput,
    };

    // Optimistic update
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setCurrentInput("");
    setCurrentRound(prev => prev + 1);

    if (currentRound + 1 >= maxRounds) {
      // Generate feedback after last round
      generateFeedback(newMessages);
    } else {
      // Generate next simulator response immediately with fresh state
      generateSimulatorResponse(false, newMessages);
    }
  };

  const generateFeedback = async (allMessages: Message[]) => {
    // Validate session before making authenticated request
    if (!session?.access_token) {
      toast({
        title: "Sesión expirada",
        description: "Por favor inicia sesión nuevamente.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setStep("feedback");

    try {
      const { data, error } = await supabase.functions.invoke("analyze-situation", {
        body: {
          situation: `Generación de feedback: ${context.substring(0, 50)}...`, // Dummy field
          mode: "feedback",
          scenario: selectedScenario?.label,
          personality: selectedPersonality?.id,
          context,
          messages: allMessages,
        },
      });

      if (error) {
        // @ts-ignore
        const detail = error.context ? await error.context.json().catch(() => ({})) : {};
        throw new Error(detail.error || error.message);
      }

      if (data?.feedback) {
        setFeedback({
          overall: data.feedback?.overall || "Sin análisis detallado",
          clarity: data.feedback?.clarity || 0,
          firmness: data.feedback?.firmness || 0,
          empathy: data.feedback?.empathy || 0,
          traps: Array.isArray(data.feedback?.traps) ? data.feedback.traps : [],
          recommended_tools: Array.isArray(data.feedback?.recommended_tools) ? data.feedback.recommended_tools : []
        });
      } else {
        console.warn("Feedback missing in response", data);
        setFeedback({
          overall: "No se pudo generar el análisis detallado.",
          clarity: 0,
          firmness: 0,
          empathy: 0,
          traps: [],
          recommended_tools: []
        });
      }

      if (data?.scripts) {
        setScripts({
          soft: data.scripts?.soft || "No disponible",
          firm: data.scripts?.firm || "No disponible",
          final_warning: data.scripts?.final_warning || "No disponible"
        });
      } else {
        setScripts({
          soft: "No disponible",
          firm: "No disponible",
          final_warning: "No disponible"
        });
      }
    } catch (error: any) {
      console.error("Error generating feedback:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el feedback.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewScripts = () => {
    setStep("scripts");
  };

  const handleSaveAsActionPlan = async () => {
    if (!session?.user?.id || !scripts) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para guardar.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Save to dedicated conversation_simulations table
      const { error, data } = await supabase.from("conversation_simulations").insert({
        user_id: session.user.id,
        scenario: selectedScenario?.label || "",
        personality: selectedPersonality?.label || "",
        clarity_score: feedback?.clarity || 0,
        firmness_score: feedback?.firmness || 0,
        empathy_score: feedback?.empathy || 0,
        feedback_text: feedback?.overall || "",
        traps: feedback?.traps || [],
        recommended_tools: feedback?.recommended_tools || [],
        script_soft: scripts.soft,
        script_firm: scripts.firm,
        script_final_warning: scripts.final_warning
      }).select();

      if (error) {
        console.error("Error saving simulation:", error);
        throw error;
      }

      console.log("Simulation saved successfully:", data);

      toast({
        title: "¡Guardado!",
        description: "Tu simulación ha sido guardada exitosamente en tu diario.",
      });
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestart = () => {
    setStep("scenario");
    setSelectedScenario(null);
    setSelectedPersonality(null);
    setContext("");
    setMessages([]);
    setCurrentInput("");
    setCurrentRound(0);
    setFeedback(null);
    setScripts(null);
  };

  const renderScenarioStep = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-display font-bold text-foreground">
          ¿Con quién necesitas practicar?
        </h3>
        <p className="text-sm text-muted-foreground">
          Elige el tipo de relación para personalizar el entrenamiento
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {content.scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => handleScenarioSelect(scenario)}
            className="bg-card p-4 rounded-xl border-2 border-transparent hover:border-primary/50 transition-all text-left shadow-soft"
          >
            <p className="font-medium text-foreground">{scenario.label}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderPersonalityStep = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-display font-bold text-foreground">
          ¿Cómo es esta persona?
        </h3>
        <p className="text-sm text-muted-foreground">
          Selecciona el patrón de comportamiento más común
        </p>
      </div>

      <div className="space-y-3">
        {content.personalities.map((personality) => (
          <button
            key={personality.id}
            onClick={() => handlePersonalitySelect(personality)}
            className="w-full bg-card p-4 rounded-xl border-2 border-transparent hover:border-primary/50 transition-all text-left shadow-soft"
          >
            <p className="font-medium text-foreground">{personality.label}</p>
            <p className="text-sm text-muted-foreground mt-1">{personality.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderContextStep = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-display font-bold text-foreground">
          Describe la situación
        </h3>
        <p className="text-sm text-muted-foreground">
          ¿Qué límite quieres poner? ¿Cuál es el contexto?
        </p>
      </div>

      <Textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Ej: Mi jefe me pide que trabaje los fines de semana sin compensación y quiero establecer un límite claro..."
        className="min-h-[150px] bg-card border-border resize-none"
      />

      <Button
        onClick={handleContextSubmit}
        disabled={!context.trim()}
        className="w-full"
        variant="calm"
      >
        Comenzar simulación
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );

  const renderChatStep = () => (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-xl p-3 text-center">
        <p className="text-xs text-muted-foreground">
          Ronda {currentRound + 1} de {maxRounds} • {selectedPersonality?.label}
        </p>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={cn(
              "p-3 rounded-2xl max-w-[85%] text-sm",
              msg.role === "user"
                ? "bg-primary text-primary-foreground ml-auto rounded-br-md"
                : "bg-card text-foreground border border-border rounded-bl-md"
            )}
          >
            {msg.content}
          </div>
        ))}

        {isLoading && (
          <div className="bg-card p-3 rounded-2xl rounded-bl-md max-w-[85%] flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Escribiendo...</span>
          </div>
        )}
      </div>

      {currentRound < maxRounds && !isLoading && (
        <div className="flex gap-2">
          <Textarea
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            placeholder="Escribe tu respuesta..."
            className="min-h-[80px] bg-card border-border resize-none flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleUserMessage();
              }
            }}
          />
          <Button
            onClick={handleUserMessage}
            disabled={!currentInput.trim()}
            size="icon"
            className="h-auto"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );

  const renderFeedbackStep = () => (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-center py-12 space-y-4">
          <Sparkles className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Analizando tu conversación...</p>
        </div>
      ) : feedback ? (
        <>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-display font-bold text-foreground">
              Tu Feedback
            </h3>
            <p className="text-sm text-muted-foreground">{feedback.overall}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card p-4 rounded-xl text-center shadow-soft">
              <div className="text-2xl font-bold text-primary">{feedback.clarity}/10</div>
              <p className="text-xs text-muted-foreground mt-1">Claridad</p>
            </div>
            <div className="bg-card p-4 rounded-xl text-center shadow-soft">
              <div className="text-2xl font-bold text-secondary">{feedback.firmness}/10</div>
              <p className="text-xs text-muted-foreground mt-1">Firmeza</p>
            </div>
            <div className="bg-card p-4 rounded-xl text-center shadow-soft">
              <div className="text-2xl font-bold text-turquoise">{feedback.empathy}/10</div>
              <p className="text-xs text-muted-foreground mt-1">Empatía</p>
            </div>
          </div>

          {feedback.traps.length > 0 && (
            <div className="bg-coral/10 border border-coral/20 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-coral">⚠️ Trampas detectadas:</p>
              <ul className="space-y-1">
                {feedback.traps.map((trap, i) => (
                  <li key={i} className="text-sm text-foreground">• {trap}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.recommended_tools && feedback.recommended_tools.length > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-primary">🛠️ Herramientas recomendadas:</p>
              <ul className="space-y-1">
                {feedback.recommended_tools.map((tool, i) => (
                  <li key={i} className="text-sm text-foreground">• {tool}</li>
                ))}
              </ul>
            </div>
          )}

          <Button onClick={handleViewScripts} variant="calm" className="w-full">
            Ver scripts sugeridos
            <ArrowRight className="w-4 h-4" />
          </Button>
        </>
      ) : null}
    </div>
  );

  const renderScriptsStep = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-display font-bold text-foreground">
          Tus Scripts
        </h3>
        <p className="text-sm text-muted-foreground">
          3 versiones según el nivel de firmeza que necesites
        </p>
      </div>

      {scripts && (
        <div className="space-y-3">
          <div className="bg-card p-4 rounded-xl shadow-soft space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-turquoise"></span>
              <p className="text-sm font-medium text-foreground">Versión suave</p>
            </div>
            <p className="text-sm text-muted-foreground">{scripts.soft}</p>
          </div>

          <div className="bg-card p-4 rounded-xl shadow-soft space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-warning"></span>
              <p className="text-sm font-medium text-foreground">Versión firme</p>
            </div>
            <p className="text-sm text-muted-foreground">{scripts.firm}</p>
          </div>

          <div className="bg-card p-4 rounded-xl shadow-soft space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-coral"></span>
              <p className="text-sm font-medium text-foreground">Última advertencia</p>
            </div>
            <p className="text-sm text-muted-foreground">{scripts.final_warning}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleSaveAsActionPlan}
          disabled={isSaving}
          className="flex-1" // Changed from w-full to flex-1 to match original layout
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar plan
            </>
          )}
        </Button>
        <Button onClick={handleRestart} variant="outline" className="flex-1">
          <RefreshCw className="w-4 h-4" />
          Nueva simulación
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {["scenario", "personality", "context", "chat", "feedback", "scripts"].map((s, i) => (
          <div
            key={s}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              step === s ? "w-6 bg-primary" :
                ["scenario", "personality", "context", "chat", "feedback", "scripts"].indexOf(step) > i
                  ? "bg-primary/50" : "bg-muted"
            )}
          />
        ))}
      </div>

      {step === "scenario" && renderScenarioStep()}
      {step === "personality" && renderPersonalityStep()}
      {step === "context" && renderContextStep()}
      {step === "chat" && renderChatStep()}
      {step === "feedback" && renderFeedbackStep()}
      {step === "scripts" && renderScriptsStep()}
    </div>
  );
}
