import { useState, useEffect } from "react";
import { ArrowLeft, Lock, Crown, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MobileNav } from "@/components/layout/MobileNav";
import { SOSButton } from "@/components/layout/SOSButton";
import { ConversationSimulator } from "@/components/tools/ConversationSimulator";
import { RiskMap } from "@/components/tools/RiskMap";
import { AudioLibrary } from "@/components/tools/AudioLibrary";
import { ToolChallenge } from "@/components/tools/ToolChallenge";
import { BoundaryScriptForge } from "@/components/tools/BoundaryScriptForge";
import { SOSWarRoom } from "@/components/tools/SOSWarRoom";
import { SelfCareBlueprint } from "@/components/tools/SelfCareBlueprint";
import { SupportNetworkTracker } from "@/components/tools/SupportNetworkTracker";
import { BreakLoopStory } from "@/components/tools/BreakLoopStory";
import { ProjectionRadarAI } from "@/components/tools/ProjectionRadarAI";

interface ToolContent {
  type?: "roleplay" | "assessment" | "audio_library";
  intro?: string;
  closing?: string;
  sections?: Array<{
    letter?: string;
    title: string;
    description?: string;
    examples?: string[];
    action?: string;
    steps?: string[];
    tip?: string;
  }>;
  categories?: Array<{
    name: string;
    scripts: string[];
  }>;
  tips?: string[];
  scenarios?: Array<{
    id?: string;
    label?: string;
    icon?: string;
    situation?: string;
    do_say?: string[];
    dont_say?: string[];
    do_action?: string;
    dont_action?: string;
  }>;
  emergency?: {
    title: string;
    steps: string[];
  };
  pillars?: Array<{
    name: string;
    icon: string;
    ideas: string[];
  }>;
  weekly_planner?: Record<string, string>;
  circles?: Array<{
    level: number;
    name: string;
    description: string;
    criteria: string[];
  }>;
  action_plan?: {
    title: string;
    items: string[];
  };
  challenges?: Array<{
    id: string;
    title: string;
    description: string;
    xp_reward: number;
    tag: string;
  }>;
  // Roleplay specific
  personalities?: Array<{
    id: string;
    label: string;
    description: string;
  }>;
  rounds?: number;
  feedback_categories?: string[];
  script_versions?: string[];
  // Assessment specific
  questions?: Array<{
    id: number;
    text: string;
    category: string;
    weight: number;
  }>;
  risk_levels?: {
    green: { max?: number; min?: number; title: string; color: string };
    yellow: { max?: number; min?: number; title: string; color: string };
    red: { max?: number; min?: number; title: string; color: string };
  };
  has_discrete_mode?: boolean;
  has_exit_plan?: boolean;
  // Audio library specific
  emotions?: Array<{
    id: string;
    label: string;
    icon: string;
    color: string;
  }>;
  situations?: Array<{
    id: string;
    label: string;
  }>;
  has_offline?: boolean;
  has_playlists?: boolean;
}

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  is_premium: boolean;
  content: ToolContent;
}

const colorClasses: Record<string, string> = {
  turquoise: "from-turquoise to-turquoise-light",
  coral: "from-coral to-coral-light",
  secondary: "from-secondary to-primary",
  primary: "from-primary to-secondary",
};

const ToolDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isPremium } = useAuth();
  const [tool, setTool] = useState<Tool | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTool = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("tools")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching tool:", error);
      } else if (data) {
        setTool(data as unknown as Tool);
      }
      setIsLoading(false);
    };

    fetchTool();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Herramienta no encontrada</p>
          <Button onClick={() => navigate("/tools")}>Volver a herramientas</Button>
        </div>
      </div>
    );
  }

  const isLocked = tool.is_premium && !isPremium;

  if (isLocked) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 glass border-b border-border/50">
          <div className="container flex items-center gap-4 py-4">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-display font-bold text-foreground">{tool.title}</h1>
            </div>
          </div>
        </header>

        <main className="container py-12 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-coral/20 to-coral-light/20 flex items-center justify-center">
            <Lock className="w-10 h-10 text-coral" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-display font-bold text-foreground">Contenido Premium</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Esta herramienta está disponible exclusivamente para miembros Premium.
            </p>
          </div>
          <Button variant="warmth" onClick={() => navigate("/premium")}>
            <Crown className="w-5 h-5" />
            Desbloquear Premium
          </Button>
        </main>

        <MobileNav />
        <SOSButton />
      </div>
    );
  }

  const content = tool.content;

  // Check if this is an interactive tool type
  const isRoleplay = content.type === "roleplay" && content.scenarios && content.personalities;
  const isAssessment = content.type === "assessment" && content.questions && content.risk_levels;
  const isAudioLibrary = content.type === "audio_library" && content.emotions && content.situations;

  // Render interactive tools
  if (isRoleplay || isAssessment || isAudioLibrary) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 glass border-b border-border/50">
          <div className="container flex items-center gap-4 py-4">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-display font-bold text-foreground">{tool.title}</h1>
            </div>
          </div>
        </header>

        <main className="container py-6">
          {isRoleplay && (
            <ConversationSimulator
              content={{
                scenarios: content.scenarios as Array<{ id: string; label: string; icon: string }>,
                personalities: content.personalities!,
                rounds: content.rounds || 3,
                feedback_categories: content.feedback_categories || [],
                script_versions: content.script_versions || [],
              }}
            />
          )}

          {isAssessment && (
            <RiskMap
              content={{
                questions: content.questions!,
                risk_levels: content.risk_levels!,
                has_discrete_mode: content.has_discrete_mode || false,
                has_exit_plan: content.has_exit_plan || false,
              }}
            />
          )}

          {isAudioLibrary && (
            <AudioLibrary
              content={{
                emotions: content.emotions!,
                situations: content.situations!,
                has_offline: content.has_offline || false,
                has_playlists: content.has_playlists || false,
              }}
            />
          )}
        </main>

        <MobileNav />
        <SOSButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container flex items-center gap-4 py-4">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-display font-bold text-foreground">{tool.title}</h1>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Hero */}
        <div className={cn(
          "rounded-2xl p-6 bg-gradient-to-br text-white",
          colorClasses[tool.color] || colorClasses.primary
        )}>
          <h2 className="text-2xl font-display font-bold mb-2">{tool.title}</h2>
          <p className="text-white/80">{tool.description}</p>
        </div>

        {/* Intro */}
        {content.intro && (
          <div className="bg-card rounded-2xl p-5 shadow-soft">
            <p className="text-foreground leading-relaxed">{content.intro}</p>
          </div>
        )}

        {/* Sections (H.E.R.O. / C.A.L.M. style) */}
        {content.sections && (
          <div className="space-y-4">
            {content.sections.map((section, index) => (
              <div key={index} className="bg-card rounded-2xl p-5 shadow-soft space-y-3">
                <div className="flex items-center gap-3">
                  {section.letter && (
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-display font-bold text-white bg-gradient-to-br",
                      colorClasses[tool.color] || colorClasses.primary
                    )}>
                      {section.letter}
                    </div>
                  )}
                  <h3 className="text-lg font-display font-bold text-foreground">{section.title}</h3>
                </div>

                {section.description && (
                  <p className="text-muted-foreground">{section.description}</p>
                )}

                {section.examples && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Ejemplos:</p>
                    <ul className="space-y-1.5">
                      {section.examples.map((example, i) => (
                        <li key={i} className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {section.steps && (
                  <ol className="space-y-2">
                    {section.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-foreground text-sm">{step}</span>
                      </li>
                    ))}
                  </ol>
                )}

                {section.action && (
                  <div className="bg-turquoise/10 border border-turquoise/20 rounded-xl p-4">
                    <p className="text-sm text-turquoise font-medium">💡 {section.action}</p>
                  </div>
                )}

                {section.tip && (
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                    <p className="text-sm text-primary font-medium">💡 {section.tip}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Break Loop Story — narrative protocol for sections WITH steps but WITHOUT letter (protocolo-ruptura) */}
        {content.sections && !(content.sections[0] as { letter?: string })?.letter && (content.sections[0] as { steps?: string[] })?.steps && (
          <BreakLoopStory sections={content.sections} closing={content.closing} />
        )}

        {/* Projection Radar AI — Socratic shadow work dialog for sections WITH questions (radar-proyecciones) */}
        {content.sections && !(content.sections[0] as { letter?: string })?.letter && (content.sections[1] as { questions?: string[] })?.questions && (
          <ProjectionRadarAI />
        )}

        {/* Categories (Scripts style) */}
        {content.categories && (
          <div className="space-y-4">
            {content.categories.map((category, index) => (
              <div key={index} className="bg-card rounded-2xl p-5 shadow-soft space-y-3">
                <h3 className="font-display font-bold text-foreground">{category.name}</h3>
                <ul className="space-y-2">
                  {category.scripts.map((script, i) => (
                    <li key={i} className="bg-secondary/10 border border-secondary/20 rounded-xl p-3 text-sm text-foreground">
                      "{script}"
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Boundary Script Forge — injected below categories for tools that have them */}
        {content.categories && !content.challenges && (
          <BoundaryScriptForge categories={content.categories} />
        )}

        {/* Tips */}
        {content.tips && (
          <div className="bg-card rounded-2xl p-5 shadow-soft space-y-3">
            <h3 className="font-display font-bold text-foreground">Consejos</h3>
            <ul className="space-y-2">
              {content.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="text-primary">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Scenarios (SOS Cards style) */}
        {content.scenarios && (
          <div className="space-y-4">
            {content.scenarios.map((scenario, index) => (
              <div key={index} className="bg-card rounded-2xl p-5 shadow-soft space-y-4">
                <h3 className="font-display font-bold text-coral">{scenario.situation}</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-success">✓ Qué decir</p>
                    {scenario.do_say.map((text, i) => (
                      <p key={i} className="text-xs bg-success/10 text-success p-2 rounded-lg">{text}</p>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-destructive">✕ No digas</p>
                    {scenario.dont_say.map((text, i) => (
                      <p key={i} className="text-xs bg-destructive/10 text-destructive p-2 rounded-lg">{text}</p>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-success">✓ Qué hacer</p>
                    <p className="text-xs text-muted-foreground">{scenario.do_action}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-destructive">✕ No hagas</p>
                    <p className="text-xs text-muted-foreground">{scenario.dont_action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SOS War Room — gamified crisis simulator for scenarios with do_say/dont_say */}
        {content.scenarios && (content.scenarios[0] as { do_say?: string[] })?.do_say && (
          <SOSWarRoom scenarios={content.scenarios} />
        )}

        {/* Emergency (SOS) */}
        {content.emergency && (
          <div className="bg-destructive/10 border-2 border-destructive/30 rounded-2xl p-5 space-y-3">
            <h3 className="font-display font-bold text-destructive">{content.emergency.title}</h3>
            <ol className="space-y-2">
              {content.emergency.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-destructive text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-foreground text-sm">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Pillars (Self-care style) */}
        {content.pillars && (
          <div className="grid grid-cols-2 gap-3">
            {content.pillars.map((pillar, index) => (
              <div key={index} className="bg-card rounded-2xl p-4 shadow-soft space-y-2">
                <h4 className="font-display font-bold text-foreground">{pillar.name}</h4>
                <ul className="space-y-1">
                  {pillar.ideas.slice(0, 3).map((idea, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      {idea}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* SelfCare Blueprint Builder — weekly commitment system with XP tiers */}
        {content.pillars && (
          <SelfCareBlueprint pillars={content.pillars} />
        )}

        {/* Circles (Support network style) */}
        {content.circles && (
          <div className="space-y-4">
            {content.circles.map((circle, index) => (
              <div key={index} className="bg-card rounded-2xl p-5 shadow-soft space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-bold">
                    {circle.level}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-foreground">{circle.name}</h4>
                    <p className="text-xs text-muted-foreground">{circle.description}</p>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {circle.criteria.map((criterion, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      {criterion}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Support Network Tracker — 3-phase interactive system: map contacts → commit tasks → track completion */}
        {content.circles && (
          <SupportNetworkTracker
            circles={content.circles}
            action_plan={content.action_plan}
          />
        )}


        {/* Closing */}
        {content.closing && (
          <div className="bg-card rounded-2xl p-5 shadow-soft">
            <p className="text-foreground leading-relaxed font-medium">{content.closing}</p>
          </div>
        )}

        {/* Dynamic Challenges */}
        {content.challenges && content.challenges.length > 0 && (
          <div className="pt-8 mb-8 space-y-6 border-t border-border/50">
            {content.challenges.map((challenge) => (
              <ToolChallenge key={challenge.id} challenge={challenge} />
            ))}
          </div>
        )}
      </main>

      <MobileNav />
      <SOSButton />
    </div>
  );
};

export default ToolDetail;
