import { useState, useEffect } from "react";
import { ArrowLeft, Save, Loader2, Brain } from "lucide-react";
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

const AdminAI = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);

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
