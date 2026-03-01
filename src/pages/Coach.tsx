import { ArrowLeft, Bot, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CoachAIChat } from "@/components/coach/CoachAIChat";
import { ContextualRecommendations } from "@/components/coach/ContextualRecommendations";
import { SOSButton } from "@/components/layout/SOSButton";

export default function Coach() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="container flex items-center gap-3 py-4">
                    <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-primary" />
                        <h1 className="text-lg font-display font-bold text-foreground">
                            Coach MADM
                        </h1>
                        <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                </div>
            </header>

            <main className="container py-6 space-y-6 max-w-2xl mx-auto">
                {/* Intro */}
                <div className="text-center space-y-1">
                    <p className="text-sm text-primary font-medium italic">
                        "La transformación comienza con una conversación honesta."
                    </p>
                    <p className="text-xs text-muted-foreground">
                        3–5 intercambios · Totalmente privado · Basado en el método MADM
                    </p>
                </div>

                {/* Coach Chat */}
                <CoachAIChat />

                {/* Contextual Recommendations */}
                <ContextualRecommendations />
            </main>

            <SOSButton />
        </div>
    );
}
