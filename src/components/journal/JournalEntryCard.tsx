import { Calendar, Trophy, Trash2 } from "lucide-react";
import { type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

interface JournalEntry {
    id: string;
    created_at: string;
    content: string | null;
    entry_type: string | null;
    tags: string[] | null;
    mood_score: number | null;
    energy_score: number | null;
    stress_score: number | null;
}

interface JournalEntryCardProps {
    entry: JournalEntry;
    getTitle: (entry: JournalEntry) => string;
    getPreview: (entry: JournalEntry) => string;
    onDelete: (e: React.MouseEvent, id: string) => void;
}

export function JournalEntryCard({ entry, getTitle, getPreview, onDelete }: JournalEntryCardProps) {
    const navigate = useNavigate();

    return (
        <div
            className="group relative w-full h-full bg-card rounded-2xl p-4 shadow-soft text-left transition-all hover:shadow-medium cursor-pointer"
            onClick={() => navigate(`/journal/${entry.id}`)}
        >
            <div className="flex items-start gap-3">
                {entry.entry_type === "victory" && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral to-coral-light flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-5 h-5 text-white" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                            {new Date(entry.created_at).toLocaleDateString("es", {
                                day: "numeric",
                                month: "short",
                            })}
                        </span>
                    </div>
                    <h4 className="font-display font-semibold text-foreground truncate">
                        {getTitle(entry)}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                        {getPreview(entry)}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-8 w-8"
                    onClick={(e) => onDelete(e, entry.id)}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
