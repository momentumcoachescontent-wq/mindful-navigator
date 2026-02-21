import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { xpEventBus } from "@/lib/xpEventBus";
import { Check, ChevronRight, Shield, Clock, Heart, Wifi, Loader2, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface ScriptCategory {
    name: string;
    scripts: string[];
}

interface BoundaryScriptForgeProps {
    categories: ScriptCategory[];
}

const categoryIcons: Record<string, React.ReactNode> = {
    "Límites de Tiempo": <Clock className="w-5 h-5" />,
    "Límites Emocionales": <Heart className="w-5 h-5" />,
    "Límites Físicos": <Shield className="w-5 h-5" />,
    "Límites Digitales": <Wifi className="w-5 h-5" />,
};

const categoryColors: Record<string, string> = {
    "Límites de Tiempo": "border-turquoise/50 text-turquoise",
    "Límites Emocionales": "border-coral/50 text-coral",
    "Límites Físicos": "border-primary/50 text-primary",
    "Límites Digitales": "border-secondary/50 text-secondary",
};

type Stage = "select_category" | "select_script" | "forge" | "sealed";

export const BoundaryScriptForge = ({ categories }: BoundaryScriptForgeProps) => {
    const { user } = useAuth();
    const [stage, setStage] = useState<Stage>("select_category");
    const [selectedCategory, setSelectedCategory] = useState<ScriptCategory | null>(null);
    const [selectedScript, setSelectedScript] = useState<string | null>(null);
    const [forgedScript, setForgedScript] = useState("");
    const [situation, setSituation] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getLocalDate = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    const handleSeal = async () => {
        if (!forgedScript.trim() || !situation.trim()) {
            toast({ title: "Escudo incompleto", description: "Describe la situación y personaliza el script.", variant: "destructive" });
            return;
        }
        if (!user) return;

        setIsSubmitting(true);

        try {
            const today = getLocalDate();
            const xpReward = 60;

            // 1. Save personalized boundary script to journal
            const journalContent = {
                title: `Escudo Forjado: ${selectedCategory?.name}`,
                text: `SITUACIÓN: ${situation}\n\nSCRIPT BASE: ${selectedScript}\n\nMI VERSIÓN PERSONALIZADA:\n${forgedScript}`,
                tags: ["Límites", "Escudo Forjado", selectedCategory?.name || ""]
            };

            const { error: journalError } = await supabase.from('journal_entries').insert([{
                user_id: user.id,
                content: JSON.stringify(journalContent),
                entry_type: 'reflection',
                tags: ["Límites", "Escudo Forjado"]
            } as never]);

            if (journalError) throw journalError;

            // 2. Register in daily_missions
            const uniqueMissionId = `boundary_script_forge_${Date.now()}`;
            await supabase.from('daily_missions').insert([{
                user_id: user.id,
                mission_type: 'tool_protocol',
                mission_id: uniqueMissionId,
                xp_earned: xpReward,
                mission_date: today,
                metadata: { tool_tag: 'limits-scripts', category: selectedCategory?.name }
            } as never]);

            // 3. Add XP
            const { data: progressData } = await supabase
                .from('user_progress')
                .select('total_xp')
                .eq('user_id', user.id)
                .single();

            if (progressData) {
                await supabase
                    .from('user_progress')
                    .update({ total_xp: (progressData.total_xp || 0) + xpReward } as never)
                    .eq('user_id', user.id);
            }

            // Emit to Dashboard
            xpEventBus.emit(xpReward);

            // 🎉 Confetti burst
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#94d82d', '#2dd4bf', '#f06595'] });

            setStage("sealed");
            toast({ title: `+${xpReward} XP — Escudo Forjado`, description: "Tu script personalizado está en el Diario." });

        } catch (err) {
            console.error("Error sealing script:", err);
            toast({ title: "Error del Sistema", description: "No pudimos guardar el escudo.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Stage: SEALED ──────────────────────────────────────────────
    if (stage === "sealed") {
        return (
            <div className="brutal-card bg-success/10 border-success/30 p-6 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-success" />
                </div>
                <h3 className="font-display font-bold text-success text-xl">Escudo Forjado</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Tu versión personalizada del límite está sellada en tu Diario. Úsala la próxima vez que lo necesites.
                </p>
                <div className="bg-background/50 border border-success/20 rounded-none p-4 text-left text-sm text-foreground/80 font-medium italic">
                    "{forgedScript}"
                </div>
            </div>
        );
    }

    // ── Stage: SELECT CATEGORY ──────────────────────────────────────────
    if (stage === "select_category") {
        return (
            <div className="brutal-card bg-card border-secondary/30 p-6 space-y-5 animate-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                    <div className="w-10 h-10 bg-secondary flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                        <Shield className="w-5 h-5 text-zinc-950" />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-lg text-secondary">[TALLER] Forja tu Escudo</h3>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-primary" />
                            Recompensa: +60 XP al completar
                        </p>
                    </div>
                </div>
                <p className="text-sm text-foreground/90 font-medium leading-relaxed">
                    Las palabras que no has dicho son el arma que otros usan contra ti. Elige el frente de batalla:
                </p>
                <div className="grid grid-cols-2 gap-3">
                    {categories.map((cat) => (
                        <button
                            key={cat.name}
                            onClick={() => { setSelectedCategory(cat); setStage("select_script"); }}
                            className={cn(
                                "border-2 p-4 text-left space-y-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-[3px_3px_0px_#0f172a]",
                                categoryColors[cat.name] || "border-primary/50 text-primary",
                                "bg-background/50 rounded-none"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                {categoryIcons[cat.name] || <Shield className="w-5 h-5" />}
                                <span className="font-display font-bold text-sm">{cat.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{cat.scripts.length} scripts disponibles</p>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // ── Stage: SELECT SCRIPT ──────────────────────────────────────────────
    if (stage === "select_script" && selectedCategory) {
        return (
            <div className="brutal-card bg-card border-secondary/30 p-6 space-y-5 animate-in slide-in-from-right-4 duration-400">
                <div className="flex items-center gap-2 border-b border-border/50 pb-4">
                    <button onClick={() => setStage("select_category")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        ← Volver
                    </button>
                    <span className={cn("font-display font-bold text-sm ml-auto", categoryColors[selectedCategory.name])}>
                        {selectedCategory.name}
                    </span>
                </div>
                <p className="text-sm text-foreground/90 font-medium">
                    Elige el script que más se acerca a tu situación:
                </p>
                <div className="space-y-3">
                    {selectedCategory.scripts.map((script, i) => (
                        <button
                            key={i}
                            onClick={() => { setSelectedScript(script); setStage("forge"); }}
                            className="w-full text-left border border-border/50 hover:border-secondary/50 bg-background/30 p-4 text-sm font-medium text-foreground transition-all duration-200 hover:shadow-[2px_2px_0px_var(--secondary)] hover:translate-x-[-1px] rounded-none flex items-center justify-between group"
                        >
                            <span>"{script}"</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-secondary flex-shrink-0 ml-3" />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // ── Stage: FORGE ──────────────────────────────────────────────────────
    if (stage === "forge" && selectedScript) {
        return (
            <div className="brutal-card bg-card border-secondary/30 p-6 space-y-5 animate-in slide-in-from-right-4 duration-400">
                <div className="flex items-center gap-2 border-b border-border/50 pb-4">
                    <button onClick={() => setStage("select_script")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        ← Volver
                    </button>
                    <span className="font-display font-bold text-sm text-secondary ml-auto">Forja tu versión</span>
                </div>

                {/* Script base de referencia */}
                <div className="bg-secondary/10 border-l-4 border-secondary p-4">
                    <p className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-wider">Script base:</p>
                    <p className="text-sm text-foreground font-medium italic">"{selectedScript}"</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                            ¿Con quién y en qué situación la usarás?
                        </label>
                        <Textarea
                            placeholder="Ej: Mi mamá me pide que la acompañe al médico cuando ya tengo planes..."
                            className="min-h-[70px] resize-none bg-background/50 border-input font-medium focus-visible:ring-secondary/50 rounded-none text-sm shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]"
                            value={situation}
                            onChange={(e) => setSituation(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                            Reescríbelo en tus palabras (tu versión personalizada):
                        </label>
                        <Textarea
                            placeholder="Usa el script de arriba como base y acomódalo a tu tono de voz real..."
                            className="min-h-[90px] resize-none bg-background/50 border-input font-medium focus-visible:ring-secondary/50 rounded-none text-sm shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]"
                            value={forgedScript}
                            onChange={(e) => setForgedScript(e.target.value)}
                        />
                    </div>

                    <Button
                        onClick={handleSeal}
                        disabled={isSubmitting || !forgedScript.trim() || !situation.trim()}
                        className="w-full brutal-btn bg-secondary hover:bg-secondary/80 text-zinc-950 font-bold"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sellar Escudo (+60 XP)"}
                    </Button>
                </div>
            </div>
        );
    }

    return null;
};
