import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquareQuote, Loader2 } from "lucide-react";

interface SemanticWord {
    word: string;
    frequency: number;
}

export const AdminSemanticCloud = () => {
    const [words, setWords] = useState<SemanticWord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCloud = async () => {
            try {
                // @ts-ignore: RPC not yet in generated types
                const { data, error } = await supabase.rpc("get_admin_semantic_cloud" as any, { days_back: 30 });
                if (error) throw error;
                setWords((data as SemanticWord[]) || []);
            } catch (error) {
                console.error("Error fetching semantic cloud:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCloud();
    }, []);

    return (
        <Card className="col-span-full border-primary/20 bg-background/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-display">
                    <MessageSquareQuote className="w-5 h-5 text-turquoise" />
                    Data Mining: Nube Semántica (Diario Comunitario)
                </CardTitle>
                <CardDescription>
                    Palabras y sentimientos más recurrentes extraídos de los diarios de los usuarios en los últimos 30 días.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : words.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No hay registros suficientes en los diarios.</p>
                ) : (
                    <div className="flex flex-wrap gap-3 items-center justify-center p-4 bg-secondary/5 rounded-xl border border-secondary/10">
                        {words.map((item, i) => {
                            const maxFreq = words[0]?.frequency || 1;
                            const ratio = item.frequency / maxFreq;

                            let sizeClass = "text-xs";
                            let colorClass = "text-muted-foreground";

                            if (ratio > 0.8) {
                                sizeClass = "text-3xl font-black";
                                colorClass = "text-primary drop-shadow-md";
                            } else if (ratio > 0.6) {
                                sizeClass = "text-2xl font-bold";
                                colorClass = "text-turquoise";
                            } else if (ratio > 0.4) {
                                sizeClass = "text-xl font-semibold";
                                colorClass = "text-foreground";
                            } else if (ratio > 0.2) {
                                sizeClass = "text-base font-medium";
                                colorClass = "text-foreground/80";
                            }

                            return (
                                <span
                                    key={i}
                                    className={`inline-block transition-all hover:scale-110 cursor-help ${sizeClass} ${colorClass}`}
                                    title={`${item.frequency} menciones totales`}
                                >
                                    {item.word}
                                </span>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
