import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { xpEventBus } from "@/lib/xpEventBus";
import { Users, Shield, Check, Plus, X, ChevronRight, Loader2, Sparkles, Lock, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";

interface Circle {
    level: number;
    name: string;
    description: string;
    criteria: string[];
}

interface ActionPlan {
    title: string;
    items: string[];
}

interface SupportNetworkTrackerProps {
    circles: Circle[];
    action_plan?: ActionPlan;
}

type Stage = "map_network" | "commit_tasks" | "tracking" | "sealed";

const CIRCLE_CONFIG: Record<number, { color: string; border: string; bg: string; glow: string; badge: string }> = {
    1: { color: "text-coral", border: "border-coral/60", bg: "bg-coral/10", glow: "shadow-[0_0_12px_rgba(255,99,71,0.3)]", badge: "🔴" },
    2: { color: "text-secondary", border: "border-secondary/60", bg: "bg-secondary/10", glow: "shadow-[0_0_12px_rgba(94,234,212,0.3)]", badge: "🟡" },
    3: { color: "text-primary", border: "border-primary/60", bg: "bg-primary/10", glow: "shadow-[0_0_12px_rgba(139,92,246,0.3)]", badge: "🔵" },
};

const XP_PER_TASK = 15;
const NETWORK_MAP_XP = 30;

const getLocalDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const SupportNetworkTracker = ({ circles, action_plan }: SupportNetworkTrackerProps) => {
    const { user } = useAuth();

    // Stage
    const [stage, setStage] = useState<Stage>("map_network");

    // Phase 1: Network map (name inputs per circle)
    const [networkMap, setNetworkMap] = useState<Record<number, string[]>>(
        Object.fromEntries(circles.map(c => [c.level, [""]]))
    );

    // Phase 2: Task commitments
    const [committedTasks, setCommittedTasks] = useState<number[]>([]);

    // Phase 3: Task tracking (which committed tasks are done)
    const [completedTasks, setCompletedTasks] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [savingTaskIdx, setSavingTaskIdx] = useState<number | null>(null);
    const [networkSaved, setNetworkSaved] = useState(false);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const addContact = (level: number) => {
        setNetworkMap(prev => ({ ...prev, [level]: [...(prev[level] || []), ""] }));
    };

    const removeContact = (level: number, idx: number) => {
        setNetworkMap(prev => ({ ...prev, [level]: prev[level].filter((_, i) => i !== idx) }));
    };

    const updateContact = (level: number, idx: number, name: string) => {
        setNetworkMap(prev => {
            const updated = [...(prev[level] || [])];
            updated[idx] = name;
            return { ...prev, [level]: updated };
        });
    };

    const totalContacts = () =>
        Object.values(networkMap).flat().filter(n => n.trim()).length;

    const toggleTask = (idx: number) => {
        setCommittedTasks(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };

    // ── Save network map ──────────────────────────────────────────────────────
    const saveNetworkMap = async () => {
        if (totalContacts() < 1) {
            toast({ title: "Red vacía", description: "Agrega al menos 1 contacto en cualquier círculo.", variant: "destructive" });
            return;
        }
        if (!user) return;
        setIsSaving(true);
        try {
            const today = getLocalDate();

            const networkLines = circles.map(c => {
                const names = (networkMap[c.level] || []).filter(n => n.trim());
                return names.length ? `${c.name}: ${names.join(", ")}` : null;
            }).filter(Boolean).join("\n");

            const journalContent = {
                title: `Red de Apoyo Mapeada — ${today}`,
                text: `He identificado y organizado mi red de protección:\n\n${networkLines}`,
                tags: ["Red de Apoyo", "Mapa de Contactos"]
            };

            await supabase.from('journal_entries').insert([{
                user_id: user.id,
                content: JSON.stringify(journalContent),
                entry_type: 'reflection',
                tags: ['Red de Apoyo', 'Mapa de Contactos']
            } as never]);

            await supabase.from('daily_missions').insert([{
                user_id: user.id,
                mission_type: 'tool_protocol',
                mission_id: `support_network_map_${Date.now()}`,
                xp_earned: NETWORK_MAP_XP,
                mission_date: today,
                metadata: { tool_tag: 'support-network', contacts: totalContacts() }
            } as never]);

            const { data: p } = await supabase.from('user_progress').select('total_xp').eq('user_id', user.id).single();
            if (p) {
                await supabase.from('user_progress').update({ total_xp: (p.total_xp || 0) + NETWORK_MAP_XP } as never).eq('user_id', user.id);
            }
            xpEventBus.emit(NETWORK_MAP_XP);

            confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 }, colors: ['#2dd4bf', '#94d82d'] });
            setNetworkSaved(true);
            toast({ title: `+${NETWORK_MAP_XP} XP — Red Mapeada`, description: `${totalContacts()} contacto(s) en tu escudo.` });
            setStage("commit_tasks");
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "No pudimos guardar la red.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    // ── Move to tracking ──────────────────────────────────────────────────────
    const startTracking = () => {
        if (committedTasks.length === 0) {
            toast({ title: "Selecciona al menos 1 tarea", description: "Elige las acciones que harás esta semana.", variant: "destructive" });
            return;
        }
        setStage("tracking");
    };

    // ── Complete an individual task ───────────────────────────────────────────
    const completeTask = async (taskIdx: number) => {
        if (!user || completedTasks.includes(taskIdx)) return;
        setSavingTaskIdx(taskIdx);
        try {
            const today = getLocalDate();
            const taskText = action_plan?.items[taskIdx] || "";

            await supabase.from('journal_entries').insert([{
                user_id: user.id,
                content: JSON.stringify({
                    title: `Tarea de Red de Apoyo completada`,
                    text: taskText,
                    tags: ["Red de Apoyo", "Tarea Completada"]
                }),
                entry_type: 'reflection',
                tags: ['Red de Apoyo', 'Tarea Completada']
            } as never]);

            await supabase.from('daily_missions').insert([{
                user_id: user.id,
                mission_type: 'tool_protocol',
                mission_id: `support_task_${taskIdx}_${Date.now()}`,
                xp_earned: XP_PER_TASK,
                mission_date: today,
                metadata: { tool_tag: 'support-network', task: taskText }
            } as never]);

            const { data: p } = await supabase.from('user_progress').select('total_xp').eq('user_id', user.id).single();
            if (p) {
                await supabase.from('user_progress').update({ total_xp: (p.total_xp || 0) + XP_PER_TASK } as never).eq('user_id', user.id);
            }
            xpEventBus.emit(XP_PER_TASK);

            const newCompleted = [...completedTasks, taskIdx];
            setCompletedTasks(newCompleted);

            if (newCompleted.length === committedTasks.length) {
                // All committed tasks done!
                confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ['#2dd4bf', '#a78bfa', '#38bdf8'] });
                confetti({ particleCount: 60, angle: 60, spread: 70, origin: { x: 0 }, colors: ['#94d82d'] });
                confetti({ particleCount: 60, angle: 120, spread: 70, origin: { x: 1 }, colors: ['#f59e0b'] });
                setStage("sealed");
                toast({ title: "¡Plan de Seguridad Completado!", description: `Todas las tareas selladas. +${XP_PER_TASK} XP adicionales ganados.` });
            } else {
                confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 }, colors: ['#2dd4bf', '#94d82d'] });
                toast({ title: `+${XP_PER_TASK} XP — Tarea Sellada`, description: `Restan ${committedTasks.length - newCompleted.length} tarea(s).` });
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "No pudimos registrar la tarea.", variant: "destructive" });
        } finally {
            setSavingTaskIdx(null);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // ── STAGE: MAP NETWORK ───────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════════════
    if (stage === "map_network") {
        return (
            <div className="border-2 border-secondary/40 bg-secondary/5 p-6 space-y-5 animate-in slide-in-from-bottom-4 duration-700 shadow-[0_0_15px_rgba(94,234,212,0.1)]">

                <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                    <div className="w-10 h-10 bg-secondary flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                        <Users className="w-5 h-5 text-zinc-950" />
                    </div>
                    <div>
                        <h3 className="font-display font-black text-secondary text-lg uppercase tracking-wide">Activa tu Red</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Sparkles className="w-3 h-3 text-primary" /> +{NETWORK_MAP_XP} XP al mapear
                        </p>
                    </div>
                </div>

                <p className="text-sm font-medium text-foreground/90 leading-relaxed">
                    Un escudo vacío no protege nada. Pon <span className="text-secondary font-bold">nombres reales</span> en cada círculo.
                    Nadie más verá esta información — es tuya.
                </p>

                <div className="space-y-4">
                    {circles.map(circle => {
                        const cfg = CIRCLE_CONFIG[circle.level] || CIRCLE_CONFIG[1];
                        const contacts = networkMap[circle.level] || [""];
                        return (
                            <div key={circle.level} className={cn("border-2 p-4 space-y-3 transition-all", cfg.border, contacts.some(n => n.trim()) && cfg.glow)}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={cn("font-display font-bold text-sm flex items-center gap-1.5", cfg.color)}>
                                            {cfg.badge} {circle.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{circle.description}</p>
                                    </div>
                                    <button
                                        onClick={() => addContact(circle.level)}
                                        className={cn("border px-2 py-1 text-xs font-bold flex items-center gap-1 transition-all hover:scale-105", cfg.border, cfg.color)}
                                    >
                                        <Plus className="w-3 h-3" /> Agregar
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {contacts.map((name, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <Input
                                                placeholder={`Nombre ${i + 1}...`}
                                                value={name}
                                                onChange={e => updateContact(circle.level, i, e.target.value)}
                                                className={cn(
                                                    "rounded-none border bg-background/50 font-medium text-sm h-9 focus-visible:ring-0 transition-all",
                                                    name.trim() ? cn(cfg.border, "shadow-[1px_1px_0px_rgba(0,0,0,0.3)]") : "border-zinc-700"
                                                )}
                                            />
                                            {contacts.length > 1 && (
                                                <button onClick={() => removeContact(circle.level, i)} className="text-zinc-500 hover:text-destructive transition-colors">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <Button
                    onClick={saveNetworkMap}
                    disabled={isSaving || totalContacts() === 0}
                    className="w-full font-black py-5 bg-secondary hover:bg-secondary/80 text-zinc-950 brutal-btn uppercase tracking-widest"
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <><Shield className="w-4 h-4 mr-2" />Guardar Red y Continuar (+{NETWORK_MAP_XP} XP)</>
                    )}
                </Button>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ── STAGE: COMMIT TASKS ──────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════════════
    if (stage === "commit_tasks" && action_plan) {
        return (
            <div className="border-2 border-primary/40 bg-primary/5 p-6 space-y-5 animate-in slide-in-from-right-4 duration-400">
                <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                    <div className="w-10 h-10 bg-primary flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                        <AlertTriangle className="w-5 h-5 text-zinc-950" />
                    </div>
                    <div>
                        <h3 className="font-display font-black text-primary text-lg uppercase tracking-wide">{action_plan.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">+{XP_PER_TASK} XP por cada tarea que completes</p>
                    </div>
                </div>

                <p className="text-sm font-medium text-foreground/90">
                    Elige las tareas que <span className="text-primary font-bold">SÍ harás esta semana.</span> Solo las que puedas cumplir — el seguimiento te cuentas a ti mismo:
                </p>

                <div className="space-y-2">
                    {action_plan.items.map((item, idx) => {
                        const selected = committedTasks.includes(idx);
                        return (
                            <button
                                key={idx}
                                onClick={() => toggleTask(idx)}
                                className={cn(
                                    "w-full text-left border-2 p-4 text-sm font-medium transition-all duration-200 flex items-start gap-3 rounded-none",
                                    selected
                                        ? "border-primary/60 bg-primary/10 text-primary"
                                        : "border-zinc-700 bg-zinc-900/30 text-foreground/70 hover:border-zinc-500"
                                )}
                            >
                                <div className={cn(
                                    "w-5 h-5 flex-shrink-0 border-2 flex items-center justify-center mt-0.5 transition-all",
                                    selected ? "border-primary bg-primary/20" : "border-zinc-600"
                                )}>
                                    {selected && <Check className="w-3 h-3 text-primary" />}
                                </div>
                                {item}
                                {selected && (
                                    <span className="ml-auto text-[10px] font-black text-primary/60 flex-shrink-0">+{XP_PER_TASK} XP</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {committedTasks.length > 0 && (
                    <div className="border border-primary/30 bg-primary/5 px-4 py-2 flex items-center justify-between">
                        <p className="text-xs text-primary font-bold">{committedTasks.length} tarea(s) comprometida(s)</p>
                        <p className="text-xs text-primary font-black">Potencial: +{committedTasks.length * XP_PER_TASK} XP</p>
                    </div>
                )}

                <Button
                    onClick={startTracking}
                    disabled={committedTasks.length === 0}
                    className="w-full font-black py-5 bg-primary hover:bg-primary/80 text-zinc-950 brutal-btn uppercase tracking-widest"
                >
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Iniciar Seguimiento ({committedTasks.length} tarea{committedTasks.length !== 1 ? "s" : ""})
                </Button>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ── STAGE: TRACKING ──────────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════════════
    if (stage === "tracking" && action_plan) {
        const doneCount = completedTasks.length;
        const totalCount = committedTasks.length;
        const progressPct = Math.round((doneCount / totalCount) * 100);

        return (
            <div className="border-2 border-secondary/40 bg-secondary/5 p-6 space-y-5 animate-in slide-in-from-right-4 duration-400">
                {/* Progress header */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-display font-black text-secondary uppercase tracking-wide text-sm">Seguimiento Activo</h3>
                        <span className="text-secondary font-black text-sm">{doneCount}/{totalCount} completadas</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800">
                        <div
                            className="h-full bg-secondary transition-all duration-700"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">{progressPct}% del plan completado — +{doneCount * XP_PER_TASK} XP ganados</p>
                </div>

                {/* Task list */}
                <div className="space-y-3">
                    {committedTasks.map(idx => {
                        const item = action_plan.items[idx];
                        const isDone = completedTasks.includes(idx);
                        const isSavingThis = savingTaskIdx === idx;

                        return (
                            <div
                                key={idx}
                                className={cn(
                                    "border-2 p-4 transition-all duration-300",
                                    isDone
                                        ? "border-green-500/40 bg-green-500/5"
                                        : "border-secondary/30 bg-background/50"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "w-6 h-6 flex-shrink-0 border-2 flex items-center justify-center mt-0.5 transition-all",
                                        isDone ? "border-green-500 bg-green-500/20" : "border-secondary/40"
                                    )}>
                                        {isDone && <Check className="w-4 h-4 text-green-400" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className={cn("text-sm font-medium", isDone ? "line-through text-foreground/40" : "text-foreground")}>
                                            {item}
                                        </p>
                                        {isDone && <p className="text-xs text-green-400 font-bold mt-1">✓ Sellado +{XP_PER_TASK} XP</p>}
                                    </div>
                                    {!isDone && (
                                        <Button
                                            onClick={() => completeTask(idx)}
                                            disabled={isSavingThis}
                                            size="sm"
                                            className="flex-shrink-0 bg-secondary hover:bg-secondary/80 text-zinc-950 font-black text-xs px-3 rounded-none brutal-btn"
                                        >
                                            {isSavingThis ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-3 h-3 mr-1" />Hecho</>}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {doneCount > 0 && doneCount < totalCount && (
                    <p className="text-xs text-center text-muted-foreground italic">
                        Vuelve aquí cada vez que completes una tarea para registrar tu progreso y reclamar tu XP.
                    </p>
                )}
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ── STAGE: SEALED ────────────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <div className="border-2 border-green-500 bg-green-500/5 p-6 text-center space-y-4 animate-in fade-in zoom-in duration-500 shadow-[0_0_25px_rgba(34,197,94,0.25)]">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <Shield className="w-7 h-7 text-green-400" />
            </div>
            <h3 className="font-display font-black text-green-400 text-xl uppercase tracking-wide">Red Activada</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Tu red de apoyo está mapeada y tu plan de seguridad completado. Estás más protegido/a que antes de entrar aquí.
            </p>
            <div className="grid grid-cols-2 gap-3">
                <div className="border border-green-500/20 bg-green-500/5 p-3">
                    <p className="text-xl font-black text-green-400">{totalContacts()}</p>
                    <p className="text-xs text-muted-foreground">Contactos en tu red</p>
                </div>
                <div className="border border-green-500/20 bg-green-500/5 p-3">
                    <p className="text-xl font-black text-green-400">+{NETWORK_MAP_XP + committedTasks.length * XP_PER_TASK}</p>
                    <p className="text-xs text-muted-foreground">XP Total ganado</p>
                </div>
            </div>
        </div>
    );
};
