import { useState, useEffect } from "react";
import { ArrowLeft, PenLine, Plus, Calendar, Tag, Trophy, Loader2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { SOSButton } from "@/components/layout/SOSButton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const tagConfig = [
  { id: "family", label: "Familia", color: "bg-coral/20 text-coral" },
  { id: "work", label: "Trabajo", color: "bg-turquoise/20 text-turquoise" },
  { id: "relationships", label: "Pareja", color: "bg-destructive/20 text-destructive" },
  { id: "friends", label: "Amigos", color: "bg-warning/20 text-warning" },
  { id: "self", label: "Personal", color: "bg-primary/20 text-primary" },
  { id: "Victoria", label: "Victoria", color: "bg-amber-500/20 text-amber-600" },
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
  tags: string[] | null;
  mood_score: number | null;
  energy_score: number | null;
  stress_score: number | null;
}

const Journal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
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
    // Filter out empty entries first
    if (!entry.content) return false;
    if (typeof entry.content === 'string' && entry.content.trim().length === 0) return false;

    // Always show simulation results in "entries" tab only
    if (entry.entry_type === "simulation_result") {
      return activeTab === "entries";
    }

    // Filter by entry type for victories
    if (activeTab === "victories" && entry.entry_type !== "victory") return false;

    // Parse JSON content to access tags and follow_up
    let contentData: any = null;
    try {
      contentData = typeof entry.content === 'string' ? JSON.parse(entry.content) : entry.content;
    } catch (e) {
      // If parsing fails, and it's not a victory, fallback to entry tab
      if (entry.entry_type === "victory") return activeTab === "victories";
      return activeTab === "entries";
    }

    // Filter by pending/follow-up status
    if (activeTab === "pending") {
      if (!contentData?.follow_up) return false;
    }

    // Filter by selected tag
    if (selectedTag) {
      // Check both the JSON content tags AND the column tags
      const jsonTags = contentData?.tags || [];
      const columnTags = entry.tags || [];
      const allTags = Array.from(new Set([...jsonTags, ...columnTags]));

      if (!allTags.includes(selectedTag)) return false;
    }

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

    // For daily/victory entries, parse JSON to get title
    try {
      const content = typeof entry.content === 'string' ? JSON.parse(entry.content) : entry.content;
      if (content.title) {
        const icon = entry.entry_type === "victory" ? "🏆 " : "📝 ";
        return icon + content.title;
      }
    } catch (e) {
      // Fallback
    }

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

    // For daily/victory entries, parse JSON to get text
    if (!entry.content) return "Sin contenido";

    try {
      const content = typeof entry.content === 'string' ? JSON.parse(entry.content) : entry.content;
      if (content.text) {
        return content.text.length > 80 ? content.text.substring(0, 80) + "..." : content.text;
      }
    } catch (e) {
      // Fallback
    }

    // If content is not a string (e.g., JSON object), stringify it
    const contentStr = typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content);

    return contentStr.length > 80
      ? contentStr.substring(0, 80) + "..."
      : contentStr;
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("¿Estás seguro de que quieres borrar esta entrada?")) return;

    try {
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      toast({
        title: "Entrada eliminada",
        description: "La entrada ha sido borrada correctamente.",
      });
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: "No se pudo borrar la entrada.",
        variant: "destructive",
      });
    }
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
              <div
                key={entry.id}
                className="group relative w-full bg-card rounded-2xl p-4 shadow-soft text-left transition-all hover:shadow-medium cursor-pointer"
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
                        {new Date(entry.created_at).toLocaleDateString("es", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <h4 className="font-display font-semibold text-foreground truncate">{getTitle(entry)}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{getPreview(entry)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-8 w-8"
                    onClick={(e) => handleDelete(e, entry.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
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
