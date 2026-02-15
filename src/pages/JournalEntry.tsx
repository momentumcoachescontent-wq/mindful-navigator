import { useState, useEffect } from "react";
import { ArrowLeft, Save, Trophy, Loader2, Check, RefreshCw } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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

// ... imports ...
// ... imports ...

// ... interfaces ...
interface ActionStep {
  step: number;
  action: string;
  completed?: boolean;
}

interface RecommendedTool {
  name: string;
  reason: string;
  completed?: boolean;
}

const JournalEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const parentId = searchParams.get("parent_id");
  const { user, session } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mood, setMood] = useState(3);
  const [isVictory, setIsVictory] = useState(false);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parentEntryId, setParentEntryId] = useState<string | null>(null);
  const [simulationData, setSimulationData] = useState<any>(null);

  // Interactive Checklist State
  const [actionPlan, setActionPlan] = useState<ActionStep[]>([]);
  const [tools, setTools] = useState<RecommendedTool[]>([]);
  const [isScannerEntry, setIsScannerEntry] = useState(false);

  useEffect(() => {
    if (id && id !== "new" && user) {
      loadEntry(id);
    } else if (id === "new" && parentId && user) {
      loadParentEntry(parentId);
    }
  }, [id, user, parentId]);

  const loadParentEntry = async (pId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", pId)
        .single();

      if (error) throw error;

      if (data) {
        const meta = data.metadata as Record<string, unknown>;
        const parentTitle = (meta?.title as string) || "Sin título";
        setTitle(`Seguimiento: ${parentTitle}`);
        setContent(`Continuando desde la entrada "${parentTitle}":\n\n`);
        setParentEntryId(pId);
        // Optional: Pre-fill content or tags
        // setSelectedTags(data.tags || []); 
      }
    } catch (err) {
      console.error("Error loading parent entry:", err);
      toast.error("No se pudo cargar la entrada original");
    } finally {
      setIsLoading(false);
    }
  };

  const loadEntry = async (entryId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", entryId)
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        // Parse JSON content for state management
        try {
          const rawData = data as any;
          const contentData = typeof rawData.content === 'string' ? JSON.parse(rawData.content) : rawData.content;

          // If it's a simulation result, we store the full object in simulationData
          // and the user's notes in the content state
          if (contentData && (contentData.type === "simulation_result" || contentData.messages)) {
            setSimulationData(contentData);
            setIsScannerEntry(true);
            setContent(contentData.text || "");
            setTitle(contentData.title || "Resultado de Simulación");
          } else {
            setSimulationData(null);
            setIsScannerEntry(false);
            setContent(contentData?.text || rawData.content || "");
            setTitle(contentData?.title || "");
          }

          setSelectedTags(contentData?.tags || rawData.tags || []);
          setIsFollowUp(!!contentData?.follow_up);

          if (contentData?.parent_id) {
            setParentEntryId(contentData.parent_id);
          }

          // Restore action plan and tools if they exist
          if (contentData?.action_plan) {
            setActionPlan(contentData.action_plan);
          }
          if (contentData?.recommended_tools) {
            setTools(contentData.recommended_tools);
          }
        } catch (e) {
          // Fallback for old format or non-JSON content
          const rawData = data as any;
          setContent(rawData.content || "");
          setTitle("");
          setIsScannerEntry(false);
          setSimulationData(null);
        }

        setMood(data.mood_score || 3);
        setIsVictory(data.entry_type === "victory");
      }
    } catch (error) {
      console.error("Error loading entry:", error);
      toast.error("No se pudo cargar la entrada");
      navigate("/journal");
    } finally {
      setIsLoading(false);
    }
  };

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
      // Store all data in content as JSON since metadata/tags columns don't exist
      const contentData: any = {
        text: content.trim(),
        title: title.trim(),
        follow_up: isFollowUp,
        parent_id: parentEntryId,
        tags: selectedTags,
        action_plan: actionPlan,
        recommended_tools: tools,
        progress: {
          actionPlan: actionPlan.map(a => !!a.completed),
          tools: tools.map(t => !!t.completed)
        }
      };

      // If we have simulation metadata, preserve it
      if (simulationData) {
        Object.assign(contentData, {
          ...simulationData,
          text: content.trim(),
          title: title.trim(),
          tags: selectedTags,
          action_plan: actionPlan,
          recommended_tools: tools
        });
      }

      const entryData = {
        user_id: user.id,
        content: JSON.stringify(contentData),
        entry_type: isVictory ? "victory" : "daily",
        mood_score: mood,
      };

      if (id && id !== "new") {
        // Update existing
        const { error } = await supabase
          .from("journal_entries")
          .update(entryData)
          .eq("id", id);
        if (error) throw error;
        toast.success("Entrada actualizada");
      } else {
        // Create new
        const { error } = await supabase
          .from("journal_entries")
          .insert(entryData);
        if (error) throw error;
        toast.success(isVictory ? "¡Victoria registrada! 🏆" : "Entrada guardada");
      }

      navigate("/journal");
    } catch (error) {
      console.error("Error saving entry:", error);
      toast.error("Error al guardar", {
        description: "Por favor intenta de nuevo.",
      });
      setIsSaving(false);
    }
  };

  const toggleAction = (index: number) => {
    setActionPlan(prev => prev.map((item, i) => i === index ? { ...item, completed: !item.completed } : item));
  };

  const toggleTool = (index: number) => {
    setTools(prev => prev.map((item, i) => i === index ? { ...item, completed: !item.completed } : item));
  };

  const calculateProgress = () => {
    const total = (actionPlan?.length || 0) + (tools?.length || 0);
    if (total === 0) return 100;
    const completed = (actionPlan?.filter(a => a.completed).length || 0) + (tools?.filter(t => t.completed).length || 0);
    return Math.round((completed / total) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <Switch
            id="victory-toggle"
            checked={isVictory}
            onCheckedChange={setIsVictory}
          />
        </div>

        {/* Follow Up toggle */}
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

        {/* Title */}
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

        {/* Mood */}
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

        {/* Tags */}
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

        {/* Content / Notes */}
        <div className="space-y-2">
          <Label htmlFor="content">
            {isVictory
              ? "Cuéntanos sobre tu victoria"
              : isScannerEntry || (id && id !== "new" && (() => {
                try {
                  const d = typeof content === 'string' ? JSON.parse(content || '{}') : content;
                  return d?.type === "simulation_result" || d?.messages;
                } catch (e) { return false; }
              })())
                ? "Notas y reflexiones"
                : "¿Qué quieres escribir?"}
          </Label>
          <Textarea
            id="content"
            placeholder={isVictory
              ? "Describe lo que lograste, cómo te sentiste y qué aprendiste..."
              : "Escribe libremente sobre lo que pasó, cómo te sientes..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[150px] resize-none"
          />
        </div>

        {/* Simulation Results (Special Handling) */}
        {id && id !== "new" && !isLoading && simulationData && (
          <div className="space-y-8 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold">Resultado de Simulación</h3>
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                simulationData.is_completed ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
              )}>
                {simulationData.is_completed ? "Completado" : "Pendiente de Acción"}
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 space-y-2">
              <p className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Análisis General</p>
              <p className="text-sm leading-relaxed italic">"{simulationData.feedback || simulationData.overall || "Sin análisis detallado"}"</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Claridad', value: simulationData.evaluation?.clarity || simulationData.clarity || 0, color: 'text-primary' },
                { label: 'Firmeza', value: simulationData.evaluation?.firmness || simulationData.firmness || 0, color: 'text-secondary' },
                { label: 'Empatía', value: simulationData.evaluation?.empathy || simulationData.empathy || 0, color: 'text-turquoise' }
              ].map((stat) => (
                <div key={stat.label} className="bg-card p-3 rounded-xl text-center border border-border/50 shadow-sm">
                  <div className={cn("text-xl font-bold", stat.color)}>{stat.value}/10</div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Conversation Transcript */}
            {simulationData.messages && simulationData.messages.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Transcripción de la Práctica</p>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar p-1">
                  {simulationData.messages.map((msg: any, idx: number) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 rounded-xl text-xs leading-relaxed",
                        msg.role === 'user'
                          ? "bg-primary/10 border border-primary/20 ml-6"
                          : "bg-muted border border-border mr-6"
                      )}
                    >
                      <p className="font-bold mb-1 opacity-50 uppercase text-[9px]">
                        {msg.role === 'user' ? 'Tú' : (simulationData.personality || 'Simulador')}
                      </p>
                      {msg.content}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Traps */}
            {simulationData.traps && simulationData.traps.length > 0 && (
              <div className="bg-coral/5 border border-coral/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-coral">
                  <span className="text-lg">⚠️</span>
                  <p className="text-xs font-bold uppercase tracking-tight">Trampas Detectadas</p>
                </div>
                <ul className="space-y-2">
                  {simulationData.traps.map((trap: string, i: number) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-2">
                      <span className="text-coral mt-1">•</span>
                      <span>{trap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Scripts */}
            {simulationData.scripts && (
              <div className="space-y-4">
                <p className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Scripts Sugeridos</p>
                <div className="grid gap-3">
                  {[
                    { label: 'Opción Suave', content: simulationData.scripts.soft, color: 'border-turquoise/30 bg-turquoise/5' },
                    { label: 'Opción Firme', content: simulationData.scripts.firm, color: 'border-primary/30 bg-primary/5' },
                    { label: 'Último Aviso', content: simulationData.scripts.final_warning, color: 'border-destructive/30 bg-destructive/5' }
                  ].map((script, idx) => (
                    <div key={idx} className={cn("p-4 rounded-2xl border space-y-2", script.color)}>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{script.label}</p>
                      <p className="text-sm italic leading-relaxed">"{script.content}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Plan */}
            {actionPlan && actionPlan.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Plan de Acción (Pasos a seguir)</p>
                <div className="space-y-2">
                  {actionPlan.map((step, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleAction(idx)}
                      className={cn(
                        "bg-card p-3 rounded-xl border flex items-start gap-3 shadow-sm cursor-pointer transition-all hover:bg-muted/50",
                        step.completed ? "border-success/30 bg-success/5 opacity-80" : "border-border"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-all",
                        step.completed ? "bg-success border-success text-white" : "border-muted-foreground/30 bg-background"
                      )}>
                        {step.completed && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className={cn("text-sm", step.completed ? "text-muted-foreground line-through" : "text-foreground")}>
                        {step.action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tools && tools.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Herramientas Recomendadas</p>
                <div className="grid gap-2">
                  {tools.map((tool, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleTool(idx)}
                      className={cn(
                        "bg-card p-3 rounded-xl border flex items-center justify-between shadow-sm cursor-pointer transition-all hover:bg-muted/50",
                        tool.completed ? "border-turquoise/30 bg-turquoise/5 opacity-80" : "border-border"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all",
                          tool.completed ? "bg-turquoise border-turquoise text-white" : "border-muted-foreground/30 bg-background"
                        )}>
                          {tool.completed && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className={cn("text-sm", tool.completed ? "text-muted-foreground line-through" : "text-foreground")}>
                          {tool.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={async () => {
                try {
                  setIsSaving(true);
                  const updatedData = { ...simulationData, is_completed: !simulationData.is_completed };
                  const { error } = await supabase
                    .from("journal_entries")
                    .update({ content: JSON.stringify(updatedData) })
                    .eq("id", id);

                  if (error) throw error;
                  toast.success(updatedData.is_completed ? "¡Misión cumplida!" : "Marcado como pendiente");
                  loadEntry(id);
                } catch (err) {
                  console.error("Error updating status:", err);
                  toast.error("No se pudo actualizar el estado");
                } finally {
                  setIsSaving(false);
                }
              }}
              variant={simulationData.is_completed ? "outline" : "calm"}
              className="w-full h-12 shadow-sm"
              disabled={isSaving}
            >
              {simulationData.is_completed ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Marcar como pendiente
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Marcar como aplicada/completada
                </>
              )}
            </Button>
          </div>
        )}

        {isScannerEntry && (actionPlan.length > 0 || tools.length > 0) && (
          <div className="space-y-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-semibold">Tu Plan de Acción</h3>
              <span className="text-sm font-medium text-muted-foreground">{calculateProgress()}% Completado</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>

            {/* Action Plan Checklist */}
            {actionPlan.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pasos a seguir</h4>
                <div className="space-y-2">
                  {actionPlan.map((step, index) => (
                    <div
                      key={index}
                      onClick={() => toggleAction(index)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                        step.completed ? "bg-primary/5 border-primary/20" : "bg-card border-border hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 transition-colors",
                        step.completed ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
                      )}>
                        {step.completed && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className={cn("flex-1 text-sm", step.completed && "text-muted-foreground line-through")}>
                        <span className="font-medium mr-2">{step.step}.</span>
                        {step.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tools Checklist */}
            {tools.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Herramientas Recomendadas</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {tools.map((tool, index) => (
                    <div
                      key={index}
                      onClick={() => toggleTool(index)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                        tool.completed ? "bg-primary/5 border-primary/20" : "bg-card border-border hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 transition-colors",
                        tool.completed ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
                      )}>
                        {tool.completed && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-sm font-medium", tool.completed && "text-muted-foreground line-through")}>
                          {tool.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{tool.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main >
    </div >
  );
};

export default JournalEntry;
