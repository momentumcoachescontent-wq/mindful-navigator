import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Check, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { xpEventBus } from "@/lib/xpEventBus";

interface Challenge {
    id: string;
    title: string;
    description: string;
    xp_reward: number;
    tag: string;
}

interface ToolChallengeProps {
    challenge: Challenge;
}

export const ToolChallenge = ({ challenge }: ToolChallengeProps) => {
    const { user } = useAuth();
    const [response, setResponse] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const handleSubmit = async () => {
        if (!response.trim()) {
            toast({
                title: "Contrato vacío",
                description: "El miedo se combate con palabras claras. Escribe tu respuesta.",
                variant: "destructive",
            });
            return;
        }

        if (!user) {
            toast({
                title: "No autenticado",
                description: "Inicia sesión para reclamar tu recompensa.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Save directly to journal_entries
            const journalContent = {
                title: `Misión: ${challenge.title}`,
                text: response,
                tags: [challenge.tag, "Misión Cumplida"]
            };

            const { error: journalError } = await supabase.from('journal_entries').insert([{
                user_id: user.id,
                content: JSON.stringify(journalContent),
                entry_type: 'reflection',
                tags: [challenge.tag, 'Misión Cumplida']
            } as never]);

            if (journalError) throw journalError;

            // 2. Register in daily_missions for the Dashboard to show "+XP HOY"
            // Use a timestamp suffix to ensure the mission_id is unique per submission,
            // bypassing the UNIQUE(user_id, mission_id, mission_date) constraint.
            const uniqueMissionId = `${challenge.id}_${Date.now()}`;
            const { error: dailyMissionError } = await supabase.from('daily_missions').insert([{
                user_id: user.id,
                mission_type: 'tool_protocol',
                mission_id: uniqueMissionId,
                xp_earned: challenge.xp_reward,
                mission_date: today,
                metadata: { tool_tag: challenge.tag, original_challenge_id: challenge.id }
            } as never]);

            if (dailyMissionError) {
                console.error('Error inserting daily mission:', dailyMissionError);
            }

            // 3. Add XP bonus to total progress
            // First get current XP
            const { data: progressData } = await supabase
                .from('user_progress')
                .select('total_xp')
                .eq('user_id', user.id)
                .single();

            if (progressData) {
                const newXP = (progressData.total_xp || 0) + challenge.xp_reward;
                const { error: progressError } = await supabase
                    .from('user_progress')
                    .update({ total_xp: newXP } as never)
                    .eq('user_id', user.id);

                if (progressError) console.error('Error updating XP:', progressError);
            }

            // Visual Reward 
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#4ade80', '#2dd4bf', '#0f172a']
            });

            // Notify Dashboard to refresh XP
            xpEventBus.emit(challenge.xp_reward);

            setIsCompleted(true);
            toast({
                title: "¡Contrato Silenciado!",
                description: `Has asegurado ${challenge.xp_reward} XP. Tu registro está en el Diario.`,
            });

        } catch (error) {
            console.error('Error submitting challenge:', error);
            toast({
                title: "Error del Sistema",
                description: "No pudimos sellar el contrato en la base de datos.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isCompleted) {
        return (
            <div className="brutal-card bg-success/10 border-success/30 p-6 flex flex-col items-center justify-center space-y-3 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-2">
                    <Check className="w-8 h-8 text-success" />
                </div>
                <h3 className="font-display font-bold text-success text-xl">Misión Cumplida</h3>
                <p className="text-muted-foreground text-sm">
                    Has extraído a la luz lo que estaba en la penumbra. Continúa iterando.
                </p>
            </div>
        );
    }

    return (
        <div className="brutal-card bg-card border-turquoise/30 p-6 space-y-5 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                <div className="w-10 h-10 rounded-none bg-turquoise flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                    <ShieldAlert className="w-5 h-5 text-zinc-950" />
                </div>
                <div>
                    <h3 className="font-display font-bold text-lg text-turquoise flex items-center gap-2">
                        [CONTRATO] {challenge.title}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium mt-1">
                        <Sparkles className="w-3 h-3 text-primary" />
                        Recompensa: +{challenge.xp_reward} XP
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                    {challenge.description}
                </p>

                <Textarea
                    placeholder="Nombra el miedo, describe la táctica. Aquí estás a salvo..."
                    className="min-h-[120px] resize-none bg-background/50 border-input font-medium focus-visible:ring-turquoise/50 rounded-none shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                />

                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !response.trim()}
                    className="w-full brutal-btn bg-turquoise hover:bg-turquoise-light text-zinc-950"
                >
                    {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        "Sellar Contrato (Guardar en Diario)"
                    )}
                </Button>
            </div>
        </div>
    );
};
