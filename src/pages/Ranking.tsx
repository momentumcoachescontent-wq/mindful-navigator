import { ArrowLeft, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SOSButton } from "@/components/layout/SOSButton";
import { RankingTab } from "@/components/ranking/RankingTab";

const Ranking = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 glass border-b border-border/50">
                <div className="container flex items-center gap-4 py-4">
                    <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-lg font-display font-bold text-foreground">
                            Ranking Global
                        </h1>
                    </div>
                    <Trophy className="w-8 h-8 text-amber-500" />
                </div>
            </header>

            <main className="container py-6">
                <RankingTab />
            </main>

            <SOSButton />
        </div>
    );
};

export default Ranking;
