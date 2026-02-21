import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { xpEventBus } from "@/lib/xpEventBus";
import { Zap, ChevronRight, Check, Loader2, BookOpen } from "lucide-react";
import confetti from "canvas-confetti";

interface Section {
    title: string;
    description?: string;
    steps?: string[];
}

interface BreakLoopStoryProps {
    sections: Section[];
    closing?: string;
}

type Chapter = "prologue" | "chapter_1" | "chapter_2" | "chapter_3" | "epilogue" | "sealed";

const CHAPTER_NARRATIVES = {
    prologue: {
        heading: "El Loop ha comenzado.",
        paragraphs: [
            "El pensamiento llegó sin avisar. Primero suave, casi inofensivo. Luego otra vez. Y otra.",
            "Tu mente está atrapada en un bucle. El mismo miedo, la misma imagen, la misma pregunta sin respuesta que gira en espiral como una cinta sin fin.",
            "La lógica no sirve aquí. Intentar \"pensarlo mejor\" solo alimenta al monstruo.",
            "Hay una sola salida: <span class=\"text-coral font-black\">interrumpir el patrón desde el cuerpo.</span>"
        ],
        cta: "Iniciar Protocolo de Ruptura",
    },
    chapter_1: {
        chapter: "Capítulo I",
        badge: "SHOCK FÍSICO",
        color: "text-coral",
        border: "border-coral",
        bg: "bg-coral/5",
        glow: "shadow-[0_0_20px_rgba(255,99,71,0.2)]",
        narrative: "Tu sistema nervioso está en modo pánico. No escucha razones — solo ataques.",
        bridge: "Tu cuerpo acaba de recibir una señal inequívoca: el peligro no es real. La corteza prefrontal empieza a recuperar el control.",
        confirmText: "Lo hice — estoy listo/a para el siguiente capítulo",
    },
    chapter_2: {
        chapter: "Capítulo II",
        badge: "ANCLAJE SENSORIAL",
        color: "text-secondary",
        border: "border-secondary",
        bg: "bg-secondary/5",
        glow: "shadow-[0_0_20px_rgba(94,234,212,0.2)]",
        narrative: "El loop mental vive en el tiempo: en el pasado que ya fue o en el futuro que quizás no ocurra. Tu único refugio es el AHORA.",
        bridge: "Has vuelto. El presente siempre estuvo aquí, esperándote. El loop se alimenta del tiempo — y tú acabas de anclarte al único momento real.",
        confirmText: "He completado el anclaje",
    },
    chapter_3: {
        chapter: "Capítulo III",
        badge: "RESPIRACIÓN TÁCTICA",
        color: "text-primary",
        border: "border-primary",
        bg: "bg-primary/5",
        glow: "shadow-[0_0_20px_rgba(139,92,246,0.2)]",
        narrative: "Tu corazón aún late rápido. La adrenalina sigue en sangre. Ahora tomas el último control que tienes: tu ritmo.",
        bridge: "Cuatro tiempos. Cuatro veces. Tu sistema nervioso parasimpático acaba de activarse. El cortisol cae. La tormenta pasa.",
        confirmText: "He respirado — la tormenta pasó",
    },
};

const TOTAL_XP = 75;

const getLocalDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const BreakLoopStory = ({ sections, closing }: BreakLoopStoryProps) => {
    const { user } = useAuth();
    const [chapter, setChapter] = useState<Chapter>("prologue");
    const [confirmedChapters, setConfirmedChapters] = useState<number[]>([]);
    const [reflection, setReflection] = useState("");
    const [isSealing, setIsSealing] = useState(false);
    const [fadeIn, setFadeIn] = useState(true);

    // Transition animation between chapters
    const goToChapter = (next: Chapter) => {
        setFadeIn(false);
        setTimeout(() => {
            setChapter(next);
            setFadeIn(true);
            window.scrollTo({ top: window.scrollY + 100, behavior: 'smooth' });
        }, 300);
    };

    const confirmChapter = (idx: number, next: Chapter) => {
        setConfirmedChapters(prev => [...new Set([...prev, idx])]);
        setTimeout(() => goToChapter(next), 600);
    };

    const seal = async () => {
        if (!user) return;
        if (!reflection.trim()) {
            toast({ title: "El epílogo está vacío", description: "Escribe cómo te sientes ahora para cerrar el ciclo.", variant: "destructive" });
            return;
        }
        setIsSealing(true);
        try {
            const today = getLocalDate();
            const chapterSummary = sections.map((s, i) => `${s.title}: ${s.steps.join(" → ")}`).join("\n");

            const journalContent = {
                title: `Protocolo de Ruptura — Ciclo Completado`,
                text: `He atravesado el loop mental con el Protocolo de Ruptura.\n\n${chapterSummary}\n\n=== EPÍLOGO ===\n${reflection}`,
                tags: ["Protocolo de Ruptura", "Loop Roto", "Resiliencia"]
            };

            await supabase.from('journal_entries').insert([{
                user_id: user.id,
                content: JSON.stringify(journalContent),
                entry_type: 'reflection',
                tags: ['Protocolo de Ruptura', 'Loop Roto']
            } as never]);

            await supabase.from('daily_missions').insert([{
                user_id: user.id,
                mission_type: 'tool_protocol',
                mission_id: `break_loop_${Date.now()}`,
                xp_earned: TOTAL_XP,
                mission_date: today,
                metadata: { tool_tag: 'protocolo-ruptura', chapters_completed: confirmedChapters.length }
            } as never]);

            const { data: p } = await supabase.from('user_progress').select('total_xp').eq('user_id', user.id).single();
            if (p) {
                await supabase.from('user_progress').update({ total_xp: (p.total_xp || 0) + TOTAL_XP } as never).eq('user_id', user.id);
            }
            xpEventBus.emit(TOTAL_XP);

            // Triple confetti — the storm has passed
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 }, colors: ['#a78bfa', '#2dd4bf', '#f9fafb'] });
            confetti({ particleCount: 50, angle: 55, spread: 65, origin: { x: 0, y: 0.5 }, colors: ['#a78bfa'] });
            confetti({ particleCount: 50, angle: 125, spread: 65, origin: { x: 1, y: 0.5 }, colors: ['#2dd4bf'] });

            goToChapter("sealed");
            toast({ title: `+${TOTAL_XP} XP — Loop Roto`, description: "Tu historia de resiliencia está en el Diario." });
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "No pudimos guardar tu historia.", variant: "destructive" });
        } finally {
            setIsSealing(false);
        }
    };

    const ChapterSection = ({ sectionIdx, chapterKey, next }: { sectionIdx: number; chapterKey: "chapter_1" | "chapter_2" | "chapter_3"; next: Chapter }) => {
        const section = sections[sectionIdx];
        const meta = CHAPTER_NARRATIVES[chapterKey];
        const isConfirmed = confirmedChapters.includes(sectionIdx);
        if (!section) return null;

        return (
            <div className={cn("border-2 p-6 space-y-5 transition-all duration-500", meta.border, meta.bg, meta.glow)}>
                {/* Chapter badge */}
                <div className="flex items-center gap-3">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest border px-2 py-1", meta.border, meta.color)}>
                        {meta.chapter}
                    </span>
                    <span className={cn("font-display font-black text-sm uppercase tracking-wider", meta.color)}>
                        {meta.badge} — {section.title}
                    </span>
                </div>

                {/* Narrative intro */}
                <p className="text-sm font-medium text-foreground/90 leading-relaxed italic border-l-2 border-zinc-600 pl-4">
                    "{meta.narrative}"
                </p>

                {/* Protocol steps */}
                <div className="space-y-2">
                    {section.steps.map((step, i) => (
                        <div key={i} className={cn(
                            "flex items-start gap-3 border px-4 py-3 transition-all",
                            meta.border.replace("/60", "/20"),
                            "bg-background/30"
                        )}>
                            <span className={cn("font-black text-sm flex-shrink-0 mt-0.5", meta.color)}>{i + 1}.</span>
                            <p className="text-sm font-medium text-foreground/90">{step}</p>
                        </div>
                    ))}
                </div>

                {/* Narrative bridge + confirm */}
                {!isConfirmed ? (
                    <div className="space-y-4">
                        <div className={cn("border-t pt-4", meta.border.replace("border", "border-t"))}>
                            <p className="text-xs text-muted-foreground italic leading-relaxed">
                                {meta.narrative.split(".")[0]}... Ahora confirma que lo hiciste.
                            </p>
                        </div>
                        <Button
                            onClick={() => confirmChapter(sectionIdx, next)}
                            className={cn(
                                "w-full font-black py-5 uppercase tracking-wider brutal-btn text-zinc-950",
                                meta.border.replace("border-", "bg-").replace("/60", "")
                            )}
                        >
                            <Check className="w-4 h-4 mr-2" />
                            {meta.confirmText}
                        </Button>
                    </div>
                ) : (
                    <div className={cn("border px-4 py-3 flex items-center gap-3 animate-in fade-in duration-500", meta.border.replace("/60", "/30"), meta.bg)}>
                        <Check className={cn("w-5 h-5", meta.color)} />
                        <p className={cn("text-sm font-bold", meta.color)}>
                            {meta.bridge}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    // ── SEALED ────────────────────────────────────────────────────────────────
    if (chapter === "sealed") {
        return (
            <div className={cn(
                "border-2 border-primary/60 bg-primary/5 p-6 text-center space-y-4 shadow-[0_0_25px_rgba(139,92,246,0.2)]",
                fadeIn ? "animate-in fade-in zoom-in duration-500" : "opacity-0"
            )}>
                <div className="w-14 h-14 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                    <BookOpen className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-black text-primary text-xl uppercase tracking-wide">Historia Completa</h3>
                <p className="text-sm text-muted-foreground">
                    El loop fue real. El miedo fue real. Y tú lo atravesaste de todas formas. Eso también es real.
                </p>
                <div className="border border-primary/20 bg-primary/5 p-4 italic text-sm text-foreground/70 text-left">
                    "{reflection}"
                </div>
                <div className="border border-primary/20 p-3">
                    <p className="text-xl font-black text-primary">+{TOTAL_XP} XP</p>
                    <p className="text-xs text-muted-foreground">Loop Roto</p>
                </div>
            </div>
        );
    }

    // ── PROLOGUE ─────────────────────────────────────────────────────────────
    if (chapter === "prologue") {
        const p = CHAPTER_NARRATIVES.prologue;
        return (
            <div className={cn(
                "border-2 border-coral/40 bg-zinc-950 p-6 space-y-5 transition-opacity duration-300 shadow-[0_0_25px_rgba(255,99,71,0.15)]",
                fadeIn ? "opacity-100 animate-in slide-in-from-bottom-4 duration-700" : "opacity-0"
            )}>
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-coral/20 pb-4">
                    <div className="w-10 h-10 bg-coral flex items-center justify-center shadow-[2px_2px_0px_#7f1d1d] animate-pulse">
                        <Zap className="w-5 h-5 text-zinc-950" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-coral/60 uppercase tracking-widest">Protocolo Narrativo</p>
                        <h3 className="font-display font-black text-coral text-lg uppercase tracking-wide">
                            {p.heading}
                        </h3>
                    </div>
                </div>

                {/* Story paragraphs */}
                <div className="space-y-4">
                    {p.paragraphs.map((text, i) => (
                        <p
                            key={i}
                            className={cn(
                                "text-sm leading-relaxed",
                                i === p.paragraphs.length - 1
                                    ? "text-foreground font-bold text-base border-l-2 border-coral pl-4"
                                    : "text-foreground/80 font-medium"
                            )}
                            dangerouslySetInnerHTML={{ __html: text }}
                        />
                    ))}
                </div>

                {/* XP announcement */}
                <div className="border border-coral/20 bg-coral/5 px-4 py-3 flex items-center justify-between">
                    <p className="text-xs text-coral/70 font-bold uppercase tracking-wider">Al romper el loop</p>
                    <p className="text-lg font-black text-coral">+{TOTAL_XP} XP</p>
                </div>

                <Button
                    onClick={() => goToChapter("chapter_1")}
                    className="w-full font-black py-6 bg-coral hover:bg-coral-light text-zinc-950 brutal-btn uppercase tracking-widest text-base"
                >
                    <ChevronRight className="w-5 h-5 mr-2" />
                    {p.cta}
                </Button>
            </div>
        );
    }

    // ── CHAPTERS 1–3 ─────────────────────────────────────────────────────────
    return (
        <div className={cn("space-y-5 transition-opacity duration-300", fadeIn ? "opacity-100" : "opacity-0")}>
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-3">
                {["chapter_1", "chapter_2", "chapter_3"].map((c, i) => {
                    const active = chapter === c;
                    const done = confirmedChapters.includes(i);
                    return (
                        <div key={c} className={cn(
                            "transition-all duration-500",
                            done ? "w-6 h-6 bg-green-500 flex items-center justify-center" :
                                active ? "w-6 h-6 bg-coral" : "w-3 h-3 bg-zinc-700"
                        )}>
                            {done && <Check className="w-3 h-3 text-white" />}
                        </div>
                    );
                })}
            </div>

            {chapter === "chapter_1" && <ChapterSection sectionIdx={0} chapterKey="chapter_1" next="chapter_2" />}
            {chapter === "chapter_2" && <ChapterSection sectionIdx={1} chapterKey="chapter_2" next="chapter_3" />}
            {chapter === "chapter_3" && <ChapterSection sectionIdx={2} chapterKey="chapter_3" next="epilogue" />}

            {/* Epilogue prompt — only shows after last chapter confirmed */}
            {chapter === "epilogue" && (
                <div className="border-2 border-primary/40 bg-primary/5 p-6 space-y-5 animate-in slide-in-from-bottom-4 duration-500 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest border border-primary/40 px-2 py-1">Epílogo</span>
                        <span className="font-display font-black text-primary text-sm uppercase tracking-wider">El Otro Lado</span>
                    </div>
                    <p className="text-sm font-medium text-foreground/90 leading-relaxed italic border-l-2 border-primary pl-4">
                        "Lo atravesaste. Estás aquí. ¿Cómo se siente?"
                    </p>
                    <p className="text-sm text-foreground/80">
                        No necesitas tener las palabras perfectas. Solo escribe lo que hay ahora mismo en tu cuerpo y en tu mente.
                        Esta es la parte más difícil — y la más valiente.
                    </p>
                    <Textarea
                        placeholder="Lo que siento ahora es..."
                        className="min-h-[120px] resize-none bg-background/50 border-primary/30 font-medium focus-visible:ring-primary/50 rounded-none text-sm shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]"
                        value={reflection}
                        onChange={e => setReflection(e.target.value)}
                    />
                    <Button
                        onClick={seal}
                        disabled={isSealing || !reflection.trim()}
                        className="w-full font-black py-5 bg-primary hover:bg-primary/80 text-white brutal-btn uppercase tracking-widest"
                    >
                        {isSealing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <><BookOpen className="w-4 h-4 mr-2" />Sellar Historia (+{TOTAL_XP} XP)</>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
};
