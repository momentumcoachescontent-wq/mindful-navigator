import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
    role: 'user' | 'coach';
    content: string;
}

// Moods the AI classifies before recommending content
const MOOD_STATES = ['tranquilo', 'ansioso', 'triste', 'frustrado', 'motivado', 'agotado'] as const;
type MoodState = typeof MOOD_STATES[number];

const MOOD_COLORS: Record<MoodState, string> = {
    tranquilo: 'bg-green-500/10 text-green-700 border-green-500/30',
    ansioso: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    triste: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
    frustrado: 'bg-red-500/10 text-red-700 border-red-500/30',
    motivado: 'bg-purple-500/10 text-purple-700 border-purple-500/30',
    agotado: 'bg-slate-500/10 text-slate-700 border-slate-500/30',
};

const OPENING_QUESTIONS = [
    '¿Cómo llegas hoy?',
    '¿Qué está ocupando tu mente en este momento?',
    '¿Hay algo que quieras soltar antes de empezar?',
];

export function CoachAIChat({ onRecommendation }: { onRecommendation?: (type: string, id?: string) => void }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [detectedMood, setDetectedMood] = useState<MoodState | null>(null);
    const [exchangeCount, setExchangeCount] = useState(0);
    const [showQuickReplies, setShowQuickReplies] = useState(true);
    const [actionRecommended, setActionRecommended] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Save session to DB
    async function saveSession(completed: boolean, finalMood: MoodState | null, exchanges: number, action: string | null) {
        if (!user) return;
        try {
            await supabase.from('coach_sessions').insert([{
                user_id: user.id,
                mood_detected: finalMood,
                exchanges_count: exchanges,
                action_recommended: action,
                completed,
            }] as never);
        } catch { /* silent fail — tracking is non-critical */ }
    }

    // Opening question (rotates daily)
    const openingQ = OPENING_QUESTIONS[new Date().getDay() % OPENING_QUESTIONS.length];

    // Recent journal sentiment for context
    const { data: recentJournal } = useQuery({
        queryKey: ['recent-journal-sentiment', user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data } = await supabase
                .from('journal_entries')
                .select('content, category, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(3);
            return data || [];
        },
        enabled: !!user,
    });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const QUICK_REPLIES = [
        'Bien, con energía 💪',
        'Regular, algo me preocupa',
        'Agotado/a, necesito calma',
        'Ansioso/a, mucha presión',
    ];

    async function sendMessage(text: string) {
        if (!text.trim() || loading) return;
        setShowQuickReplies(false);

        const userMsg: Message = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const journalContext = recentJournal?.map(e => e.content).join(' | ') || '';
            const history = messages.map(m => `${m.role === 'user' ? 'Usuario' : 'Coach'}: ${m.content}`).join('\n');

            const systemPrompt = `Eres un Coach de Psicología Aplicada del método MADM (Más Allá del Miedo). 
Tu rol es hacer coaching conversacional breve (máximo 5 intercambios).
Fase actual: ${exchangeCount === 0 ? 'RECEPCIÓN — escucha activa, valida emoción' : exchangeCount <= 2 ? 'EXPLORACIÓN — pregunta una cosa concreta' : 'RECOMENDACIÓN — sugiere 1 herramienta o meditación específica del método MADM'}.
Contexto del diario reciente del usuario: "${journalContext}".
Conversación previa: ${history || 'ninguna'}.
Detecta el estado emocional: ${MOOD_STATES.join(', ')}.
Al final de tu respuesta, si detectas el estado emocional, añade exactamente: [MOOD:estado]
Si recomiendas una acción concreta, añade: [ACCIÓN:meditación|herramienta|diario]
Sé breve (2-3 oraciones), empático y directo. Habla en español informal.`;

            const { data, error } = await supabase.functions.invoke('analyze-situation', {
                body: {
                    situation: text,
                    context: systemPrompt,
                    mode: 'coach',
                },
            });

            if (error) throw error;

            const rawResponse: string = data?.analysis || data?.response || data?.text || 'Gracias por compartir. ¿Qué más está pasando?';

            // Parse mood and action tags
            const moodMatch = rawResponse.match(/\[MOOD:(\w+)\]/);
            const actionMatch = rawResponse.match(/\[ACCIÓN:(\w+)\]/);
            const cleanResponse = rawResponse.replace(/\[MOOD:\w+\]/g, '').replace(/\[ACCIÓN:\w+\]/g, '').trim();

            if (moodMatch && MOOD_STATES.includes(moodMatch[1] as MoodState)) {
                setDetectedMood(moodMatch[1] as MoodState);
            }

            if (actionMatch && onRecommendation) {
                onRecommendation(actionMatch[1]);
                setActionRecommended(actionMatch[1]);
            }

            const newCount = exchangeCount + 1;
            setMessages(prev => [...prev, { role: 'coach', content: cleanResponse }]);
            setExchangeCount(prev => prev + 1);

            // Auto-save when reaching 5 exchanges (session complete)
            if (newCount >= 5) {
                saveSession(true, moodMatch?.[1] as MoodState || detectedMood, newCount, actionMatch?.[1] || actionRecommended);
            }

        } catch {
            setMessages(prev => [...prev, {
                role: 'coach',
                content: 'Estoy aquí contigo. ¿Puedes contarme un poco más sobre cómo te sientes?'
            }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="border-primary/20 overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    Coach MADM
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {detectedMood && (
                        <Badge className={cn('text-xs capitalize ml-auto', MOOD_COLORS[detectedMood])}>
                            {detectedMood}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
                {/* Messages */}
                <div className="max-h-72 overflow-y-auto p-4 space-y-3">
                    {/* Opening question */}
                    <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <div className="bg-muted/50 rounded-xl rounded-tl-none px-3 py-2 text-sm max-w-[85%]">
                            {openingQ}
                        </div>
                    </div>

                    {messages.map((msg, i) => (
                        <div key={i} className={cn('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}>
                            {msg.role === 'coach' && (
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-primary" />
                                </div>
                            )}
                            <div className={cn(
                                'rounded-xl px-3 py-2 text-sm max-w-[85%]',
                                msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-muted/50 rounded-tl-none'
                            )}>
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            </div>
                            <div className="bg-muted/50 rounded-xl rounded-tl-none px-3 py-2 text-sm text-muted-foreground">
                                Procesando...
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Quick replies (only at start) */}
                {showQuickReplies && messages.length === 0 && (
                    <div className="px-4 pb-2 flex flex-wrap gap-2">
                        {QUICK_REPLIES.map(qr => (
                            <button
                                key={qr}
                                onClick={() => sendMessage(qr)}
                                className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
                            >
                                {qr}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                {exchangeCount < 5 && (
                    <div className="flex gap-2 p-3 border-t">
                        <Textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Escribe cómo te sientes..."
                            className="resize-none text-sm min-h-[40px] max-h-24"
                            rows={1}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage(input);
                                }
                            }}
                        />
                        <Button
                            size="icon"
                            onClick={() => sendMessage(input)}
                            disabled={loading || !input.trim()}
                            className="shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {exchangeCount >= 5 && (
                    <div className="p-3 border-t text-center">
                        <p className="text-xs text-muted-foreground mb-2">Sesión completada · Sigue con tu práctica</p>
                        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => {
                            // Save incomplete session before reset
                            if (exchangeCount < 5) {
                                saveSession(false, detectedMood, exchangeCount, actionRecommended);
                            }
                            setMessages([]);
                            setExchangeCount(0);
                            setDetectedMood(null);
                            setActionRecommended(null);
                            setShowQuickReplies(true);
                        }}>
                            Nueva sesión <ChevronRight className="w-3 h-3" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
