
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, Save, RefreshCw, MessageSquare } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SCENARIOS = [
    { id: "boundaries", label: "Establecer límites con un familiar" },
    { id: "breakup", label: "Terminar una relación tóxica" },
    { id: "work", label: "Pedir un aumento o cambio en el trabajo" },
    { id: "social", label: "Rechazar una invitación social" },
    { id: "custom", label: "Escenario personalizado" },
] as const;

const PERSONALITIES = [
    { id: "aggressive", label: "Agresivo/Dominante", description: "Interrumpe, alza la voz, usa intimidación" },
    { id: "passive_aggressive", label: "Pasivo-Agresivo", description: "Usa sarcasmo, victimización, culpa sutil" },
    { id: "victim", label: "Victimista", description: "Te hace sentir culpable, llora, dice que nadie lo quiere" },
    { id: "dismissive", label: "Evitativo/Indiferente", description: "Ignora tus sentimientos, cambia de tema, minimiza" },
    { id: "manipulative", label: "Manipulador", description: "Tergiversa tus palabras, gaslighting, usa tus miedos" },
] as const;

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

export const ConversationSimulator = () => {
    const { session } = useAuth();
    const { toast } = useToast();
    const [step, setStep] = useState<"setup" | "simulation" | "feedback" | "scripts">("setup");
    const [selectedScenario, setSelectedScenario] = useState<(typeof SCENARIOS)[number] | null>(null);
    const [customScenario, setCustomScenario] = useState("");
    const [selectedPersonality, setSelectedPersonality] = useState<(typeof PERSONALITIES)[number] | null>(null);
    const [context, setContext] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentInput, setCurrentInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [scripts, setScripts] = useState<Script | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleStartSimulation = async () => {
        if (!selectedScenario || !selectedPersonality) return;

        setStep("simulation");
        setMessages([]);
        setIsLoading(true);

        try {
            // Helper message for context
            const initialContext = `Escenario: ${selectedScenario.id === 'custom' ? customScenario : selectedScenario.label}. 
      Personalidad: ${selectedPersonality.label} (${selectedPersonality.description}).
      Contexto extra: ${context}`;

            // First call to initialize the "Opponent"
            const { data, error } = await supabase.functions.invoke("analyze-situation", {
                body: {
                    situation: "START_SIMULATION", // Dummy
                    mode: "roleplay",
                    scenario: selectedScenario.id === 'custom' ? customScenario : selectedScenario.label,
                    personality: selectedPersonality.id,
                    personalityDescription: selectedPersonality.description,
                    context: initialContext,
                    isFirst: true,
                    currentRound: 0,
                    maxRounds: 5
                },
            });

            if (error) throw error;

            if (data.response) {
                setMessages([{ role: "simulator", content: data.response }]);
            }
        } catch (error: any) {
            console.error("Error starting simulation:", error);
            toast({
                title: "Error",
                description: "No se pudo iniciar la simulación. Verifica tu conexión.",
                variant: "destructive",
            });
            setStep("setup"); // Go back
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!currentInput.trim()) return;

        const userMsg: Message = { role: "user", content: currentInput };
        setMessages((prev) => [...prev, userMsg]);
        setCurrentInput("");
        setIsLoading(true);

        try {
            // Check if we should end simulation (e.g., after 5 rounds or if user says "stop")
            // For now, let's keep it simple: Simulator responds

            const { data, error } = await supabase.functions.invoke("analyze-situation", {
                body: {
                    situation: "CONTINUE_SIMULATION",
                    mode: "roleplay",
                    scenario: selectedScenario!.label,
                    personality: selectedPersonality!.id,
                    personalityDescription: selectedPersonality!.description,
                    context: context,
                    messages: [...messages, userMsg], // Send history
                    isFirst: false,
                    currentRound: Math.floor(messages.length / 2) + 1,
                    maxRounds: 5
                },
            });

            if (error) throw error;

            const simulatorMessage: Message = {
                role: "simulator",
                content: data.response || (data.analysis ? `[Modo Análisis]: ${data.analysis.summary}` : "Error: Respuesta vacía del servidor"),
            };

            setMessages((prev) => [...prev, simulatorMessage]);

        } catch (error: any) {
            console.error("Error in simulation loop:", error);
            toast({
                title: "Error",
                description: "Error al obtener respuesta del simulador.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinishSimulation = async () => {
        setStep("feedback");
        setIsLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke("analyze-situation", {
                body: {
                    situation: "ANALYZE_FEEDBACK",
                    mode: "feedback",
                    scenario: selectedScenario!.label,
                    context: context,
                    messages: messages,
                },
            });

            if (error) throw error;

            if (data.feedback) {
                setFeedback(data.feedback);
            }
            if (data.scripts) {
                setScripts(data.scripts);
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
        if (!session?.user?.id || !scripts) return;

        setIsSaving(true);

        try {
            const { error } = await supabase.from("scanner_history").insert([{
                user_id: session.user.id,
                situation_text: `Simulación: ${selectedScenario?.label} con persona ${selectedPersonality?.label}`,
                ai_response: JSON.stringify({ feedback, scripts }),
                action_plan: JSON.parse(JSON.stringify({
                    context,
                    scripts,
                    savedAt: new Date().toISOString(),
                })),
                recommended_tools: ["conversation-simulator", ...(feedback?.recommended_tools || [])],
            }]);

            if (error) throw error;

            // Also save to Journal
            const { error: journalError } = await supabase.from("journal_entries").insert([{
                user_id: session.user.id,
                entry_type: "simulation_result",
                content: `Simulación: ${selectedScenario?.label}\n\nFeedback General: ${feedback?.overall}`,
                tags: ["simulación", "comunicación", ...(feedback?.recommended_tools || [])],
                metadata: {
                    scenario: selectedScenario?.label,
                    personality: selectedPersonality?.label,
                    feedback: feedback,
                    scripts: scripts
                }
            }]);

            if (journalError) {
                console.warn("Error saving to journal:", journalError);
                toast({
                    title: "Error al guardar en Diario",
                    description: journalError.message || "No se pudo crear la entrada en el diario.",
                    variant: "destructive",
                });
            }

            toast({
                title: "¡Guardado!",
                description: "Tu plan de acción ha sido guardado exitosamente en tu historial y diario.",
            });
        } catch (error) {
            console.error("Error saving:", error);
            toast({
                title: "Error",
                description: "No se pudo guardar el plan.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRestart = () => {
        setStep("setup");
        setMessages([]);
        setFeedback(null);
        setScripts(null);
        setContext("");
        setCustomScenario("");
        setSelectedScenario(null);
        setSelectedPersonality(null);
    };

    // --- RENDER ---

    if (step === "setup") {
        return (
            <Card className="p-6 max-w-2xl mx-auto space-y-6">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-primary" />
                        Simulador de Conversaciones
                    </h2>
                    <p className="text-muted-foreground">
                        Practica situaciones difíciles en un entorno seguro antes de enfrentarlas en la vida real.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">1. Elige el escenario</label>
                        <Select
                            onValueChange={(val) => {
                                const scen = SCENARIOS.find(s => s.id === val);
                                setSelectedScenario(scen || null);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una situación..." />
                            </SelectTrigger>
                            <SelectContent>
                                {SCENARIOS.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedScenario?.id === "custom" && (
                            <Textarea
                                placeholder="Describe tu situación específica..."
                                value={customScenario}
                                onChange={(e) => setCustomScenario(e.target.value)}
                            />
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">2. Elige la personalidad del otro</label>
                        <Select
                            onValueChange={(val) => {
                                const pers = PERSONALITIES.find(p => p.id === val);
                                setSelectedPersonality(pers || null);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un estilo de respuesta..." />
                            </SelectTrigger>
                            <SelectContent>
                                {PERSONALITIES.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedPersonality && (
                            <p className="text-xs text-muted-foreground italic">
                                {selectedPersonality.description}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">3. Contexto adicional (Opcional)</label>
                        <Textarea
                            placeholder="¿Hay antecedentes? ¿Detalles importantes?"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                        />
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleStartSimulation}
                        disabled={!selectedScenario || !selectedPersonality || isLoading}
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : "Comenzar Simulación"}
                    </Button>
                </div>
            </Card>
        );
    }

    if (step === "simulation") {
        return (
            <Card className="flex flex-col h-[600px] max-w-2xl mx-auto">
                <div className="p-4 border-b bg-muted/50 flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold">{selectedScenario?.label}</h3>
                        <p className="text-xs text-muted-foreground">vs. {selectedPersonality?.label}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleFinishSimulation}>Terminar</Button>
                </div>

                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] p-3 rounded-lg ${m.role === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-muted p-3 rounded-lg animate-pulse">
                                    Escribiendo...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                <div className="p-4 border-t flex gap-2">
                    <Textarea
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        placeholder="Escribe tu respuesta..."
                        className="min-h-[50px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                    />
                    <Button onClick={handleSendMessage} disabled={!currentInput.trim() || isLoading}>
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </Card>
        );
    }

    if (step === "feedback") {
        return (
            <Card className="p-6 max-w-2xl mx-auto space-y-6 animate-in fade-in">
                <h2 className="text-2xl font-bold text-center">Análisis de Desempeño</h2>

                {feedback ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-muted rounded-lg">
                                <div className="text-2xl font-bold text-primary">{feedback.clarity}/10</div>
                                <div className="text-xs text-muted-foreground">Claridad</div>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                                <div className="text-2xl font-bold text-primary">{feedback.firmness}/10</div>
                                <div className="text-xs text-muted-foreground">Firmeza</div>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                                <div className="text-2xl font-bold text-primary">{feedback.empathy}/10</div>
                                <div className="text-xs text-muted-foreground">Empatía</div>
                            </div>
                        </div>

                        <div className="p-4 border rounded-lg bg-card">
                            <h3 className="font-semibold mb-2">Comentario General</h3>
                            <p>{feedback.overall}</p>
                        </div>

                        {feedback.traps && feedback.traps.length > 0 && (
                            <Alert variant="destructive">
                                <AlertTitle>Trampas Emocionales Detectadas</AlertTitle>
                                <AlertDescription>
                                    <ul className="list-disc pl-4 mt-2">
                                        {feedback.traps.map((trap, i) => (
                                            <li key={i}>{trap}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}

                        {feedback.recommended_tools && feedback.recommended_tools.length > 0 && (
                            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                                <h3 className="font-semibold mb-2 text-green-800 dark:text-green-300">Herramientas Recomendadas</h3>
                                <div className="flex flex-wrap gap-2">
                                    {feedback.recommended_tools.map((tool, i) => (
                                        <span key={i} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md text-sm">
                                            {tool}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button onClick={handleViewScripts} className="w-full">
                            Ver Mejores Respuestas
                        </Button>
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                        <p>Analizando conversación...</p>
                    </div>
                )}
            </Card>
        );
    }

    if (step === "scripts") {
        return (
            <Card className="p-6 max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right">
                <h2 className="text-2xl font-bold">Scripts Sugeridos</h2>
                <p className="text-muted-foreground">Aquí tienes formas alternativas de manejar la situación:</p>

                <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-green-600 mb-1">Respuesta Suave (Asertiva-Empática)</h3>
                        <p className="italic">"{scripts?.soft}"</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-blue-600 mb-1">Respuesta Firme (Límites Claros)</h3>
                        <p className="italic">"{scripts?.firm}"</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-red-600 mb-1">Ultimátum (Protección)</h3>
                        <p className="italic">"{scripts?.final_warning}"</p>
                    </div>
                </div>

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
                        Nueva Simulación
                    </Button>
                </div>
            </Card>
        )
    }

    return null;
};

