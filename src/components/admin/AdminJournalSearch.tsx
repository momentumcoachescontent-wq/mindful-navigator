import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2, Database } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SearchResult {
    entry_id: string;
    user_id: string;
    display_name: string;
    email: string;
    content: string;
    created_at: string;
}

export const AdminJournalSearch = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm || searchTerm.trim().length < 3) return;

        setIsLoading(true);
        setHasSearched(true);

        try {
            // @ts-ignore
            const { data, error } = await supabase.rpc("get_admin_journal_search" as any, {
                search_term: searchTerm.trim(),
                days_back: 60
            });

            if (error) throw error;
            setResults((data as unknown as SearchResult[]) || []);
        } catch (error) {
            console.error("Error searching journals:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to highlight the search term in the content
    const highlightContent = (content: string, term: string) => {
        if (!term) return content;
        const parts = content.split(new RegExp(`(${term})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === term.toLowerCase()
                ? <span key={i} className="bg-warning/30 text-warning font-bold px-1 rounded">{part}</span>
                : part
        );
    };

    return (
        <Card className="col-span-full border-primary/20 bg-background/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-display">
                    <Database className="w-5 h-5 text-primary" />
                    Buscador de Diarios Comunitarios
                </CardTitle>
                <CardDescription>
                    Motor de búsqueda en texto completo para investigar temas específicos, crisis o patrones conductuales en los últimos 60 días.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por palabra clave (ej. 'terapia', 'medicamento', 'divorcio'). Mínimo 3 letras."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 bg-secondary/5 border-secondary/20"
                        />
                    </div>
                    <Button type="submit" disabled={isLoading || searchTerm.trim().length < 3} className="h-10 px-8">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Minar Datos"}
                    </Button>
                </form>

                {/* Results Container */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : hasSearched && results.length === 0 ? (
                    <div className="text-center py-8 space-y-3 bg-secondary/5 rounded-xl border border-secondary/10">
                        <Search className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">No se encontraron diarios que contengan "{searchTerm}".</p>
                    </div>
                ) : results.length > 0 ? (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="text-sm text-primary font-medium sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                            Se encontraron {results.length} coincidencias
                        </div>
                        {results.map((entry) => {
                            const count = (entry.content.match(new RegExp(searchTerm, 'gi')) || []).length;
                            return (
                                <div key={entry.entry_id} className="p-4 rounded-xl border bg-card/50 hover:bg-card/80 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold">{entry.display_name}</span>
                                                <span className="text-sm text-muted-foreground">{entry.email}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {format(new Date(entry.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                                            </div>
                                        </div>
                                        <div className="flex bg-primary/10 border border-primary/20 text-primary text-sm px-3 py-1.5 rounded-md items-center font-bold">
                                            <span className="mr-1">{count}</span> {count === 1 ? 'coincidencia' : 'coincidencias'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : null}

            </CardContent>
        </Card>
    );
};
