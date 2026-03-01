import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, BookOpen, Headphones, Wrench, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Recommendation {
    type: 'meditation' | 'tool' | 'journal';
    title: string;
    subtitle: string;
    route: string;
    icon: typeof Headphones;
    accent: string;
}

export function ContextualRecommendations() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Fetch recent journal categories + tools used
    const { data: journalData } = useQuery({
        queryKey: ['journal-categories', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data } = await supabase
                .from('journal_entries')
                .select('category, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);
            return data || [];
        },
        enabled: !!user,
    });

    const { data: toolsUsed } = useQuery({
        queryKey: ['tools-used', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data } = await supabase
                .from('daily_missions')
                .select('mission_type, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);
            return data || [];
        },
        enabled: !!user,
    });

    // Determine dominant category / theme from journal
    const categoryCounts: Record<string, number> = {};
    (journalData || []).forEach(e => {
        if (e.category) {
            categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
        }
    });
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    // Map category to recommendation
    const CATEGORY_MAP: Record<string, Recommendation> = {
        limites: {
            type: 'meditation',
            title: 'Meditación de Límites Personales',
            subtitle: 'Basado en tus entradas recientes sobre límites',
            route: '/meditations',
            icon: Headphones,
            accent: 'text-purple-600 bg-purple-500/10',
        },
        miedo: {
            type: 'tool',
            title: 'Scanner de Sombras',
            subtitle: 'Transforma el miedo que aparece en tu diario',
            route: '/tools/scanner',
            icon: Wrench,
            accent: 'text-coral bg-coral/10',
        },
        relaciones: {
            type: 'tool',
            title: 'Simulador de Conversación',
            subtitle: 'Practica lo que quieres decir antes de decirlo',
            route: '/tools/conversation-simulator',
            icon: Wrench,
            accent: 'text-blue-600 bg-blue-500/10',
        },
        ansiedad: {
            type: 'meditation',
            title: 'Respiración 4-7-8',
            subtitle: 'Regula tu sistema nervioso ahora',
            route: '/meditations',
            icon: Headphones,
            accent: 'text-green-600 bg-green-500/10',
        },
    };

    // Default recommendation if no pattern detected
    const DEFAULT_REC: Recommendation = {
        type: 'journal',
        title: 'Escribe en tu diario hoy',
        subtitle: 'El autoconocimiento es el primer paso',
        route: '/journal',
        icon: BookOpen,
        accent: 'text-primary bg-primary/10',
    };

    const recommendations: Recommendation[] = [];

    if (topCategory && CATEGORY_MAP[topCategory]) {
        recommendations.push(CATEGORY_MAP[topCategory]);
    } else {
        recommendations.push(DEFAULT_REC);
    }

    // Always suggest something different from what was just used
    const lastTool = toolsUsed?.[0]?.mission_type;
    if (lastTool !== 'scanner' && recommendations.length < 2) {
        recommendations.push(CATEGORY_MAP['miedo']);
    }

    if (recommendations.length === 0) return null;

    return (
        <Card className="border-primary/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Para ti hoy
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {recommendations.map((rec, i) => (
                    <button
                        key={i}
                        onClick={() => navigate(rec.route)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-all text-left group"
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${rec.accent}`}>
                            <rec.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{rec.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{rec.subtitle}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </button>
                ))}
            </CardContent>
        </Card>
    );
}
