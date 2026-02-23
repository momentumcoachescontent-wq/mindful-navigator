import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, ShieldAlert, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface RiskEntry {
    entry_id: string;
    user_id: string;
    display_name: string;
    email: string;
    content: string;
    risk_level: 'Alto' | 'Medio';
    matched_keywords: string;
    created_at: string;
}

export const AdminRiskRadar = () => {
    const [entries, setEntries] = useState<RiskEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRiskRadar = async () => {
            try {
                // @ts-ignore
                const { data, error } = await supabase.rpc("get_admin_risk_radar", { days_back: 15 });
                if (error) throw error;
                setEntries((data as RiskEntry[]) || []);
            } catch (error) {
                console.error("Error fetching risk radar:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRiskRadar();
    }, []);

    return (
        <Card className="col-span-full border-destructive/20 bg-destructive/5 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-display text-destructive">
                    <ShieldAlert className="w-5 h-5" />
                    Radar de Riesgo (Últimos 15 días)
                </CardTitle>
                <CardDescription>
                    Identificación algorítmica de usuarios vulnerables en base a palabras clave críticas registradas en su diario (Depresión, ideación suicida, crisis).
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-destructive" />
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-8 space-y-3">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 text-success">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <p className="text-muted-foreground">Sistema limpio. No se detectaron patrones de riesgo inminente.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {entries.map((entry) => (
                            <div
                                key={entry.entry_id}
                                className={`p-4 rounded-xl border ${entry.risk_level === 'Alto'
                                        ? 'bg-destructive/10 border-destructive/30'
                                        : 'bg-warning/10 border-warning/30'
                                    }`}
                            >
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${entry.risk_level === 'Alto' ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-warning-foreground'
                                                }`}>
                                                Riesgo {entry.risk_level}
                                            </span>
                                            <span className="font-semibold">{entry.display_name}</span>
                                            <span className="text-sm text-muted-foreground">{entry.email}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {format(new Date(entry.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                                        </div>
                                    </div>

                                    <div className="text-sm border border-destructive/20 bg-background/50 px-3 py-1.5 rounded-md flex-shrink-0">
                                        <span className="text-muted-foreground mr-2">Keywords:</span>
                                        <span className="font-medium text-destructive">{entry.matched_keywords}</span>
                                    </div>
                                </div>

                                <div className="text-sm text-foreground/80 italic border-l-2 border-primary/30 pl-3">
                                    "{entry.content.length > 200 ? entry.content.substring(0, 200) + '...' : entry.content}"
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
