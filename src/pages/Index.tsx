import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileNav } from "@/components/layout/MobileNav";
import { SOSButton } from "@/components/layout/SOSButton";
import { MoodCheckIn } from "@/components/home/MoodCheckIn";
import { QuickActions } from "@/components/home/QuickActions";
import { StreakCard } from "@/components/home/StreakCard";
import { RankingPreviewCard } from "@/components/home/RankingPreviewCard";
import { DailyChallenge } from "@/components/daily-challenge";
import { Bell, LogIn, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    thisWeek: [false, false, false, false, false, false, false],
  });
  const [userName, setUserName] = useState("");
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [dailyReflection, setDailyReflection] = useState<{
    content: string;
    author: string | null;
  } | null>(null);




  // Fallback content in case DB is unreachable
  const FALLBACK_REFLECTIONS = [
    { content: 'El miedo no es tu enemigo, es un mapa hacia tu poder oculto.', author: 'Más allá del Miedo' },
    { content: 'La ansiedad es solo emoción contenida que pide movimiento.', author: 'Mindful Navigator' },
    { content: 'No necesitas "arreglarte", solo necesitas observarte sin juicio.', author: 'Ernesto' },
    { content: 'Tu oscuridad contiene la energía necesaria para tu propia iluminación.', author: 'Carl Jung' },
    { content: 'Lo que resistes, persiste. Lo que aceptas, se transforma.', author: 'Carl Jung' },
    { content: 'Hoy, sé el adulto que necesitabas cuando eras niño.', author: 'Inner Child' },
    { content: 'Poner límites es un acto de amor propio, no de agresión.', author: 'Más allá del Miedo' },
    { content: 'La incomodidad es el precio de la admisión para una vida significativa.', author: 'Susan David' },
    { content: 'No eres tus pensamientos. Eres el cielo donde tus pensamientos son las nubes.', author: 'Eckhart Tolle' },
    { content: 'Si te da paz, es el camino correcto. Si te da confusión, es una lección.', author: 'Anónimo' },
    { content: 'La vulnerabilidad no es debilidad, es nuestra medida más precisa de valor.', author: 'Brené Brown' },
    { content: 'Respira. Este momento es el único que tienes seguro.', author: 'Mindful Navigator' },
    { content: 'Confía en la incertidumbre. Ahí es donde ocurre la magia.', author: 'Más allá del Miedo' },
    { content: 'Perdonar no es liberar al otro, es liberarte a ti mismo del veneno.', author: 'Anónimo' },
    { content: 'Tu cuerpo lleva la cuenta. Escucha lo que te dice tu tensión.', author: 'Bessel van der Kolk' },
    { content: 'La disciplina es el puente entre metas y logros.', author: 'Jim Rohn' },
    { content: 'No busques que el mundo cambie, cambia tu forma de verlo y el mundo cambiará.', author: 'Wayne Dyer' },
    { content: 'El fracaso es solo información. No una sentencia.', author: 'Mindful Navigator' },
    { content: 'Date permiso para descansar. No eres una máquina.', author: 'Self Care' },
    { content: 'La felicidad no es la ausencia de problemas, es la habilidad de tratar con ellos.', author: 'Steve Maraboli' },
    { content: 'Sé amable contigo mismo. Estás haciendo lo mejor que puedes.', author: 'Auto-compasión' },
    { content: 'El primer paso para sanar es reconocer que te duele.', author: 'Más allá del Miedo' },
    { content: 'No tienes que creer todo lo que piensas.', author: 'Byron Katie' },
    { content: 'La paz viene de adentro. No la busques fuera.', author: 'Buda' },
    { content: 'Cada vez que eliges lo difícil sobre lo fácil, ganas poder personal.', author: 'Stoicism' },
    { content: 'Obsérvate a ti mismo como si fueras otra persona.', author: 'Distanciamiento' },
    { content: 'El dolor es inevitable, el sufrimiento es opcional.', author: 'Haruki Murakami' },
    { content: 'Hoy es un buen día para empezar de nuevo.', author: 'Esperanza' },
    { content: 'Tus emociones son mensajeros, no dictadores.', author: 'Emotional Intelligence' },
    { content: 'La libertad está al otro lado de tu miedo.', author: 'Más allá del Miedo' }
  ];

  /* 
   * Loads a random reflection.
   * Dictionary-first approach: Tries DB, falls back to local constant.
   */
  const getRandomReflection = async () => {
    let selectedReflection = null;

    try {
      console.log("Fetching reflections...");
      const { data: reflections, error } = await supabase
        .from("daily_reflections")
        .select("content, author");

      if (error) {
        console.warn("Supabase fetch failed, utilizing fallback.", error);
        throw error; // Trigger catch block
      };

      if (reflections && reflections.length >= 5) {
        const randomIndex = Math.floor(Math.random() * reflections.length);
        selectedReflection = reflections[randomIndex];
        console.log(`Loaded reflection from DB (${reflections.length} items)`);
      } else {
        console.warn(`DB only returned ${reflections?.length || 0} items. Using fallback for variety.`);
        // Ensure selectedReflection is null so it triggers only the fallback logic below
        selectedReflection = null;
      }
    } catch (error) {
      console.log("Using local fallback content.");
    }

    // Final Fallback Logic
    if (!selectedReflection) {
      console.log("Activating Fallback Logic (DB empty or insufficient)");
      const randomIndex = Math.floor(Math.random() * FALLBACK_REFLECTIONS.length);
      selectedReflection = FALLBACK_REFLECTIONS[randomIndex];
    }

    setDailyReflection(selectedReflection);
  };

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
    getRandomReflection();
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("streak_count, last_check_in_date, display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        // Use local date instead of UTC for check-in comparison
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        setHasCheckedIn(profile.last_check_in_date === today);
        setStreakData((prev) => ({
          ...prev,
          currentStreak: profile.streak_count || 0,
        }));
        if (profile.display_name) setUserName(profile.display_name);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleCheckIn = async (data: { mood: number; energy: number; stress: number }) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Crea una cuenta para guardar tus check-ins",
      });
      setHasCheckedIn(true);
      return;
    }

    try {
      // Save journal entry
      const { error: journalError } = await supabase.from("journal_entries").insert({
        user_id: user.id,
        mood_score: data.mood,
        energy_score: data.energy,
        stress_score: data.stress,
        entry_type: "daily",
      });

      if (journalError) throw journalError;

      // Update profile streak
      const today = new Date().toISOString().split("T")[0];
      const { data: profile } = await supabase
        .from("profiles")
        .select("streak_count, last_check_in_date")
        .eq("user_id", user.id)
        .maybeSingle();

      let newStreak = 1;
      if (profile) {
        const lastDate = profile.last_check_in_date;
        if (lastDate) {
          const lastCheckIn = new Date(lastDate);
          const todayDate = new Date(today);
          const diffDays = Math.floor(
            (todayDate.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays === 1) {
            newStreak = (profile.streak_count || 0) + 1;
          } else if (diffDays === 0) {
            newStreak = profile.streak_count || 1;
          }
        }
      }

      await supabase
        .from("profiles")
        .update({
          streak_count: newStreak,
          last_check_in_date: today,
        })
        .eq("user_id", user.id);

      setStreakData((prev) => ({ ...prev, currentStreak: newStreak }));
      setHasCheckedIn(true);

      toast({
        title: "¡Check-in guardado!",
        description: `Racha actual: ${newStreak} días`,
      });
    } catch (error) {
      console.error("Error saving check-in:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el check-in",
        variant: "destructive",
      });
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container flex items-center justify-between py-4">
          <div>
            <p className="text-sm text-muted-foreground">{greeting()}</p>
            <h1 className="text-xl font-display font-bold text-foreground">
              {userName ? `Hola, ${userName}` : "Tu Coach de Bolsillo"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Button variant="ghost" size="icon-sm">
                      <Bell className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => navigate("/profile")}
                    >
                      <User className="w-5 h-5" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/auth")}
                    className="gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Entrar
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Streak Card */}
        <StreakCard
          currentStreak={streakData.currentStreak}
          longestStreak={streakData.longestStreak}
          thisWeek={streakData.thisWeek}
        />

        {/* Mood Check-in - Always visible for debugging */}
        <MoodCheckIn onComplete={handleCheckIn} />

        {/* Daily Challenge - Main Feature */}
        <DailyChallenge />

        {/* Ranking Preview Card */}
        {user && <RankingPreviewCard />}

        {/* Quick Actions */}
        <section className="space-y-3">
          <h2 className="text-lg font-display font-semibold text-foreground">
            ¿Qué necesitas hoy?
          </h2>
          <QuickActions />
        </section>

        {/* Daily Tip */}
        <section className="bg-gradient-to-br from-secondary to-primary rounded-2xl p-5 text-primary-foreground">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs uppercase tracking-wider opacity-70">
              Reflexión del día
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
              onClick={() => getRandomReflection()}
            >
              <RefreshCw className="h-3 w-3" />
              <span className="sr-only">Nueva reflexión</span>
            </Button>
          </div>
          <p className="font-display text-lg leading-relaxed">
            "{dailyReflection?.content || "Cargando reflexión..."}"
          </p>
          {dailyReflection?.author && (
            <p className="text-sm text-right mt-2 opacity-80">
              — {dailyReflection.author}
            </p>
          )}
        </section>
      </main>

      <MobileNav />
      <SOSButton />
    </div>
  );
};

export default Index;
