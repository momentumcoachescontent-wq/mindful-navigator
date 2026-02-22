import { useState, useEffect } from "react";
import { ArrowRight, Check, RefreshCw, Save, Sparkles, MessageCircle, Loader2, Send, User, Bot, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { xpEventBus } from "@/lib/xpEventBus";
import confetti from "canvas-confetti";

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
  action_plan?: { step: number; action: string }[];
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
  const navigate = useNavigate();

  const [step, setStep] = useState<SimulatorStep>("scenario");

  // Perfiles y escenarios por defecto para asegurar variedad incluso si la DB no está actualizada
  const defaultScenarios = [
    { id: "jefe", label: "Jefe/a", icon: "briefcase" },
    { id: "pareja", label: "Pareja", icon: "heart" },
    { id: "madre_padre", label: "Padre/Madre", icon: "users" },
    { id: "ex_pareja", label: "Ex-Pareja", icon: "user-minus" },
    { id: "colega", label: "Colega", icon: "user-plus" }
  ];

  const defaultPersonalities = [
    { id: "dominante", label: "Perfil Dominante", description: "Se comunica con autoridad y espera resultados." },
    { id: "pasivo_agresivo", label: "Pasivo-Agresivo", description: "Usa el sarcasmo o el silencio para manipular." },
    { id: "victima", label: "Perfil Víctima", description: "Culpa a los demás y evita responsabilidad." },
    { id: "evitativo", label: "Perfil Evitativo", description: "Evita el conflicto y las conversaciones profundas." },
    { id: "explosivo", label: "Perfil Explosivo", description: "Reacciones desproporcionadas y desborde emocional." }
  ];

  const scenarios = [
    ...defaultScenarios,
    ...(content?.scenarios || [])
  ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

  const personalities = [
    ...defaultPersonalities,
    ...(content?.personalities || [])
  ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [isCustomScenario, setIsCustomScenario] = useState(false);
  const [customScenarioText, setCustomScenarioText] = useState("");
  const [selectedPersonality, setSelectedPersonality] = useState<Personality | null>(null);
  const [extraTrait, setExtraTrait] = useState<string>("neutral");
  const [context, setContext] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentRound, setCurrentRound] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [scripts, setScripts] = useState<Script | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);

  const maxRounds = 3; // Limitar a 3 interacciones

  const handleScenarioSelect = (scenario: Scenario | 'custom') => {
    if (scenario === 'custom') {
      setIsCustomScenario(true);
      setSelectedScenario({ id: 'custom', label: 'Situación Personalizada', icon: 'edit' });
    } else {
      setIsCustomScenario(false);
      setSelectedScenario(scenario);
    }
    setStep("personality");
  };

  const handlePersonalitySelect = (personality: Personality) => {
    setSelectedPersonality(personality);
    setStep("context");
  };

  const handleContextSubmit = () => {
    if (isCustomScenario && !customScenarioText.trim()) return;
    if (!isCustomScenario && !context.trim()) return;
    setStep("chat");
    generateSimulatorResponse(true);
  };

  const generateSimulatorResponse = async (isFirst = false, currentMessages: Message[] = messages) => {
    if (!selectedScenario || !selectedPersonality) return;

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
      const scenarioLabel = isCustomScenario ? customScenarioText : selectedScenario.label;
      const { data, error } = await supabase.functions.invoke("analyze-situation", {
        body: {
          situation: `Simulación de rol: ${scenarioLabel} - Trait: ${extraTrait}`,
          mode: "roleplay",
          scenario: scenarioLabel,
          personality: selectedPersonality.id,
          personalityDescription: `${selectedPersonality.description}. Rasgo adicional: ${extraTrait}`,
          context: isCustomScenario ? customScenarioText : context,
          messages: currentMessages,
          isFirst,
          currentRound,
          maxRounds,
        },
      });

      if (error) {
        console.error("Supabase function error:", error);
        let errorMessage = error.message;

        // Attempt to extract detail from context
        try {
          // @ts-ignore
          if (error.context && typeof error.context.json === 'function') {
            // @ts-ignore
            const detail = await error.context.json();
            errorMessage = detail.error || detail.message || errorMessage;
          }
        } catch (e) {
          console.warn("Could not parse error detail", e);
        }

        throw new Error(errorMessage || "Error de comunicación con el servidor");
      }

      let content = "Error: Respuesta vacía o formato inválido";

      if (data?.response) {
        content = data.response;
      } else if (data?.analysis) {
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

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setCurrentInput("");
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);

    if (nextRound >= maxRounds) {
      generateFeedback(newMessages);
    } else {
      generateSimulatorResponse(false, newMessages);
    }
  };

  const generateFeedback = async (allMessages: Message[]) => {
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
      const scenarioLabel = isCustomScenario ? customScenarioText : selectedScenario?.label;
      const { data, error } = await supabase.functions.invoke("analyze-situation", {
        body: {
          mode: "feedback",
          scenario: scenarioLabel,
          personality: selectedPersonality?.id,
          context: isCustomScenario ? customScenarioText : context,
          messages: allMessages,
        },
      });

      if (error) {
        // @ts-ignore
        const detail = error.context ? await error.context.json().catch(() => ({})) : {};
        throw new Error(detail.error || error.message);
      }

      const feedbackData = data?.feedback || data;
      if (feedbackData) {
        setFeedback({
          overall: feedbackData.overall || "Sin análisis detallado",
          clarity: feedbackData.clarity || 0,
          firmness: feedbackData.firmness || 0,
          empathy: feedbackData.empathy || 0,
          traps: Array.isArray(feedbackData.traps) ? feedbackData.traps : [],
          recommended_tools: Array.isArray(feedbackData.recommended_tools) ? feedbackData.recommended_tools : [],
          action_plan: Array.isArray(feedbackData.action_plan) ? feedbackData.action_plan : []
        });
      }

      const scriptsData = data?.scripts || feedbackData?.scripts;
      if (scriptsData) {
        setScripts({
          soft: scriptsData.soft || "No disponible",
          firm: scriptsData.firm || "No disponible",
          final_warning: scriptsData.final_warning || "No disponible"
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

  // Helper para mapear personalidad a etiqueta de grupo
  const getPersonalityTag = (personalityLabel: string): string[] => {
    const lowerLabel = personalityLabel.toLowerCase();

    if (lowerLabel.includes('jefe') || lowerLabel.includes('colega') || lowerLabel.includes('entrevistador')) {
      return ['work'];
    }
    if (lowerLabel.includes('pareja') || lowerLabel.includes('ex')) {
      return ['relationships'];
    }
    if (lowerLabel.includes('padre') || lowerLabel.includes('madre') || lowerLabel.includes('familiar')) {
      return ['family'];
    }
    if (lowerLabel.includes('amigo') || lowerLabel.includes('vecino')) {
      return ['friends'];
    }

    return ['self']; // Default fallback
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
      const scenarioLabel = isCustomScenario ? customScenarioText : selectedScenario?.label;

      const contentData = {
        type: "simulation_result",
        scenario: scenarioLabel || "",
        personality: selectedPersonality?.label || "",
        personality_trait: extraTrait,
        evaluation: {
          clarity: feedback?.clarity || 0,
          firmness: feedback?.firmness || 0,
          empathy: feedback?.empathy || 0
        },
        feedback: feedback?.overall || "",
        traps: feedback?.traps || [],
        recommended_tools: feedback?.recommended_tools?.map(t => ({
          name: t,
          reason: "Recomendado por el Asistente",
          completed: false
        })) || [],
        scripts: {
          soft: scripts.soft,
          firm: scripts.firm,
          final_warning: scripts.final_warning
        },
        messages: messages, // Persist the conversation transcript
        action_plan: feedback?.action_plan || [], // Persist the action plan
        is_completed: false, // Logic for the user to mark as completed
        follow_up: true // Activar seguimiento por defecto para simulaciones
      };

      const { data, error } = await supabase.from("journal_entries").insert({
        user_id: session.user.id,
        entry_type: "reflection",  // DB CHECK constraint only allows: daily, victory, reflection, scanner_result
        content: JSON.stringify({
          ...contentData,
          tags: getPersonalityTag(selectedPersonality?.label || ''),
          title: `Simulación: ${scenarioLabel}`,
          text: `Simulación de rol: ${scenarioLabel} con ${selectedPersonality?.label}. Resultado: ${feedback?.overall}`
        })
      }).select().single();

      if (error) throw error;

      if (data) {
        setSavedEntryId(data.id);

        // --- XP REWARD LOGIC ---
        const XP_REWARD = 30;
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // Register in daily_missions
        const uniqueMissionId = `simulation_${Date.now()}`;
        await supabase.from('daily_missions').insert([{
          user_id: session.user.id,
          mission_type: 'tool_protocol',
          mission_id: uniqueMissionId,
          xp_earned: XP_REWARD,
          mission_date: today,
          metadata: { tool_tag: 'simulation', scenario: scenarioLabel }
        } as never]).then(({ error: mErr }) => {
          if (mErr) console.error('Error inserting daily mission:', mErr);
        });

        // Update total XP in user_progress
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('total_xp')
          .eq('user_id', session.user.id)
          .single();

        if (progressData) {
          const newXP = (progressData.total_xp || 0) + XP_REWARD;
          await supabase
            .from('user_progress')
            .update({ total_xp: newXP } as never)
            .eq('user_id', session.user.id);
        }

        // Visual reward
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4ade80', '#2dd4bf', '#0f172a']
        });

        // Notify dashboard to refresh XP
        xpEventBus.emit(XP_REWARD);

        toast({
          title: "¡Simulación guardada! +30 XP",
          description: "Tu simulación y recompensa han sido registradas en tu diario.",
        });
      }
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
    setIsCustomScenario(false);
    setCustomScenarioText("");
    setSelectedPersonality(null);
    setExtraTrait("neutral");
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
          Elige el tipo de relación o registra tu propia situación
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => handleScenarioSelect(scenario)}
            className="bg-card p-4 rounded-xl border-2 border-transparent hover:border-primary/50 transition-all text-left shadow-soft"
          >
            <p className="font-medium text-foreground">{scenario.label}</p>
          </button>
        ))}
        <button
          onClick={() => handleScenarioSelect('custom')}
          className="bg-primary/5 p-4 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary transition-all text-left flex flex-col items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-primary" />
          <p className="font-medium text-primary">Situación Personalizada</p>
        </button>
      </div>
    </div>
  );

  const renderPersonalityStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-display font-bold text-foreground">
          ¿Cómo es esta persona?
        </h3>
        <p className="text-sm text-muted-foreground">
          Selecciona su perfil y un rasgo adicional
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {personalities.map((personality) => (
            <button
              key={personality.id}
              onClick={() => handlePersonalitySelect(personality)}
              className={cn(
                "w-full bg-card p-4 rounded-xl border-2 transition-all text-left shadow-soft",
                selectedPersonality?.id === personality.id ? "border-primary bg-primary/5" : "border-transparent"
              )}
            >
              <p className="font-medium text-foreground">{personality.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{personality.description}</p>
            </button>
          ))}
        </div>

        {selectedPersonality && (
          <div className="space-y-3 pt-4 border-t border-border">
            <p className="text-sm font-medium text-foreground text-center">Rasgo de personalidad adicional:</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'aggressive', label: 'Enojado/a' },
                { id: 'avoidant', label: 'Evitativo/a' },
                { id: 'victim', label: 'Víctima' },
                { id: 'neutral', label: 'Neutral' },
                { id: 'ironic', label: 'Irónico/a' },
                { id: 'explosive', label: 'Explosivo/a' }
              ].map((trait) => (
                <button
                  key={trait.id}
                  onClick={() => setExtraTrait(trait.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                    extraTrait === trait.id ? "bg-primary text-white border-primary" : "bg-muted text-muted-foreground border-transparent"
                  )}
                >
                  {trait.label}
                </button>
              ))}
            </div>
            <Button onClick={() => setStep("context")} className="w-full mt-4">
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderContextStep = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-display font-bold text-foreground">
          {isCustomScenario ? "Describe tu situación" : "Añade contexto"}
        </h3>
        <p className="text-sm text-muted-foreground">
          Para una simulación más real, danos un poco más de detalle
        </p>
      </div>

      <div className="relative">
        <Textarea
          value={isCustomScenario ? customScenarioText : context}
          onChange={(e) => isCustomScenario ? setCustomScenarioText(e.target.value) : setContext(e.target.value)}
          placeholder={isCustomScenario
            ? "Ej: Mi suegra siempre hace comentarios sobre mi cocina delante de mi esposo y no sé cómo pararla sin sonar grosera..."
            : "Ej: Esto pasó ayer en la oficina después de la reunión de las 5..."
          }
          className="min-h-[150px] bg-card border-border resize-none pr-12"
        />
      </div>

      <Button
        onClick={handleContextSubmit}
        disabled={isCustomScenario ? !customScenarioText.trim() : !context.trim()}
        className="w-full"
        variant="calm"
      >
        Comenzar desafío (3 rondas)
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );

  const renderChatStep = () => (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-xl p-3 text-center">
        <p className="text-xs text-muted-foreground">
          Interacción {currentRound + 1} de {maxRounds} • {selectedPersonality?.label} ({extraTrait})
        </p>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={cn(
              "p-4 rounded-2xl max-w-[90%] text-sm leading-relaxed shadow-sm",
              msg.role === "user"
                ? "bg-primary text-primary-foreground ml-auto rounded-br-none"
                : "bg-card text-foreground border border-border rounded-bl-none"
            )}
          >
            {msg.content}
          </div>
        ))}

        {isLoading && (
          <div className="bg-card p-3 rounded-2xl rounded-bl-none max-w-[85%] flex items-center gap-2 border border-border shadow-sm">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground italic">La persona está pensando...</span>
          </div>
        )}
      </div>

      {currentRound < maxRounds && !isLoading && (
        <div className="flex gap-2 items-end pt-2">
          <div className="flex-1 relative">
            <Textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Escribe tu respuesta..."
              className="min-h-[80px] bg-card border-border resize-none w-full rounded-xl shadow-soft pr-10"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleUserMessage();
                }
              }}
            />
          </div>
          <Button
            onClick={handleUserMessage}
            disabled={!currentInput.trim()}
            size="icon"
            className="h-10 w-10 shrink-0"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );

  const renderFeedbackStep = () => (
    <div className="space-y-6">
      {isLoading ? (
        <div className="text-center py-16 space-y-4">
          <div className="relative inline-block">
            <Sparkles className="w-16 h-16 text-primary animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 text-primary animate-ping opacity-25">
              <Sparkles className="w-16 h-16" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-display font-bold">Analizando la dinámica...</p>
            <p className="text-sm text-muted-foreground">Extrayendo claves de transformación</p>
          </div>
        </div>
      ) : feedback ? (
        <>
          {/* ... existing feedback render logic ... */}
          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground italic">Análisis del Umbral</p>
              <p className="text-sm leading-relaxed italic">"{feedback.overall}"</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Claridad', value: feedback.clarity, color: 'text-primary' },
                { label: 'Firmeza', value: feedback.firmness, color: 'text-secondary' },
                { label: 'Empatía', value: feedback.empathy, color: 'text-turquoise' }
              ].map((stat) => (
                <div key={stat.label} className="bg-card p-3 rounded-xl text-center shadow-soft border border-border/50">
                  <div className={cn("text-xl font-bold", stat.color)}>{stat.value}/10</div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Action Plan Section */}
            {feedback.action_plan && feedback.action_plan.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Check className="w-5 h-5" />
                  <p className="text-sm font-bold uppercase tracking-tight">Plan de Acción Sugerido</p>
                </div>
                <ul className="space-y-2">
                  {feedback.action_plan.map((step, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {step.step || i + 1}
                      </div>
                      <span>{step.action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-coral/5 border border-coral/20 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-coral">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-xs font-bold uppercase tracking-tight">Trampas Detectadas</p>
                </div>
                {feedback.traps.length > 0 ? (
                  <ul className="space-y-2">
                    {feedback.traps.map((trap, i) => (
                      <li key={i} className="text-xs text-foreground flex items-start gap-2">
                        <span className="text-coral mt-1">•</span>
                        <span>{trap}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic">¡Sin trampas! Manejo impecable.</p>
                )}
              </div>

              <div className="bg-turquoise/5 border border-turquoise/20 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-turquoise">
                  <Sparkles className="w-4 h-4" />
                  <p className="text-xs font-bold uppercase tracking-tight">Claves de Poder</p>
                </div>
                <p className="text-[11px] text-foreground leading-relaxed italic">
                  Para este perfil, recuerda: mantén tu centro y no morder el anzuelo de la {extraTrait === 'victim' ? 'culpa' : 'reactividad'}.
                </p>
              </div>
            </div>

            {scripts && (
              <div className="pt-4 border-t border-border space-y-3">
                <p className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Scripts de Transformación</p>
                <div className="grid gap-2">
                  <div className="p-3 rounded-xl bg-turquoise/5 border border-turquoise/20">
                    <p className="text-[9px] font-bold uppercase text-turquoise mb-1">Empatía + Límite</p>
                    <p className="text-xs italic">"{scripts.soft}"</p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-[9px] font-bold uppercase text-primary mb-1">Firmeza Directa</p>
                    <p className="text-xs italic">"{scripts.firm}"</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button onClick={() => setStep("scripts")} variant="calm" className="w-full h-12 text-md shadow-medium">
            Ver Todos los Scripts y Guardar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </>
      ) : step === "feedback" && !isLoading ? (
        <div className="text-center space-y-6 py-10">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Error en el análisis</h3>
            <p className="text-sm text-muted-foreground">
              El servidor tardó demasiado o devolvió un error. No te preocupes, tu conversación está guardada.
            </p>
          </div>
          <Button
            onClick={() => generateFeedback(messages)}
            variant="outline"
            className="w-full"
          >
            Reintentar Análisis
          </Button>
          <Button
            onClick={() => setStep("chat")}
            variant="ghost"
            className="w-full text-xs"
          >
            Volver al chat
          </Button>
        </div>
      ) : null}
    </div>
  );

  const renderScriptsStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-display font-bold text-foreground">
          Tu Kit de Respuestas
        </h3>
        <p className="text-sm text-muted-foreground">
          Adapta estas frases según la intensidad de la situación
        </p>
      </div>

      {scripts && (
        <div className="space-y-4">
          <div className="bg-card p-5 rounded-2xl shadow-soft border border-turquoise/20 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-turquoise transition-all group-hover:w-2"></div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-turquoise/20 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-turquoise" />
              </div>
              <p className="text-xs font-bold text-turquoise uppercase tracking-widest">Nivel 1: Empatía + Límite</p>
            </div>
            <p className="text-sm text-foreground leading-relaxed italic">"{scripts.soft}"</p>
          </div>

          <div className="bg-card p-5 rounded-2xl shadow-soft border border-warning/20 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-warning transition-all group-hover:w-2"></div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center">
                <MessageCircle className="w-3.5 h-3.5 text-warning" />
              </div>
              <p className="text-xs font-bold text-warning uppercase tracking-widest">Nivel 2: Firmeza Absoluta</p>
            </div>
            <p className="text-sm text-foreground leading-relaxed italic">"{scripts.firm}"</p>
          </div>

          <div className="bg-card p-5 rounded-2xl shadow-soft border border-coral/20 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-coral transition-all group-hover:w-2"></div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-coral/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-coral" />
              </div>
              <p className="text-xs font-bold text-coral uppercase tracking-widest">Nivel 3: Corte de Patrón</p>
            </div>
            <p className="text-sm text-foreground leading-relaxed italic">"{scripts.final_warning}"</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleSaveAsActionPlan}
          disabled={isSaving}
          className="w-full h-12 shadow-medium text-md"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Guardando en Diario...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Guardar en mi Diario
            </>
          )}
        </Button>
        <div className="flex gap-2">
          <Button onClick={handleRestart} variant="outline" className="flex-1 h-10">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reiniciar
          </Button>
          <Button
            onClick={() => navigate(savedEntryId ? `/journal/${savedEntryId}` : '/journal')}
            variant="ghost"
            className="flex-1 h-10"
          >
            {savedEntryId ? "Ver Entrada" : "Ir al Diario"}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {["scenario", "personality", "context", "chat", "feedback", "scripts"].map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              step === s ? "w-8 bg-primary" :
                ["scenario", "personality", "context", "chat", "feedback", "scripts"].indexOf(step) > i
                  ? "w-2 bg-primary/40" : "w-1.5 bg-muted"
            )}
          />
        ))}
      </div>

      <div className="bg-card/30 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-white/20 shadow-xl min-h-[500px] flex flex-col">
        {step === "scenario" && renderScenarioStep()}
        {step === "personality" && renderPersonalityStep()}
        {step === "context" && renderContextStep()}
        {step === "chat" && renderChatStep()}
        {step === "feedback" && renderFeedbackStep()}
        {step === "scripts" && renderScriptsStep()}
      </div>
    </div>
  );
}
