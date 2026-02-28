import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HomeReflectionProps {
    content: string | undefined;
    author: string | null | undefined;
    isRefreshing: boolean;
    onRefresh: () => void;
}

export function HomeReflection({ content, author, isRefreshing, onRefresh }: HomeReflectionProps) {
    return (
        <section className="bg-gradient-to-br from-secondary to-primary rounded-2xl p-5 text-primary-foreground">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs uppercase tracking-wider opacity-70">Reflexión del día</p>
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={isRefreshing}
                    className="h-6 w-6 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
                    onClick={onRefresh}
                >
                    <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
                    <span className="sr-only">Nueva reflexión</span>
                </Button>
            </div>
            <p className="font-display text-lg leading-relaxed">
                "{content || "Cargando reflexión..."}"
            </p>
            {author && (
                <p className="text-sm text-right mt-2 opacity-80">— {author}</p>
            )}
        </section>
    );
}
