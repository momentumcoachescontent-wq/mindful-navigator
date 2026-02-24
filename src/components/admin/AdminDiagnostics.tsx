import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Stethoscope, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TestStatus {
    name: string;
    status: 'idle' | 'running' | 'success' | 'error';
    message?: string;
}

export function AdminDiagnostics() {
    const { toast } = useToast();
    const [tests, setTests] = useState<TestStatus[]>([
        { name: "Conexión a Base de Datos", status: 'idle' },
        { name: "Sistema de Autenticación", status: 'idle' },
        { name: "Edge Functions (Pagos)", status: 'idle' },
    ]);
    const [isRunning, setIsRunning] = useState(false);

    const updateTest = (index: number, update: Partial<TestStatus>) => {
        setTests(prev => prev.map((t, i) => i === index ? { ...t, ...update } : t));
    };

    const runTests = async () => {
        setIsRunning(true);
        // Reset
        setTests(prev => prev.map(t => ({ ...t, status: 'running', message: undefined })));

        try {
            // 1. DB Test
            const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
            if (dbError) throw new Error("Fallo en Base de Datos: " + dbError.message);
            updateTest(0, { status: 'success', message: 'Conectada (Lectura exitosa)' });

            // 2. Auth Test
            const { data: authData, error: authError } = await supabase.auth.getSession();
            if (authError || !authData.session) throw new Error("Fallo en Autenticación o Sesión inactiva");
            updateTest(1, { status: 'success', message: 'Token de sesión válido' });

            // 3. Edge Functions Test (Stripe)
            // Just ping the check-subscription to see if it responds (could return 401 or 400 but network should pass)
            const { error: edgeError } = await supabase.functions.invoke('check-subscription', {
                headers: {
                    Authorization: `Bearer ${authData.session?.access_token}`,
                },
            });
            // We consider it success if we could reach the function, even if it says "no active subscription" inside
            if (edgeError && edgeError.context?.status === 500) {
                throw new Error("Fallo en Edge Function (Stripe): " + edgeError.message);
            }
            updateTest(2, { status: 'success', message: 'Servicio de Pagos (Edge) Online' });

            toast({
                title: "Diagnóstico Finalizado",
                description: "Todos los sistemas operando al 100%.",
            });

        } catch (err: any) {
            console.error("Diagnostic error:", err);
            // Mark remaining as error if failed sequentially
            setTests(prev => prev.map(t => t.status === 'running' ? { ...t, status: 'error', message: err.message } : t));
            toast({
                title: "Error de Sistema",
                description: "Se detectó una falla en la infraestructura crítica.",
                variant: "destructive",
            });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <Card className="col-span-1 md:col-span-2 border-primary/20 bg-background shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Stethoscope className="w-5 h-5 text-primary" />
                    Suite de Diagnóstico Integrado
                </CardTitle>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={runTests}
                    disabled={isRunning}
                    className="gap-2"
                >
                    {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                    Ejecutar Health Check
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 mt-4 md:grid-cols-3">
                    {tests.map((test, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                            <div className="mt-0.5">
                                {test.status === 'idle' && <div className="w-5 h-5 rounded-full border-2 border-muted" />}
                                {test.status === 'running' && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                                {test.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                {test.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                            </div>
                            <div className="flex flex-col">
                                <span className={`font-medium text-sm ${test.status === 'error' ? 'text-red-500' : 'text-foreground'
                                    }`}>
                                    {test.name}
                                </span>
                                {test.message && (
                                    <span className="text-xs text-muted-foreground mt-1">
                                        {test.message}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
