import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { xpEventBus } from "@/lib/xpEventBus";
import { Activity, Brain, Heart, Users, Check, Loader2, Sparkles, Shield, ChevronDown, ChevronUp } from "lucide-react";
import confetti from "canvas-confetti";

interface Pillar {
    name: string;
    icon: string;
    ideas: string[];
}

interface SelfCareBlueprintProps {
    pillars: Pillar[];
}

const PILLAR_CONFIG: Record<string, {
    icon: React.ReactNode;
    color: string;
    border: string;
    bg: string;
    glow: string;
    emoji: string;
}> = {
    "Cuerpo": { icon: <Activity className="w-4 h-4" />, color: "text-turquoise", border: "border-turquoise/60", bg: "bg-turquoise/10", glow: "shadow-[0_0_12px_rgba(45,212,191,0.35)]", emoji: "⚡" },
    "Mente": { icon: <Brain className="w-4 h-4" />, color: "text-primary", border: "border-primary/60", bg: "bg-primary/10", glow: "shadow-[0_0_12px_rgba(139,92,246,0.35)]", emoji: "🧠" },
    "Emociones": { icon: <Heart className="w-4 h-4" />, color: "text-coral", border: "border-coral/60", bg: "bg-coral/10", glow: "shadow-[0_0_12px_rgba(255,99,71,0.35)]", emoji: "💫" },
    "Conexión": { icon: <Users className="w-4 h-4" />, color: "text-secondary", border: "border-secondary/60", bg: "bg-secondary/10", glow: "shadow-[0_0_12px_rgba(94,234,212,0.35)]", emoji: "🌐" },
};

const XP_TIERS = [
    { pillars: 1, xp: 20, label: "Inicio" },
    { pillars: 2, xp: 40, label: "Balance" },
    { pillars: 3, xp: 65, label: "Armonía" },
    { pillars: 4, xp: 100, label: "✦ Plan Completo" },
];

const MAX_PER_PILLAR = 2;

