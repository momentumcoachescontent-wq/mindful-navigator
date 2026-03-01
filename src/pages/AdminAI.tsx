import { useState, useEffect } from "react";
import { ArrowLeft, Save, Loader2, Brain, Bot, Bell, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface SystemPrompt {
    id: string;
    key_name: string;
    description: string;
    prompt_text: string;
}

interface CoachStats {
    total: number;
    completed: number;
    completionRate: number;
    topMood: string | null;
    avgExchanges: number;
}

interface NudgeStat {
    type: string;
    shown: number;
    acted: number;
    ctr: number;
}

const AdminAI = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [coachStats, setCoachStats] = useState<CoachStats | null>(null);
    const [nudgeStats, setNudgeStats] = useState<NudgeStat[]>([]);
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        const fetchPrompts = async () => {
            // Verificamos permisos antes de jalar
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('user_id', user?.id)
                .single();

            if (!profile?.is_admin) {
                toast.error("Acceso denegado. Se requiere nivel de Administrador.");
                navigate("/");
                return;
            }

            const { data, error } = await supabase
                .from("system_prompts")
                .select("*")
                .order("key_name");

            if (error) {
                console.error("Error fetching prompts:", error);
                toast.error("Error al cargar los prompts maestros.");
            } else {
                setPrompts(data || []);
            }
            setIsLoading(false);
        };

        fetchPrompts();
    }, [user, navigate]);

    // Load Phase 18 metrics
    useEffect(() => {
        const fetchStats = async () => {
            const [sessionsRes, nudgesRes] = await Promise.all([
                supabase.from('coach_sessions').select('completed, mood_detected, exchanges_count'),
                supabase.from('nudge_events').select('nudge_type, action_taken'),
            ]);

            // Coach stats
            const sessions = sessionsRes.data || [];
            const completed = sessions.filter(s => s.completed).length;
            const moodCounts: Record<string, number> = {};
            sessions.forEach(s => { if (s.mood_detected) moodCounts[s.mood_detected] = (moodCounts[s.mood_detected] || 0) + 1; });
            const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
            const avgExchanges = sessions.length ? sessions.reduce((sum, s) => sum + (s.exchanges_count || 0), 0) / sessions.length : 0;
            setCoachStats({ total: sessions.length, completed, completionRate: sessions.length ? Math.round((completed / sessions.length) * 100) : 0, topMood, avgExchanges: Math.round(avgExchanges * 10) / 10 });

            // Nudge stats
            const nudges = nudgesRes.data || [];
            const NUDGE_TYPES = ['streak_danger', 'inactivity', 'negative_sentiment'];
            const NUDGE_LABELS: Record<string, string> = { streak_danger: 'Racha en peligro', inactivity: 'Inactividad', negative_sentiment: 'Sentimiento negativo' };
            setNudgeStats(NUDGE_TYPES.map(type => {
                const shown = nudges.filter(n => n.nudge_type === type).length;
                const acted = nudges.filter(n => n.nudge_type === type && n.action_taken).length;
                return { type: NUDGE_LABELS[type], shown, acted, ctr: shown ? Math.round((acted / shown) * 100) : 0 };
            }));
            setStatsLoading(false);
        };
        fetchStats();
    }, []);

    const handlePromptChange = (id: string, newText: string) => {
        setPrompts((current) =>
            current.map((p) => (p.id === id ? { ...p, prompt_text: newText } : p))
        );
    };

    const handleSave = async (prompt: SystemPrompt) => {
        setSavingId(prompt.id);
        const { error } = await supabase
            .from("system_prompts")
            .update({ prompt_text: prompt.prompt_text, updated_at: new Date().toISOString() })
            .eq("id", prompt.id);

        if (error) {
            console.error("Error updating prompt:", error);
            toast.error("Error al guardar el prompt.");
        } else {
            toast.success("Prompt maestro actualizado correctamente.");
        }
        setSavingId(null);
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
                <div className="container flex items-center gap-3 py-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold font-display flex items-center gap-2">
                            <Brain className="w-5 h-5 text-primary" />
                            Cadenas de Inteligencia Artificial
                        </h1>
                    </div>
                </div>
            </header>

            <main className="container py-8 max-w-4xl mx-auto space-y-8">

                {/* Phase 18 Analytics */}
                <div className="p-6 rounded-2xl bg-card border shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold">Métricas Phase 18 — IA Proactiva</h2>
                    </div>

                    {statsLoading ? (
                        <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Coach Sessions */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-1.5 text-sm font-semibold">
                                    <Bot className="w-4 h-4 text-primary" /> Sesiones de Coach AI
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Total sesiones', value: coachStats?.total ?? 0 },
                                        { label: 'Completadas (5/5)', value: coachStats?.completed ?? 0 },
                                        { label: 'Tasa completación', value: `${coachStats?.completionRate ?? 0}%` },
                                        { label: 'Intercambios promedio', value: coachStats?.avgExchanges ?? 0 },
                                    ].map(stat => (
                                        <div key={stat.label} className="bg-muted/40 rounded-xl p-3">
                                            <p className="text-2xl font-bold text-primary">{stat.value}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>
                                {coachStats?.topMood && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">Estado dominante:</span>
                                        <span className="font-semibold capitalize text-amber-600">{coachStats.topMood}</span>
                                    </div>
                                )}
                                <div className="text-xs text-muted-foreground border-t pt-2">
                                    {(coachStats?.completionRate ?? 0) < 30 && '⚠️ Tasa baja → acortar a 3 intercambios'}
                                    {(coachStats?.completionRate ?? 0) >= 50 && '✅ Buena adherencia'}
                                </div>
                            </div>

                            {/* Nudge Effectiveness */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-1.5 text-sm font-semibold">
                                    <Bell className="w-4 h-4 text-amber-500" /> Eficacia de Nudges
                                </div>
                                <div className="space-y-2">
                                    {nudgeStats.map(stat => (
                                        <div key={stat.type} className="bg-muted/40 rounded-xl p-3">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-medium">{stat.type}</span>
                                                <span className="text-sm font-bold text-primary">{stat.ctr}% CTR</span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${stat.ctr}%` }} />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{stat.acted}/{stat.shown} actuaron</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-xs text-muted-foreground border-t pt-2">
                                    {nudgeStats.some(n => n.ctr < 10) && '⚠️ CTR bajo → revisar copy del nudge'}
                                    {nudgeStats.every(n => n.ctr >= 15) && '✅ Nudges efectivos'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold font-display">Prompts Maestros</h2>
                    <p className="text-muted-foreground">
                        Desde aquí configuras las directrices psicológicas ("System Prompts") que moldean la personalidad de tu bot.
                        Las Edge Functions leerán estos valores en tiempo real.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {prompts.map((prompt) => (
                            <div key={prompt.id} className="p-6 rounded-2xl bg-card border shadow-sm space-y-4">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-lg">{prompt.key_name}</h3>
                                        <Button
                                            size="sm"
                                            onClick={() => handleSave(prompt)}
                                            disabled={savingId === prompt.id}
                                            className="gap-2"
                                        >
                                            {savingId === prompt.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Guardar Cadena
                                        </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{prompt.description}</p>
                                </div>

                                <Textarea
                                    value={prompt.prompt_text}
                                    onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                                    className="min-h-[150px] font-mono text-xs bg-secondary/50 focus-visible:ring-primary"
                                    placeholder="Escribe las instrucciones crudas (Ej: Eres un analista de sombras...)"
                                />
                            </div>
                        ))}

                        {prompts.length === 0 && (
                            <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground">
                                <p>No se encontraron Prompts en la base de datos.</p>
                                <p className="text-sm mt-2">Asegúrate de haber ejecutado el script SQL semilla.</p>
                            </div>
                        )}

                        <div className="mt-12 p-6 rounded-2xl bg-primary/5 border border-primary/20 shadow-sm space-y-4">
                            <div className="flex items-center gap-2">
                                <Brain className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold text-lg">Gestión de API Keys (LLMs)</h3>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Por seguridad arquitectónica (Evitar filtraciones en la Base de Datos pública), las llaves de Inteligencia Artificial
                                (<strong className="text-foreground">OPENAI_API_KEY</strong>, <strong className="text-foreground">GEMINI_API_KEY</strong>)
                                no se guardan en tablas. Deben ser inyectadas directamente a la Bóveda del Servidor (Supabase Vault).
                            </p>
                            <div className="bg-background/50 p-4 rounded-lg font-mono text-xs text-muted-foreground border">
                                <div>1. Entra a tu Dashboard de Supabase &gt; Project Settings &gt; Edge Functions &gt; Secrets</div>
                                <div className="mt-2">2. Haz clic en "Add new secret" y agrega tus llaves oficiales.</div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminAI;
