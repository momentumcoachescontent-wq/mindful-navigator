import { useState } from "react";
import { ArrowLeft, PenLine, Plus, Calendar, Tag, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { SOSButton } from "@/components/layout/SOSButton";
import { cn } from "@/lib/utils";

const tags = [
  { id: "family", label: "Familia", color: "bg-coral/20 text-coral" },
  { id: "work", label: "Trabajo", color: "bg-turquoise/20 text-turquoise" },
  { id: "relationships", label: "Pareja", color: "bg-destructive/20 text-destructive" },
  { id: "friends", label: "Amigos", color: "bg-warning/20 text-warning" },
  { id: "self", label: "Personal", color: "bg-primary/20 text-primary" },
];

const mockEntries = [
  {
    id: "1",
    date: "2024-01-22",
    title: "Conversación difícil con mamá",
    preview: "Hoy tuve que poner un límite importante...",
    tags: ["family"],
    mood: 2,
  },
  {
    id: "2",
    date: "2024-01-21",
    title: "Victoria: Dije que no",
    preview: "Por primera vez me sentí capaz de...",
    tags: ["work", "self"],
    mood: 3,
    isVictory: true,
  },
  {
    id: "3",
    date: "2024-01-20",
    title: "Reflexión sobre mis límites",
    preview: "Estoy aprendiendo a reconocer...",
    tags: ["self"],
    mood: 2,
  },
];

const tabs = [
  { id: "entries", label: "Entradas" },
  { id: "victories", label: "Victorias" },
];

const Journal = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("entries");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredEntries = mockEntries.filter((entry) => {
    if (activeTab === "victories" && !entry.isVictory) return false;
    if (selectedTag && !entry.tags.includes(selectedTag)) return false;
    return true;
  });

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
              Diario Guiado
            </h1>
          </div>
          <PenLine className="w-8 h-8 text-primary" />
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Tabs */}
        <div className="flex bg-muted rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground"
              )}
            >
              {tab.id === "victories" && <Trophy className="w-4 h-4 inline mr-1.5 -mt-0.5" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tags filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1.5 px-1.5">
          <button
            onClick={() => setSelectedTag(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1",
              !selectedTag
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Tag className="w-3 h-3" />
            Todas
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                selectedTag === tag.id
                  ? "bg-primary text-primary-foreground"
                  : tag.color
              )}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Entries List */}
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => navigate(`/journal/${entry.id}`)}
              className="w-full bg-card rounded-2xl p-4 shadow-soft text-left transition-all hover:shadow-medium"
            >
              <div className="flex items-start gap-3">
                {entry.isVictory && (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral to-coral-light flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString("es", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <h4 className="font-display font-semibold text-foreground truncate">
                    {entry.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {entry.preview}
                  </p>
                  <div className="flex gap-1.5 mt-2">
                    {entry.tags.map((tagId) => {
                      const tag = tags.find((t) => t.id === tagId);
                      return tag ? (
                        <span
                          key={tagId}
                          className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", tag.color)}
                        >
                          {tag.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay entradas aún</p>
          </div>
        )}
      </main>

      {/* FAB - New Entry */}
      <Button
        variant="calm"
        size="icon-lg"
        className="fixed bottom-24 right-4 z-40 rounded-full shadow-glow-turquoise"
        onClick={() => navigate("/journal/new")}
      >
        <Plus className="w-6 h-6" />
      </Button>

      <MobileNav />
      <SOSButton />
    </div>
  );
};

export default Journal;
