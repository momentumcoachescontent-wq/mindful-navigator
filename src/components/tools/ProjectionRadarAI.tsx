import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { xpEventBus } from "@/lib/xpEventBus";
import { Eye, ChevronRight, Send, Loader2, Sparkles, Shield, User, Bot } from "lucide-react";
import confetti from "canvas-confetti";

interface Message {
    role: "user" | "assistant";
    content: string;
    phase?: Phase;
}

type Phase = "setup" | "discovery" | "reflection" | "integration" | "sealed";

const EMOTION_OPTIONS = [
    { label: "Juicio / Crítica", emoji: "⚖️" },
    { label: "Irritación intensa", emoji: "😤" },
    { label: "Envidia / Celos", emoji: "💚" },
    { label: "Asco / Rechazo", emoji: "🫠" },
    { label: "Superioridad / Desprecio", emoji: "😒" },
];

const PHASE_LABELS: Record<Phase, string> = {
    setup: "Activando Radar",
    discovery: "Fase I — Descubrimiento",
    reflection: "Fase II — Reflexión",
    integration: "Fase III — Integración",
    sealed: "Sombra Integrada",
};

const PHASE_COLORS: Partial<Record<Phase, string>> = {
    discovery: "text-orange-400",
    reflection: "text-secondary",
    integration: "text-primary",
    sealed: "text-green-400",
};

const XP_REWARD = 80;

const getLocalDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const ProjectionRadarAI = () => {
    const { user } = useAuth();

    const [phase, setPhase] = useState<Phase>("setup");
    const [person, setPerson] = useState("");
    const [emotion, setEmotion] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [roundCount, setRoundCount] = useState(0);
    const [isSealing, setIsSealing] = useState(false);
    const [sealEnabled, setSealEnabled] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const callProjectionAI = async (userMsg: string, currentPhase: Phase, hist: Message[]) => {
        setIsThinking(true);
        try {
            // Uses the `roleplay` mode already deployed in production.
            // We set the persona to a Jungian shadow-work guide.
            const phaseLabel =
                currentPhase === "discovery" ? "Descubrimiento — haz UNA sola pregunta socrática que invite al usuario a verse en el otro" :
                    currentPhase === "reflection" ? "Reflexión — conecta lo compartido con la sombra interna del usuario" :
                        "Integración — guía al cierre con compasión y una revelación poderosa";

            const resp = await supabase.functions.invoke("analyze-situation", {
                body: {
                    mode: "roleplay",
                    personality: "shadow_guide",
                    personalityDescription: `Guía de psicología junguiana. Tu única función es hacer preguntas socráticas que lleven al usuario a ver en otros lo que reprime en sí mismo. Fase actual: ${phaseLabel}. Persona en cuestión: ${person}. Emoción disparadora: ${emotion}.`,
                    extraTrait: "Socrático y directo — hace UNA sola pregunta por turno. NUNCA da consejos ni diagnósticos.",
                    scenario: `Trabajo de sombra: ${emotion} hacia "${person}"`,
                    context: `El usuario siente ${emotion} intensamente hacia ${person}. Puedes usar preguntas como: "¿Podrías ser tú también...?", "¿En qué momento de tu vida...?", "¿Qué parte de ti desearía...?"`,
                    messages: hist.length > 0 ? hist : [],
                    isFirst: hist.length === 0,
                    currentRound: roundCount,
                    maxRounds: 7,
                },
            });

            if (resp.error) throw new Error(resp.error.message);
            return resp.data?.response as string;
        } catch (e: any) {
            console.error("Projection AI error:", e);
            throw e;
        } finally {
            setIsThinking(false);
        }
    };

    const startSocraticDialog = async () => {
        if (!person.trim() || !emotion) {
            toast({ title: "Información incompleta", description: "Indica la persona y la emoción.", variant: "destructive" });
            return;
        }
        setIsThinking(true);
        const firstUserMsg = `Siento ${emotion} hacia ${person}.`;

        try {
            const aiReply = await callProjectionAI(firstUserMsg, "discovery", []);
            const initialMessages: Message[] = [
                { role: "user", content: firstUserMsg, phase: "discovery" },
                { role: "assistant", content: aiReply, phase: "discovery" },
            ];
            setMessages(initialMessages);
            setPhase("discovery");
            setRoundCount(1);
        } catch {
            toast({ title: "Error de conexión AI", description: "Intenta de nuevo.", variant: "destructive" });
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || isThinking) return;
        const userMsg = input.trim();
        setInput("");

        const newRound = roundCount + 1;
        setRoundCount(newRound);

        // Phase progression logic
        let nextPhase: Phase = phase;
        if (newRound >= 3 && newRound < 5) nextPhase = "reflection";
        if (newRound >= 5) nextPhase = "integration";
        if (newRound >= 7) {
            nextPhase = "integration";
            setSealEnabled(true);
        }

        const updatedMessages: Message[] = [...messages, { role: "user", content: userMsg, phase: nextPhase }];
        setMessages(updatedMessages);
        setPhase(nextPhase);

        try {
            const aiReply = await callProjectionAI(userMsg, nextPhase, messages);
            setMessages(prev => [...prev, { role: "assistant", content: aiReply, phase: nextPhase }]);
        } catch {
            toast({ title: "Error de conexión AI", description: "Intenta de nuevo.", variant: "destructive" });
        }
    };

    const sealInsight = async () => {
        if (!user) return;
        setIsSealing(true);
        try {
            const today = getLocalDate();
            const transcript = messages.map(m => `${m.role === "user" ? "Yo" : "Guía"}: ${m.content}`).join("\n\n");

            await supabase.from('journal_entries').insert([{
                user_id: user.id,
                content: JSON.stringify({
                    title: `Radar de Proyecciones — Sombra sobre "${person}"`,
                    text: `EMOCIÓN DISPARADORA: ${emotion}\nPERSONA: ${person}\n\n=== DIÁLOGO DE SOMBRA ===\n${transcript}`,
                    tags: ["Radar de Proyecciones", "Trabajo de Sombra", "Jung"]
                }),
                entry_type: 'reflection',
                tags: ['Radar de Proyecciones', 'Trabajo de Sombra']
            } as never]);

            await supabase.from('daily_missions').insert([{
                user_id: user.id,
                mission_type: 'tool_protocol',
                mission_id: `projection_radar_${Date.now()}`,
                xp_earned: XP_REWARD,
                mission_date: today,
                metadata: { tool_tag: 'radar-proyecciones', rounds: roundCount, person, emotion }
            } as never]);

            const { data: p } = await supabase.from('user_progress').select('total_xp').eq('user_id', user.id).single();
            if (p) {
                await supabase.from('user_progress').update({ total_xp: (p.total_xp || 0) + XP_REWARD } as never).eq('user_id', user.id);
            }
            xpEventBus.emit(XP_REWARD);

            confetti({ particleCount: 140, spread: 90, origin: { y: 0.4 }, colors: ['#a78bfa', '#c4b5fd', '#f0abfc'] });
            confetti({ particleCount: 50, angle: 60, spread: 70, origin: { x: 0 }, colors: ['#a78bfa'] });
            confetti({ particleCount: 50, angle: 120, spread: 70, origin: { x: 1 }, colors: ['#c4b5fd'] });

            setPhase("sealed");
            toast({ title: `+${XP_REWARD} XP — Sombra Integrada`, description: "El diálogo está sellado en tu Diario." });
        } catch (e) {
            console.error(e);
            toast({ title: "Error al sellar", description: "Intenta de nuevo.", variant: "destructive" });
        } finally {
            setIsSealing(false);
        }
    };

    // ── SETUP SCREEN ─────────────────────────────────────────────────────────
    if (phase === "setup") {
        return (
            <div className="border-2 border-secondary/40 bg-secondary/5 p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-700 shadow-[0_0_20px_rgba(94,234,212,0.1)]">
                <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                    <div className="w-10 h-10 bg-secondary flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                        <Eye className="w-5 h-5 text-zinc-950" />
                    </div>
                    <div>
                        <h3 className="font-display font-black text-secondary text-lg uppercase tracking-wide">Activa el Radar de Sombra</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Sparkles className="w-3 h-3 text-primary" /> IA Socrática Junguiana — +{XP_REWARD} XP
                        </p>
                    </div>
                </div>

                <p className="text-sm font-medium text-foreground/90 leading-relaxed border-l-2 border-secondary pl-4 italic">
                    "Lo que más te irrita de otro, vive en ti. La IA te acompañará a mirarlo sin miedo."
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2 block">
                            ¿Sobre quién es esta reacción?
                        </label>
                        <Input
                            placeholder="Nombre, rol o descripción (ej: 'mi jefe', 'mi ex', 'esa persona en Instagram')"
                            value={person}
                            onChange={e => setPerson(e.target.value)}
                            className="rounded-none border-secondary/40 bg-background/50 font-medium focus-visible:ring-secondary/50 text-sm h-10"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2 block">
                            ¿Qué estás sintiendo?
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {EMOTION_OPTIONS.map(opt => (
                                <button
                                    key={opt.label}
                                    onClick={() => setEmotion(opt.label)}
                                    className={cn(
                                        "text-left border-2 px-4 py-3 text-sm font-medium transition-all duration-150 flex items-center gap-3 rounded-none",
                                        emotion === opt.label
                                            ? "border-secondary/70 bg-secondary/15 text-secondary"
                                            : "border-zinc-700 bg-zinc-900/30 text-foreground/70 hover:border-zinc-500"
                                    )}
                                >
                                    <span className="text-lg">{opt.emoji}</span>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <Button
                    onClick={startSocraticDialog}
                    disabled={isThinking || !person.trim() || !emotion}
                    className="w-full font-black py-5 bg-secondary hover:bg-secondary/80 text-zinc-950 brutal-btn uppercase tracking-widest"
                >
                    {isThinking ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <><ChevronRight className="w-4 h-4 mr-2" />Iniciar Diálogo de Sombra</>
                    )}
                </Button>
            </div>
        );
    }

    // ── SEALED SCREEN ─────────────────────────────────────────────────────────
    if (phase === "sealed") {
        return (
            <div className="border-2 border-primary/60 bg-primary/5 p-6 text-center space-y-4 animate-in fade-in zoom-in duration-500 shadow-[0_0_25px_rgba(139,92,246,0.2)]">
                <div className="w-14 h-14 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                    <Shield className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-black text-primary text-xl uppercase tracking-wide">Sombra Integrada</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    <span className="text-primary font-bold">{person}</span> ya no tiene el mismo poder sobre ti. Lo que viste hoy pertenece a tu historia — y puedes elegir integrarlo.
                </p>
                <div className="border border-primary/20 p-3">
                    <p className="text-xl font-black text-primary">+{XP_REWARD} XP</p>
                    <p className="text-xs text-muted-foreground">Trabajo de Sombra Completado</p>
                </div>
            </div>
        );
    }

    // ── CHAT SCREEN ───────────────────────────────────────────────────────────
    const currentPhaseLabel = PHASE_LABELS[phase];
    const currentPhaseColor = PHASE_COLORS[phase] || "text-foreground";

    return (
        <div className="border-2 border-secondary/40 bg-zinc-950 space-y-0 animate-in slide-in-from-bottom-2 duration-400 overflow-hidden">
            {/* Chat header */}
            <div className="border-b border-secondary/20 bg-secondary/5 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-secondary" />
                    <span className="text-xs font-black text-secondary uppercase tracking-wider">{currentPhaseLabel}</span>
                </div>
                <span className="text-xs text-muted-foreground">{roundCount} intercambio{roundCount !== 1 ? "s" : ""}</span>
            </div>

            {/* Phase progress bar */}
            <div className="flex h-0.5 bg-zinc-800">
                <div className="bg-orange-400 h-full transition-all duration-700" style={{ width: `${Math.min((roundCount / 3) * 33, 33)}%` }} />
                <div className="bg-secondary h-full transition-all duration-700" style={{ width: `${Math.min(Math.max(((roundCount - 3) / 2) * 33, 0), 33)}%` }} />
                <div className="bg-primary h-full transition-all duration-700" style={{ width: `${Math.min(Math.max(((roundCount - 5) / 2) * 34, 0), 34)}%` }} />
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                        {msg.role === "assistant" && (
                            <div className="w-7 h-7 bg-secondary/20 border border-secondary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Bot className="w-4 h-4 text-secondary" />
                            </div>
                        )}
                        <div className={cn(
                            "max-w-[80%] px-4 py-3 text-sm font-medium leading-relaxed",
                            msg.role === "assistant"
                                ? "border border-secondary/20 bg-card text-foreground"
                                : "border border-primary/20 bg-primary/10 text-foreground ml-auto"
                        )}>
                            {msg.content}
                        </div>
                        {msg.role === "user" && (
                            <div className="w-7 h-7 bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <User className="w-4 h-4 text-primary" />
                            </div>
                        )}
                    </div>
                ))}

                {isThinking && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-7 h-7 bg-secondary/20 border border-secondary/30 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-secondary animate-pulse" />
                        </div>
                        <div className="border border-secondary/20 bg-card px-4 py-3 flex items-center gap-2">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-secondary/20 p-3 space-y-2">
                <div className="flex gap-2">
                    <Textarea
                        ref={textareaRef}
                        placeholder="Responde al guía..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        className="min-h-[60px] max-h-[100px] resize-none bg-background/50 border-secondary/30 font-medium focus-visible:ring-secondary/40 rounded-none text-sm flex-1"
                    />
                    <Button
                        onClick={sendMessage}
                        disabled={isThinking || !input.trim()}
                        className="self-end bg-secondary hover:bg-secondary/80 text-zinc-950 font-black px-4 rounded-none brutal-btn"
                    >
                        {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>

                {sealEnabled && (
                    <Button
                        onClick={sealInsight}
                        disabled={isSealing}
                        className="w-full font-black py-3 bg-primary hover:bg-primary/80 text-white brutal-btn uppercase tracking-wider text-sm animate-in slide-in-from-bottom-2 duration-300"
                    >
                        {isSealing ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <><Shield className="w-4 h-4 mr-2" />Sellar Integración de Sombra (+{XP_REWARD} XP)</>
                        )}
                    </Button>
                )}

                {!sealEnabled && roundCount > 0 && (
                    <p className="text-[10px] text-muted-foreground text-center">
                        {Math.max(7 - roundCount, 0)} intercambio{Math.max(7 - roundCount, 0) !== 1 ? "s" : ""} más para desbloquear la sellado
                    </p>
                )}
            </div>
        </div>
    );
};