export const SelfCareBlueprint = ({ pillars }: SelfCareBlueprintProps) => {
    const { user } = useAuth();
    const [selections, setSelections] = useState<Record<string, string[]>>({});
    const [expandedPillar, setExpandedPillar] = useState<string | null>(pillars[0]?.name || null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSealed, setIsSealed] = useState(false);

    const coveredPillars = useMemo(() =>
        Object.values(selections).filter(s => s.length > 0).length,
        [selections]
    );

    const totalSelected = useMemo(() =>
        Object.values(selections).flat().length,
        [selections]
    );

    const currentTier = XP_TIERS.filter(t => t.pillars <= coveredPillars).slice(-1)[0] || null;
    const nextTier = XP_TIERS.find(t => t.pillars > coveredPillars) || null;

    const toggleIdea = (pillarName: string, idea: string) => {
        setSelections(prev => {
            const current = prev[pillarName] || [];
            if (current.includes(idea)) {
                return { ...prev, [pillarName]: current.filter(i => i !== idea) };
            }
            if (current.length >= MAX_PER_PILLAR) {
                toast({ title: `Máximo ${MAX_PER_PILLAR} por pilar`, description: "Quita una actividad antes de agregar otra.", variant: "destructive" });
                return prev;
            }
            return { ...prev, [pillarName]: [...current, idea] };
        });
    };

    const getLocalDate = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    const handleSeal = async () => {
        if (!currentTier || !user) {
            toast({ title: "Selecciona al menos 1 actividad", description: "Elige al menos una práctica de cualquier pilar.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        const today = getLocalDate();
        const xpEarned = currentTier.xp;

        try {
            // Build readable blueprint
            const blueprintLines = Object.entries(selections)
                .filter(([, acts]) => acts.length > 0)
                .map(([pilar, acts]) => `${PILLAR_CONFIG[pilar]?.emoji || "•"} ${pilar}: ${acts.join(" | ")}`);

            const journalContent = {
                title: `Blueprint de Autocuidado — Semana ${today}`,
                text: `He diseñado mi plan de supervivencia emocional para esta semana:\n\n${blueprintLines.join("\n")}\n\nPilares cubiertos: ${coveredPillars}/4\nActividades comprometidas: ${totalSelected}`,
                tags: ["Autocuidado", "Blueprint", "Bienestar", currentTier.label]
            };

            await supabase.from('journal_entries').insert([{
                user_id: user.id,
                content: JSON.stringify(journalContent),
                entry_type: 'reflection',
                tags: ['Autocuidado', 'Blueprint']
            } as never]);

            await supabase.from('daily_missions').insert([{
                user_id: user.id,
                mission_type: 'tool_protocol',
                mission_id: `self_care_blueprint_${Date.now()}`,
                xp_earned: xpEarned,
                mission_date: today,
                metadata: { tool_tag: 'self-care', pillars_covered: coveredPillars, tier: currentTier.label }
            } as never]);

            const { data: p } = await supabase.from('user_progress').select('total_xp').eq('user_id', user.id).single();
            if (p) {
                await supabase.from('user_progress').update({ total_xp: (p.total_xp || 0) + xpEarned } as never).eq('user_id', user.id);
            }

            xpEventBus.emit(xpEarned);

            // Leveled confetti based on tier
            if (coveredPillars === 4) {
                confetti({ particleCount: 180, spread: 110, origin: { y: 0.5 }, colors: ['#2dd4bf', '#a78bfa', '#ff6b6b', '#38bdf8'] });
                confetti({ particleCount: 60, angle: 60, spread: 65, origin: { x: 0 }, colors: ['#2dd4bf', '#38bdf8'] });
                confetti({ particleCount: 60, angle: 120, spread: 65, origin: { x: 1 }, colors: ['#a78bfa', '#ff6b6b'] });
            } else {
                confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#2dd4bf', '#a78bfa'] });
            }

            setIsSealed(true);
            toast({ title: `+${xpEarned} XP — Blueprint Sellado`, description: `"${currentTier.label}" — Tu plan está en el Diario.` });

        } catch (e) {
            console.error(e);
            toast({ title: "Error del Sistema", description: "No pudimos guardar el blueprint.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── SEALED STATE ─────────────────────────────────────────────────────────────
    if (isSealed) {
        return (
            <div className="border-2 border-turquoise bg-turquoise/5 p-6 text-center space-y-4 animate-in fade-in zoom-in duration-500 shadow-[0_0_25px_rgba(45,212,191,0.25)]">
                <div className="w-14 h-14 mx-auto rounded-full bg-turquoise/20 flex items-center justify-center">
                    <Shield className="w-7 h-7 text-turquoise" />
                </div>
                <h3 className="font-display font-black text-turquoise text-xl uppercase tracking-wide">Blueprint Activo</h3>
                <p className="text-sm text-muted-foreground">Tu plan de supervivencia emocional está sellado en el Diario. Vuelve mañana a completar una actividad.</p>
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(selections).filter(([, acts]) => acts.length > 0).map(([pilar, acts]) => {
                        const cfg = PILLAR_CONFIG[pilar];
                        return (
                            <div key={pilar} className={cn("border p-3 text-left space-y-1", cfg?.border, cfg?.bg)}>
                                <p className={cn("text-xs font-black uppercase tracking-wider flex items-center gap-1", cfg?.color)}>
                                    {cfg?.icon} {pilar}
                                </p>
                                {acts.map((a, i) => <p key={i} className="text-xs text-foreground/70">• {a}</p>)}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ── BUILDER ───────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="border-2 border-turquoise/40 bg-turquoise/5 p-5 space-y-4 shadow-[0_0_15px_rgba(45,212,191,0.15)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-turquoise flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                        <Shield className="w-5 h-5 text-zinc-950" />
                    </div>
                    <div>
                        <h3 className="font-display font-black text-turquoise text-lg uppercase tracking-wide">Tu Blueprint de Supervivencia</h3>
                        <p className="text-xs text-muted-foreground">Selecciona hasta {MAX_PER_PILLAR} actividades por pilar</p>
                    </div>
                </div>

                {/* Equilibrium meter */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground uppercase tracking-wider font-bold">
                            Equilibrio: {coveredPillars}/4 pilares
                        </span>
                        {currentTier && (
                            <span className="text-turquoise font-black flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {currentTier.xp} XP desbloqueados
                            </span>
                        )}
                    </div>
                    <div className="flex gap-1.5">
                        {pillars.map((p, i) => {
                            const covered = (selections[p.name] || []).length > 0;
                            const cfg = PILLAR_CONFIG[p.name];
                            return (
                                <div key={i} className={cn(
                                    "flex-1 h-2.5 transition-all duration-500",
                                    covered ? (cfg?.border.replace("border-", "bg-") || "bg-turquoise") : "bg-zinc-800"
                                )} />
                            );
                        })}
                    </div>
                    {nextTier && (
                        <p className="text-[10px] text-muted-foreground text-right">
                            Cubre {nextTier.pillars - coveredPillars} pilar{nextTier.pillars - coveredPillars > 1 ? "es" : ""} más para desbloquear +{nextTier.xp} XP ({nextTier.label})
                        </p>
                    )}
                </div>

                {/* XP Tier indicators */}
                <div className="grid grid-cols-4 gap-1.5">
                    {XP_TIERS.map((tier) => (
                        <div key={tier.pillars} className={cn(
                            "border p-2 text-center transition-all duration-300",
                            coveredPillars >= tier.pillars
                                ? "border-turquoise/60 bg-turquoise/10"
                                : "border-zinc-700 bg-zinc-900/50 opacity-40"
                        )}>
                            <p className={cn("text-xs font-black", coveredPillars >= tier.pillars ? "text-turquoise" : "text-zinc-600")}>
                                +{tier.xp}
                            </p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">{tier.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pillar accordion */}
            <div className="space-y-2">
                {pillars.map((pillar) => {
                    const cfg = PILLAR_CONFIG[pillar.name] || { icon: <Heart className="w-4 h-4" />, color: "text-primary", border: "border-primary/60", bg: "bg-primary/10", glow: "", emoji: "•" };
                    const selected = selections[pillar.name] || [];
                    const isOpen = expandedPillar === pillar.name;

                    return (
                        <div key={pillar.name} className={cn(
                            "border-2 transition-all duration-300",
                            selected.length > 0 ? cn(cfg.border, cfg.glow) : "border-zinc-700"
                        )}>
                            {/* Pillar header */}
                            <button
                                className="w-full flex items-center justify-between p-4 text-left"
                                onClick={() => setExpandedPillar(isOpen ? null : pillar.name)}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={cn("font-black", cfg.color)}>{cfg.icon}</span>
                                    <span className="font-display font-bold text-sm text-foreground">{pillar.name}</span>
                                    {selected.length > 0 && (
                                        <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-none", cfg.bg, cfg.color)}>
                                            {selected.length}/{MAX_PER_PILLAR}
                                        </span>
                                    )}
                                </div>
                                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </button>

                            {/* Ideas list */}
                            {isOpen && (
                                <div className="px-4 pb-4 space-y-2 border-t border-zinc-700/50 pt-3 animate-in slide-in-from-top-2 duration-200">
                                    {pillar.ideas.map((idea) => {
                                        const isSelected = selected.includes(idea);
                                        return (
                                            <button
                                                key={idea}
                                                onClick={() => toggleIdea(pillar.name, idea)}
                                                className={cn(
                                                    "w-full text-left flex items-center gap-3 p-3 text-sm transition-all duration-150 rounded-none border",
                                                    isSelected
                                                        ? cn(cfg.border, cfg.bg, cfg.color, "font-bold")
                                                        : "border-zinc-700/50 bg-zinc-900/30 text-foreground/70 hover:border-zinc-500"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-5 h-5 flex-shrink-0 border flex items-center justify-center transition-all",
                                                    isSelected ? cn(cfg.border.replace("/60", ""), "bg-current/20") : "border-zinc-600"
                                                )}>
                                                    {isSelected && <Check className="w-3 h-3" />}
                                                </div>
                                                {idea}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Seal Button */}
            <Button
                onClick={handleSeal}
                disabled={isSubmitting || totalSelected === 0}
                className={cn(
                    "w-full font-black py-5 uppercase tracking-widest brutal-btn transition-all duration-300",
                    coveredPillars === 4
                        ? "bg-turquoise hover:bg-turquoise-light text-zinc-950 shadow-[0_0_20px_rgba(45,212,191,0.4)]"
                        : coveredPillars > 0
                            ? "bg-zinc-700 hover:bg-zinc-600 text-foreground"
                            : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                )}
            >
                {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : totalSelected === 0 ? (
                    "Selecciona actividades para empezar"
                ) : (
                    <>
                        <Shield className="w-4 h-4 mr-2" />
                        Sellar Blueprint {currentTier ? `(+${currentTier.xp} XP — ${currentTier.label})` : ""}
                    </>
                )}
            </Button>
        </div>
    );
};
