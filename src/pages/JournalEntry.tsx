import { useState } from "react";
import { ArrowLeft, Save, Trophy, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const tags = [
  { id: "family", label: "Familia", color: "bg-coral/20 text-coral border-coral/30" },
  { id: "work", label: "Trabajo", color: "bg-turquoise/20 text-turquoise border-turquoise/30" },
  { id: "relationships", label: "Pareja", color: "bg-destructive/20 text-destructive border-destructive/30" },
  { id: "friends", label: "Amigos", color: "bg-warning/20 text-warning border-warning/30" },
  { id: "self", label: "Personal", color: "bg-primary/20 text-primary border-primary/30" },
];

const moodOptions = [
  { value: 1, label: "😔", description: "Muy difícil" },
  { value: 2, label: "😕", description: "Difícil" },
  { value: 3, label: "😐", description: "Neutral" },
  { value: 4, label: "🙂", description: "Bien" },
  { value: 5, label: "😊", description: "Muy bien" },
];

const JournalEntry = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mood, setMood] = useState(3);
  const [isVictory, setIsVictory] = useState(false);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSave = async () => {
    if (!user || !session) {
      navigate("/auth");
      return;
    }

    if (!title.trim()) {
      toast.error("Agrega un título");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("journal_entries").insert({
        user_id: user.id,
        content: content.trim(),
        entry_type: isVictory ? "victory" : "daily",
        mood_score: mood,
        tags: selectedTags,
        metadata: {
          title: title.trim(),
          follow_up: isFollowUp
        },
      });

      if (error) throw error;

      toast.success(isVictory ? "¡Victoria registrada! 🏆" : "Entrada guardada");
      navigate("/journal");
    } catch (error) {
      console.error("Error saving entry:", error);
      toast.error("Error al guardar", {
        description: "Por favor intenta de nuevo.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Inicia sesión para escribir en tu diario</p>
          <Button onClick={() => navigate("/auth")}>Iniciar sesión</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container flex items-center gap-4 py-4">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-display font-bold text-foreground">
              Nueva Entrada
            </h1>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Victory toggle */}
        <div className={cn(
          "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
          isVictory
            ? "bg-gradient-to-r from-coral/10 to-coral-light/10 border-coral/30"
            : "bg-card border-border"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isVictory
                ? "bg-gradient-to-br from-coral to-coral-light"
                : "bg-muted"
            )}>
              <Trophy className={cn("w-5 h-5", isVictory ? "text-white" : "text-muted-foreground")} />
            </div>
            <div>
              <Label htmlFor="victory-toggle" className="font-display font-semibold text-foreground">
                Registrar como victoria
              </Label>
              <p className="text-xs text-muted-foreground">
                Celebra tus logros y límites establecidos
              </p>
            </div>
          </div>
        </div>
        <Switch
          id="victory-toggle"
          checked={isVictory}
          onCheckedChange={setIsVictory}
        />
    </div>

        {/* Follow Up toggle */ }
  <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
        <span className="text-xl">🔄</span>
      </div>
      <div>
        <Label htmlFor="followup-toggle" className="font-display font-semibold text-foreground">
          Hacer seguimiento
        </Label>
        <p className="text-xs text-muted-foreground">
          Te recordaremos revisar esta entrada en el futuro
        </p>
      </div>
    </div>
    <Switch
      id="followup-toggle"
      checked={isFollowUp}
      onCheckedChange={setIsFollowUp}
    />
  </div>

  {/* Title */ }
  <div className="space-y-2">
    <Label htmlFor="title">Título</Label>
    <Input
      id="title"
      placeholder={isVictory ? "¿Qué lograste hoy?" : "¿Cómo fue tu día?"}
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      className="text-lg font-display"
    />
  </div>

  {/* Mood */ }
  <div className="space-y-3">
    <Label>¿Cómo te sientes?</Label>
    <div className="flex justify-between gap-2">
      {moodOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => setMood(option.value)}
          className={cn(
            "flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all",
            mood === option.value
              ? "bg-primary/10 ring-2 ring-primary"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          <span className="text-2xl">{option.label}</span>
          <span className="text-[10px] text-muted-foreground">{option.description}</span>
        </button>
      ))}
    </div>
  </div>

  {/* Tags */ }
  <div className="space-y-3">
    <Label>Etiquetas</Label>
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => toggleTag(tag.id)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium border transition-all",
            selectedTags.includes(tag.id)
              ? `${tag.color} border-current`
              : "bg-muted text-muted-foreground border-transparent"
          )}
        >
          {tag.label}
        </button>
      ))}
    </div>
  </div>

  {/* Content */ }
  <div className="space-y-2">
    <Label htmlFor="content">
      {isVictory ? "Cuéntanos sobre tu victoria" : "¿Qué quieres escribir?"}
    </Label>
    <Textarea
      id="content"
      placeholder={isVictory
        ? "Describe lo que lograste, cómo te sentiste y qué aprendiste..."
        : "Escribe libremente sobre lo que pasó, cómo te sientes..."
      }
      value={content}
      onChange={(e) => setContent(e.target.value)}
      className="min-h-[200px] resize-none"
    />
  </div>
      </main >
    </div >
  );
};

export default JournalEntry;
