import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { xpEventBus } from "@/lib/xpEventBus";
import { Shield, Zap, X, Check, ChevronRight, AlertTriangle, Trophy, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

interface Scenario {
    situation?: string;
    do_say?: string[];
    dont_say?: string[];
    do_action?: string;
    dont_action?: string;
}

interface SOSWarRoomProps {
    scenarios: Scenario[];
}

type RoundChoice = "correct" | "wrong" | null;

const XP_PER_SCENARIO = 25;
const BONUS_XP_ALL_CORRECT = 50;

const CRISIS_COLORS: Record<number, { border: string; text: string; glow: string }> = {
    0: { border: "border-coral", text: "text-coral", glow: "shadow-[0_0_20px_rgba(255,99,71,0.4)]" },
    1: { border: "border-orange-500", text: "text-orange-500", glow: "shadow-[0_0_20px_rgba(249,115,22,0.4)]" },
    2: { border: "border-red-600", text: "text-red-600", glow: "shadow-[0_0_20px_rgba(220,38,38,0.5)]" },
};

export const SOSWarRoom = ({ scenarios }: SOSWarRoomProps) => {
    const { user } = useAuth();
    const [stage, setStage] = useState<"intro" | "battle" | "debrief" | "complete">("intro");
    const [currentScenarioIdx, setCurrentScenarioIdx] = useState(0);
    const [roundChoice, setRoundChoice] = useState<RoundChoice>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [results, setResults] = useState<boolean[]>([]);
    const [earnedXP, setEarnedXP] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [pulse, setPulse] = useState(false);

    const currentScenario = scenarios[currentScenarioIdx];
    const totalScenarios = scenarios.length;

    // Merge and shuffle choices for the current scenario
    const buildChoices = (scenario: Scenario) => {
        const correct = (scenario.do_say || []).map(opt => ({ text: opt, isCorrect: true }));
        const wrong = (scenario.dont_say || []).map(opt => ({ text: opt, isCorrect: false }));
        // Take 1 correct + 1 wrong and show as binary choice for dramatic tension
        return [
            { text: correct[0]?.text || "", isCorrect: true },
            { text: wrong[0]?.text || "", isCorrect: false },
        ].sort(() => Math.random() - 0.5);
    };

    const [choices, setChoices] = useState(() => buildChoices(scenarios[0]));

    useEffect(() => {
        if (stage === "battle") {
            setPulse(true);
            const t = setTimeout(() => setPulse(false), 600);
            return () => clearTimeout(t);
        }
    }, [currentScenarioIdx, stage]);

    const getLocalDate = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    const handleChoice = (text: string, isCorrect: boolean) => {
        if (roundChoice !== null) return;
        setSelectedOption(text);
        setRoundChoice(isCorrect ? "correct" : "wrong");
        setResults(prev => [...prev, isCorrect]);
        if (isCorrect) {
            setEarnedXP(prev => prev + XP_PER_SCENARIO);
        }
    };

    const handleNextScenario = () => {
        if (currentScenarioIdx < totalScenarios - 1) {
            const nextIdx = currentScenarioIdx + 1;
            setCurrentScenarioIdx(nextIdx);
            setChoices(buildChoices(scenarios[nextIdx]));
            setRoundChoice(null);
            setSelectedOption(null);
        } else {
            // All scenarios done → debrief
            const allCorrect = results.every(Boolean) && roundChoice === "correct";
            const bonusForDisplay = allCorrect ? BONUS_XP_ALL_CORRECT : 0;
            setEarnedXP(prev => prev + bonusForDisplay);
            setStage("debrief");
        }
    };

    const saveResults = async () => {
        if (!user) return;
        setIsSaving(true);
        const today = getLocalDate();
        const allCorrect = results.filter(Boolean).length === totalScenarios;
        const finalXP = earnedXP + (allCorrect ? BONUS_XP_ALL_CORRECT : 0);

        try {
            // 1. Journal entry — mission debrief
            const summary = scenarios.map((s, i) =>
                `ESCENARIO ${i + 1}: ${s.situation}\nRESULTADO: ${results[i] ? "✓ CORRECTO" : "✗ INCORRECTO"}`
            ).join("\n\n");

            const journalContent = {
                title: "Debrief de la Sala de Guerra",
                text: `He completado los ${totalScenarios} protocolos de crisis.\n\n${summary}`,
                tags: ["Tarjetas SOS", "Sala de Guerra", "Crisis Protocol"]
            };

            await supabase.from('journal_entries').insert([{
                user_id: user.id,
                content: JSON.stringify(journalContent),
                entry_type: 'reflection',
                tags: ['Tarjetas SOS', 'Sala de Guerra']
            } as never]);

            // 2. Daily mission
            await supabase.from('daily_missions').insert([{
                user_id: user.id,
                mission_type: 'tool_protocol',
                mission_id: `sos_war_room_${Date.now()}`,
                xp_earned: finalXP,
                mission_date: today,
                metadata: { tool_tag: 'sos-phrases', correct: results.filter(Boolean).length, total: totalScenarios }
            } as never]);

            // 3. XP update
            const { data: p } = await supabase.from('user_progress').select('total_xp').eq('user_id', user.id).single();
            if (p) {
                await supabase.from('user_progress').update({ total_xp: (p.total_xp || 0) + finalXP } as never).eq('user_id', user.id);
            }

            xpEventBus.emit(finalXP);

            // Epic confetti for the War Room
            confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 }, colors: ['#ff4757', '#ff6b35', '#ffd32a', '#2dd4bf'] });
            confetti({ particleCount: 80, angle: 60, spread: 80, origin: { x: 0 }, colors: ['#ff4757', '#ffd32a'] });
            confetti({ particleCount: 80, angle: 120, spread: 80, origin: { x: 1 }, colors: ['#2dd4bf', '#ff6b35'] });

            setStage("complete");
        } catch (e) {
            console.error(e);
            toast({ title: "Error del Sistema", description: "Fallo al registrar el debrief.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    // ── INTRO SCREEN ────────────────────────────────────────────────────────────
    if (stage === "intro") {
        return (
            <div className="relative overflow-hidden border-2 border-coral bg-zinc-950 p-6 space-y-5 animate-in slide-in-from-bottom-4 duration-700 shadow-[0_0_30px_rgba(255,99,71,0.3)]">
                {/* Pulsing alert lines */}
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-coral to-transparent animate-pulse" />
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-coral to-transparent animate-pulse" />

                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-coral flex items-center justify-center shadow-[3px_3px_0px_#7f1d1d] animate-pulse">
                        <AlertTriangle className="w-6 h-6 text-zinc-950" />
                    </div>
                    <div>
                        <h3 className="font-display font-black text-xl text-coral tracking-wider uppercase">
                            SALA DE GUERRA
                        </h3>
                        <p className="text-xs text-coral/60 uppercase tracking-widest font-bold">Protocolo de Crisis Activo</p>
                    </div>
                </div>

                <div className="border border-coral/30 bg-coral/5 p-4 space-y-2">
                    <p className="text-sm font-bold text-foreground/90 leading-relaxed">
                        Cuando el ataque llegue, no tendrás tiempo para pensar. <span className="text-coral">Necesitas entrenarte ahora,</span> mientras estás a salvo.
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {totalScenarios} escenarios de crisis te esperan. Elige la respuesta correcta. Sobrevive a cada ronda. Acumula XP de defensa.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                        { label: "Escenarios", value: totalScenarios },
                        { label: "XP por ronda", value: `+${XP_PER_SCENARIO}` },
                        { label: "Bonus Perfecto", value: `+${BONUS_XP_ALL_CORRECT}` },
                    ].map(item => (
                        <div key={item.label} className="border border-coral/20 bg-coral/5 p-3">
                            <p className="text-xl font-black text-coral">{item.value}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{item.label}</p>
                        </div>
                    ))}
                </div>

                <Button
                    onClick={() => setStage("battle")}
                    className="w-full font-black text-base py-6 bg-coral hover:bg-coral-light text-zinc-950 brutal-btn uppercase tracking-widest"
                >
                    <Zap className="w-5 h-5 mr-2" />
                    ENTRAR A LA SALA DE GUERRA
                </Button>
            </div>
        );
    }

    // ── BATTLE SCREEN ────────────────────────────────────────────────────────────
    if (stage === "battle") {
        const color = CRISIS_COLORS[currentScenarioIdx] || CRISIS_COLORS[0];
        return (
            <div className={cn(
                "relative overflow-hidden border-2 bg-zinc-950 p-6 space-y-5 transition-all duration-500",
                color.border,
                pulse && color.glow
            )}>
                {/* Scanline effect header */}
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-current to-transparent animate-pulse opacity-60" />

                {/* Progress bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-wider">
                        <span>Escenario {currentScenarioIdx + 1} / {totalScenarios}</span>
                        <span className={color.text}>+{earnedXP} XP acumulados</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800">
                        <div
                            className={cn("h-full transition-all duration-700", color.border.replace("border-", "bg-"))}
                            style={{ width: `${((currentScenarioIdx) / totalScenarios) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Scenario label */}
                <div className={cn("border px-4 py-2 inline-block", color.border)}>
                    <p className={cn("font-black text-sm uppercase tracking-widest", color.text)}>
                        ⚠ {currentScenario.situation}
                    </p>
                </div>

                <p className="text-sm font-bold text-foreground/90">¿Cuál es la respuesta correcta?</p>

                {/* Choice buttons */}
                <div className="space-y-3">
                    {choices.map((choice, i) => {
                        const isSelected = selectedOption === choice.text;
                        const revealed = roundChoice !== null;

                        let btnClass = "border-2 border-zinc-700 bg-zinc-900 text-foreground";
                        if (revealed && isSelected && choice.isCorrect) btnClass = "border-2 border-green-500 bg-green-500/10 text-green-400";
                        if (revealed && isSelected && !choice.isCorrect) btnClass = "border-2 border-red-600 bg-red-600/10 text-red-400 line-through";
                        if (revealed && !isSelected && choice.isCorrect) btnClass = "border-2 border-green-500/40 bg-green-500/5 text-green-400/70";

                        return (
                            <button
                                key={i}
                                disabled={roundChoice !== null}
                                onClick={() => handleChoice(choice.text, choice.isCorrect)}
                                className={cn(
                                    "w-full text-left p-4 text-sm font-medium transition-all duration-200 rounded-none flex items-start gap-3",
                                    btnClass,
                                    roundChoice === null && "hover:border-coral/50 hover:shadow-[2px_2px_0px_var(--coral)] active:scale-[0.99]"
                                )}
                            >
                                <span className="flex-shrink-0 w-6 h-6 border border-current rounded-none flex items-center justify-center text-xs font-black">
                                    {revealed ? (isSelected ? (choice.isCorrect ? "✓" : "✗") : (choice.isCorrect ? "✓" : String.fromCharCode(65 + i))) : String.fromCharCode(65 + i)}
                                </span>
                                {choice.text}
                            </button>
                        );
                    })}
                </div>

                {/* Feedback + Next */}
                {roundChoice !== null && (
                    <div className={cn(
                        "border p-4 space-y-3 animate-in slide-in-from-bottom-2 duration-300",
                        roundChoice === "correct" ? "border-green-500/40 bg-green-500/5" : "border-red-600/40 bg-red-600/5"
                    )}>
                        <div className="flex items-center gap-2">
                            {roundChoice === "correct"
                                ? <Check className="w-5 h-5 text-green-400" />
                                : <X className="w-5 h-5 text-red-400" />
                            }
                            <p className={cn("font-black text-sm", roundChoice === "correct" ? "text-green-400" : "text-red-400")}>
                                {roundChoice === "correct" ? `Escudo activado. +${XP_PER_SCENARIO} XP` : "Respuesta incorrecta. Sin XP esta ronda."}
                            </p>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>✓ <span className="text-foreground/80">{currentScenario.do_action}</span></p>
                            <p>✗ <span className="text-foreground/60">{currentScenario.dont_action}</span></p>
                        </div>
                        <Button
                            onClick={handleNextScenario}
                            className={cn(
                                "w-full font-black uppercase tracking-wider brutal-btn",
                                currentScenarioIdx < totalScenarios - 1
                                    ? "bg-coral hover:bg-coral-light text-zinc-950"
                                    : "bg-green-600 hover:bg-green-500 text-zinc-950"
                            )}
                        >
                            {currentScenarioIdx < totalScenarios - 1 ? (
                                <>Siguiente Escenario <ChevronRight className="w-4 h-4" /></>
                            ) : (
                                <>Ver Debrief <Trophy className="w-4 h-4" /></>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    // ── DEBRIEF ────────────────────────────────────────────────────────────────
    if (stage === "debrief") {
        const correctCount = results.filter(Boolean).length;
        const allCorrect = correctCount === totalScenarios;

        return (
            <div className="border-2 border-coral bg-zinc-950 p-6 space-y-5 animate-in slide-in-from-bottom-4 duration-500 shadow-[0_0_30px_rgba(255,99,71,0.25)]">
                <div className="text-center space-y-2">
                    <Trophy className={cn("w-12 h-12 mx-auto", allCorrect ? "text-amber-400" : "text-coral")} />
                    <h3 className="font-display font-black text-xl text-foreground uppercase tracking-wider">Debrief Operación</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">
                        {correctCount}/{totalScenarios} protocolos dominados
                    </p>
                </div>

                {/* Scenario results */}
                <div className="space-y-2">
                    {scenarios.map((s, i) => (
                        <div key={i} className={cn(
                            "flex items-center gap-3 border px-4 py-3",
                            results[i] ? "border-green-500/30 bg-green-500/5" : "border-red-600/30 bg-red-600/5"
                        )}>
                            {results[i] ? <Check className="w-4 h-4 text-green-400 flex-shrink-0" /> : <X className="w-4 h-4 text-red-400 flex-shrink-0" />}
                            <span className="text-sm font-medium text-foreground/80">{s.situation}</span>
                            <span className={cn("ml-auto text-xs font-black", results[i] ? "text-green-400" : "text-red-400")}>
                                {results[i] ? `+${XP_PER_SCENARIO}` : "0"} XP
                            </span>
                        </div>
                    ))}
                </div>

                {/* XP Summary */}
                <div className="border border-amber-500/30 bg-amber-500/5 p-4 space-y-1 text-center">
                    {allCorrect && (
                        <p className="text-xs text-amber-400 uppercase font-bold tracking-wider mb-2">
                            ⚡ BONUS PERFECTO +{BONUS_XP_ALL_CORRECT} XP
                        </p>
                    )}
                    <p className="text-3xl font-black text-coral">+{earnedXP} XP</p>
                    <p className="text-xs text-muted-foreground">Total ganado en esta sesión</p>
                </div>

                <Button
                    onClick={saveResults}
                    disabled={isSaving}
                    className="w-full font-black py-5 bg-coral hover:bg-coral-light text-zinc-950 brutal-btn uppercase tracking-widest"
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Shield className="w-5 h-5 mr-2" />Sellar Debrief y Reclamar XP</>}
                </Button>
            </div>
        );
    }

    // ── COMPLETE ────────────────────────────────────────────────────────────────
    return (
        <div className="border-2 border-green-500 bg-zinc-950 p-6 text-center space-y-4 animate-in fade-in zoom-in duration-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <Trophy className="w-14 h-14 mx-auto text-amber-400" />
            <h3 className="font-display font-black text-xl text-green-400 uppercase tracking-wider">Protocolo Completado</h3>
            <p className="text-sm text-muted-foreground">
                Tu debrief está sellado en el Diario. Cuando llegue la crisis real, ya sabrás exactamente qué decir.
            </p>
            <div className="border border-green-500/20 bg-green-500/5 p-3">
                <p className="text-2xl font-black text-green-400">+{earnedXP} XP</p>
                <p className="text-xs text-muted-foreground mt-1">Registrados en tu progreso</p>
            </div>
        </div>
    );
};
