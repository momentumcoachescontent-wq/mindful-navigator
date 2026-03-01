import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, CheckCircle2, Copy, BookMarked, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FollowUpTask {
    id: string;
    title: string;
    content: string;          // Ready-to-send message for the user/action
    audience: string;         // Who this is for
    triggerReason: string;    // Why this task was generated
    priority: 'alta' | 'media' | 'baja';
    userIds?: string[];       // Specific users if applicable
    saved?: boolean;
}

const PRIORITY_COLORS = {
    alta: 'bg-red-500/10 text-red-700 border-red-500/30',
    media: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    baja: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
};

export function AdminFollowUpTasks() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<FollowUpTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Load already saved tasks from journal_entries
    useEffect(() => {
        if (!user) return;
        loadSavedTasks();
    }, [user]);

    async function loadSavedTasks() {
        setLoading(true);
        const { data } = await supabase
            .from('journal_entries')
            .select('id, content, metadata, created_at')
            .eq('user_id', user!.id)
            .eq('entry_type', 'seguimiento')
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) {
            const loaded: FollowUpTask[] = data.map(e => ({
                id: e.id,
                title: (e.metadata as any)?.title || 'Tarea de Seguimiento',
                content: e.content || '',
                audience: (e.metadata as any)?.audience || 'General',
                triggerReason: (e.metadata as any)?.trigger || '',
                priority: (e.metadata as any)?.priority || 'media',
                saved: true,
            }));
            setTasks(loaded);
        }
        setLoading(false);
    }

    async function generateTasks() {
        setGenerating(true);
        const newTasks: Omit<FollowUpTask, 'id'>[] = [];

        try {
            // Fetch all metrics simultaneously
            const [sessionsRes, nudgesRes, inactiveRes, anxiousRes] = await Promise.all([
                // Coach sessions
                supabase.from('coach_sessions').select('completed, mood_detected, exchanges_count'),
                // Nudge CTR
                supabase.from('nudge_events').select('nudge_type, action_taken'),
                // Inactive users (no mission in 5+ days)
                supabase.from('profiles').select('user_id, display_name, streak_count').limit(100),
                // Users with anxiety mood in coach sessions
                supabase.from('coach_sessions').select('user_id, mood_detected').eq('mood_detected', 'ansioso'),
            ]);

            const sessions = sessionsRes.data || [];
            const nudges = nudgesRes.data || [];
            const profiles = inactiveRes.data || [];
            const anxiousSessions = anxiousRes.data || [];

            // TASK 1: Low Coach completion rate
            const completionRate = sessions.length > 0
                ? (sessions.filter(s => s.completed).length / sessions.length) * 100 : 0;

            if (sessions.length >= 3 && completionRate < 40) {
                const abandonedAt = Math.round(
                    sessions.filter(s => !s.completed).reduce((sum, s) => sum + (s.exchanges_count || 0), 0) /
                    Math.max(1, sessions.filter(s => !s.completed).length)
                );
                newTasks.push({
                    title: '💬 Coach AI: Sesiones incompletas',
                    content: `Hola equipo,\n\nDetectamos que el ${Math.round(completionRate)}% de las sesiones de Coach se completan. Los usuarios abandonan en promedio en el intercambio #${abandonedAt || 2}.\n\nAcción: Revisar y acortar el flujo del Coach de 5 a 3 intercambios. Prioridad inmediata.\n\nDatos: ${sessions.filter(s => !s.completed).length} sesiones abandonadas de ${sessions.length} totales.`,
                    audience: 'Equipo producto',
                    triggerReason: `Tasa de completación ${Math.round(completionRate)}% < 40%`,
                    priority: 'alta',
                });
            }

            // TASK 2: Low nudge CTR
            const inactivityNudges = nudges.filter(n => n.nudge_type === 'inactivity');
            const inactivityCTR = inactivityNudges.length > 0
                ? (inactivityNudges.filter(n => n.action_taken).length / inactivityNudges.length) * 100 : 0;

            if (inactivityNudges.length >= 5 && inactivityCTR < 15) {
                newTasks.push({
                    title: '🔔 Nudge inactividad: CTR bajo',
                    content: `Seguimiento de nudges — Inactividad\n\nEl mensaje actual "Han pasado X días sin practicar" tiene un CTR del ${Math.round(inactivityCTR)}% (${inactivityNudges.filter(n => n.action_taken).length} de ${inactivityNudges.length} usuarios respondieron).\n\nMensaje sugerido para probar:\n"[Nombre], tu espacio de crecimiento te espera. Solo 5 minutos hoy pueden cambiar tu semana."\n\nAcción: Actualizar el copy del nudge en useAdaptiveNudges.ts`,
                    audience: 'Desarrollo',
                    triggerReason: `CTR inactividad ${Math.round(inactivityCTR)}% < 15% (${inactivityNudges.length} muestras)`,
                    priority: 'media',
                });
            }

            // TASK 3: Dominant anxiety mood
            const anxiousUserIds: string[] = [...new Set(anxiousSessions.map(s => s.user_id as string))];
            if (anxiousUserIds.length >= 3) {
                const anxiousProfiles = profiles.filter(p => anxiousUserIds.includes(p.user_id));
                const names = anxiousProfiles.map(p => p.display_name || 'Usuario').slice(0, 5).join(', ');
                newTasks.push({
                    title: '😰 Usuarios con ansiedad recurrente',
                    content: `Seguimiento de bienestar — Mood "Ansioso" detectado\n\n${anxiousUserIds.length} usuarios han sido detectados con estado de ansiedad en sus sesiones de Coach (${anxiousSessions.length} sesiones totales).\n\nUsuarios: ${names}${anxiousUserIds.length > 5 ? ` y ${anxiousUserIds.length - 5} más` : ''}\n\nMensaje sugerido para enviar:\n"Hola [Nombre], hemos notado que últimamente llegas con carga emocional. Queremos que sepas que estamos aquí. ¿Te gustaría acceder a nuestro pack de meditaciones para ansiedad sin costo adicional?"\n\nAcción: Crear pack de meditaciones para ansiedad + enviar mensaje personalizado.`,
                    audience: `${anxiousUserIds.length} usuarios específicos`,
                    triggerReason: `${anxiousUserIds.length} usuarios con mood 'ansioso' en Coach AI`,
                    priority: 'alta',
                    userIds: anxiousUserIds,
                });
            }

            // TASK 4: High streak danger nudge
            const streakNudges = nudges.filter(n => n.nudge_type === 'streak_danger');
            if (streakNudges.length >= 5) {
                const streakCTR = Math.round((streakNudges.filter(n => n.action_taken).length / streakNudges.length) * 100);
                newTasks.push({
                    title: `🔥 ${streakNudges.length} usuarios con racha en peligro`,
                    content: `Seguimiento de retención — Rachas en riesgo\n\n${streakNudges.length} usuarios recibieron alerta de racha en peligro. CTR: ${streakCTR}%.\n\nMensaje sugerido para usuarios que NO actuaron:\n"[Nombre], tu racha de [N] días es un tesoro. No la pierdas hoy. Tienes hasta medianoche."\n\nAcción: ${streakCTR < 20 ? 'Urgente: revisar el mensaje del nudge de racha. CTR muy bajo.' : 'Revisar usuarios que perdieron su racha y ofrecer un "Streak Rescue" premium gratis.'}`,
                    audience: `${streakNudges.length} usuarios con racha en peligro`,
                    triggerReason: `${streakNudges.length} nudges de racha enviados, CTR ${streakCTR}%`,
                    priority: streakCTR < 15 ? 'alta' : 'media',
                });
            }

            if (newTasks.length === 0) {
                toast.info('No hay señales que requieran seguimiento en este momento. ✅');
                setGenerating(false);
                return;
            }

            // Show count
            toast.success(`${newTasks.length} tareas generadas. Guárdalas en tu diario.`);
            setTasks(prev => {
                const pendingWithIds = newTasks.map((t, i) => ({ ...t, id: `pending-${Date.now()}-${i}`, saved: false }));
                return [...pendingWithIds, ...prev.filter(t => t.saved)];
            });
        } catch {
            toast.error('Error al analizar métricas');
        }
        setGenerating(false);
    }

    async function saveTask(task: FollowUpTask) {
        if (!user) return;
        const { data, error } = await supabase.from('journal_entries').insert([{
            user_id: user.id,
            entry_type: 'seguimiento',
            content: task.content,
            metadata: {
                title: task.title,
                audience: task.audience,
                trigger: task.triggerReason,
                priority: task.priority,
                userIds: task.userIds || [],
                generatedAt: new Date().toISOString(),
            },
        }] as never).select('id').single();

        if (error) {
            toast.error('Error al guardar');
            return;
        }

        setTasks(prev => prev.map(t =>
            t.id === task.id ? { ...t, id: data.id, saved: true } : t
        ));
        toast.success('Tarea guardada en tu diario de seguimiento');
    }

    async function copyContent(content: string) {
        await navigator.clipboard.writeText(content);
        toast.success('Copiado al portapapeles');
    }

    if (loading) {
        return (
            <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header + Generate button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Tareas de Seguimiento</span>
                    {tasks.filter(t => !t.saved).length > 0 && (
                        <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs">
                            {tasks.filter(t => !t.saved).length} sin guardar
                        </Badge>
                    )}
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5"
                    onClick={generateTasks}
                    disabled={generating}
                >
                    {generating ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Analizando...</>
                    ) : (
                        <><RefreshCw className="w-3 h-3" /> Generar tareas</>
                    )}
                </Button>
            </div>

            {/* Empty state */}
            {tasks.length === 0 && !generating && (
                <div className="text-center py-8 border border-dashed rounded-xl text-muted-foreground space-y-2">
                    <ClipboardList className="w-8 h-8 mx-auto opacity-30" />
                    <p className="text-sm">Haz clic en "Generar tareas" para analizar las métricas actuales</p>
                    <p className="text-xs">Se crearán tareas listas para ejecutar según los datos de Coach AI y Nudges</p>
                </div>
            )}

            {/* Task cards */}
            <div className="space-y-3">
                {tasks.map(task => (
                    <div
                        key={task.id}
                        className={cn(
                            'p-4 rounded-xl border space-y-3 transition-all',
                            task.saved ? 'bg-muted/20 border-border/50' : 'bg-card border-primary/20 shadow-sm'
                        )}
                    >
                        {/* Task header */}
                        <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold">{task.title}</span>
                                    <Badge className={cn('text-xs capitalize', PRIORITY_COLORS[task.priority])}>
                                        {task.priority}
                                    </Badge>
                                    {task.saved && (
                                        <Badge className="text-xs bg-green-500/10 text-green-700 border-green-500/30 gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Guardado
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Para: <strong>{task.audience}</strong> · {task.triggerReason}
                                </p>
                            </div>
                        </div>

                        {/* Content preview */}
                        <div className="bg-muted/40 rounded-lg p-3">
                            <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">
                                {task.content}
                            </pre>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-xs gap-1 flex-1"
                                onClick={() => copyContent(task.content)}
                            >
                                <Copy className="w-3 h-3" /> Copiar mensaje
                            </Button>
                            {!task.saved && (
                                <Button
                                    size="sm"
                                    className="text-xs gap-1 flex-1"
                                    onClick={() => saveTask(task)}
                                >
                                    <BookMarked className="w-3 h-3" /> Guardar en diario
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
