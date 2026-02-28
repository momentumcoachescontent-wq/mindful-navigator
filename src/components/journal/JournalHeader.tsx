import { ArrowLeft, PenLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function JournalHeader() {
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-40 glass border-b border-border/50">
            <div className="container flex items-center gap-4 py-4">
                <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-lg font-display font-bold text-foreground">
                        Tu Diario, Tu Historia, Tu Crecimiento
                    </h1>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => navigate("/journal/new")}>
                    <PenLine className="w-6 h-6 text-primary" />
                </Button>
            </div>
        </header>
    );
}
