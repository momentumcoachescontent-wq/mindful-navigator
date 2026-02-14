import { useState, useEffect } from "react";
import { ArrowLeft, PenLine, Plus, Calendar, Tag, Trophy, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { SOSButton } from "@/components/layout/SOSButton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const tagConfig = [
  { id: "family", label: "Familia", color: "bg-coral/20 text-coral" },
  { id: "work", label: "Trabajo", color: "bg-turquoise/20 text-turquoise" },
  { id: "relationships", label: "Pareja", color: "bg-destructive/20 text-destructive" },
  { id: "friends", label: "Amigos", color: "bg-warning/20 text-warning" },
  { id: "self", label: "Personal", color: "bg-primary/20 text-primary" },
];

const tabs = [
  { id: "entries", label: "Entradas" },
  { id: "victories", label: "Victorias" },
  { id: "pending", label: "Pendientes" },
];



interface JournalEntry {
  id: string;
  created_at: string;
  content: string | null;
  entry_type: string | null;
  mood_score: number | null;
  energy_score: number | null;
  stress_score: number | null;
}

const Journal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("entries");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchEntries = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("journal_entries")
        .select("id, created_at, content, entry_type, mood_score, energy_score, stress_score")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching entries:", error);
      } else {
        setEntries((data as JournalEntry[]) || []);
      }
      setIsLoading(false);
    };

    fetchEntries();
  }, [user]);

  const filteredEntries = entries.filter((entry) => {
    // Always show simulation results
    if (entry.entry_type === "simulation_result") return true;

    // Filter by entry type
    if (activeTab === "victories" && entry.entry_type !== "victory") return false;
    if (activeTab === "pending") return false; // No pending support without metadata

    // Filter out empty entries for other types
    if (!entry.content) return false;

    // Check if content is string before calling trim()
    if (typeof entry.content === 'string' && entry.content.trim().length === 0) return false;

    return true;
  });

  const getTitle = (entry: JournalEntry) => {
    // Handle simulation results
    if (entry.entry_type === "simulation_result") {
      try {
        const content = typeof entry.content === 'string' ? JSON.parse(entry.content) : entry.content;
        if (content.scenario) {
          return `🎭 Simulación: ${content.scenario}`;
        }
      } catch (e) {
        // If parsing fails, check if it's a text format
        if (typeof entry.content === 'string' && entry.content.includes('Simulación:')) {
          const match = entry.content.match(/🎭 Simulación: ([^\n]+)/);
          if (match) return match[0];
        }
      }
      return "🎭 Simulación de Conversación";
    }

    // For other entry types, use entry_type as title
    return entry.entry_type === "victory" ? "🏆 Victoria" : "📝 Entrada de Diario";
  };

  const getPreview = (entry: JournalEntry) => {
    // Handle simulation results
    if (entry.entry_type === "simulation_result") {
      try {
        const content = typeof entry.content === 'string' ? JSON.parse(entry.content) : entry.content;
        if (content.feedback) {
          return content.feedback.substring(0, 80) + "...";
        }
        if (content.evaluation) {
          return `Claridad: ${content.evaluation.clarity}/10 • Firmeza: ${content.evaluation.firmness}/10 • Empatía: ${content.evaluation.empathy}/10`;
        }
      } catch (e) {
        // If parsing fails, try to extract from text format
        if (typeof entry.content === 'string') {
          const feedbackMatch = entry.content.match(/💬 Feedback: ([^\n]+)/);
          if (feedbackMatch) {
            return feedbackMatch[1].substring(0, 80) + "...";
          }
        }
      }
      return "Ver detalles de la simulación";
    }

    if (!entry.content) return "Sin contenido";
    return entry.content.length > 80
      ? entry.content.substring(0, 80) + "..."
      : entry.content;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container flex items-center gap-4 py-4">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-display font-bold text-foreground">Tu Diario, Tu Historia, Tu Crecimiento</h1>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => navigate("/journal/new")}>
            <PenLine className="w-6 h-6 text-primary" />
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <div className="flex bg-muted rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
              )}
            >
              {tab.id === "victories" && <Trophy className="w-4 h-4 inline mr-1.5 -mt-0.5" />}
              {tab.id === "pending" && <span className="mr-1.5 text-lg leading-none">⏳</span>}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1.5 px-1.5">
          <button
            onClick={() => setSelectedTag(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1",
              !selectedTag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            <Tag className="w-3 h-3" />
            Todas
          </button>
          {tagConfig.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                selectedTag === tag.id ? "bg-primary text-primary-foreground" : tag.color
              )}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!user && !isLoading && (
          <div className="text-center py-12 space-y-4">
            <p className="text-muted-foreground">Inicia sesión para ver tu diario</p>
            <Button onClick={() => navigate("/auth")}>Iniciar sesión</Button>
          </div>
        )}

        {user && !isLoading && (
          <div className="space-y-3">
            {filteredEntries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => navigate(`/journal/${entry.id}`)}
                className="w-full bg-card rounded-2xl p-4 shadow-soft text-left transition-all hover:shadow-medium"
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
                        {new Date(entry.created_at).toLocaleDateString("es", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <h4 className="font-display font-semibold text-foreground truncate">{getTitle(entry)}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{getPreview(entry)}</p>
                    {/* Tags removed - column doesn't exist */}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {user && !isLoading && filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {activeTab === "victories" ? "Aún no has registrado victorias" : "No hay entradas aún"}
            </p>
          </div>
        )}
      </main>

      {user && (
        <Button
          variant="calm"
          size="icon-lg"
          className="fixed bottom-24 right-4 z-40 rounded-full shadow-glow-turquoise"
          onClick={() => navigate("/journal/new")}
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      <MobileNav />
      <SOSButton />
    </div>
  );
};

export default Journal;
