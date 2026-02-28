import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SOSButton } from "@/components/layout/SOSButton";
import { MoodCheckIn } from "@/components/home/MoodCheckIn";
import { QuickActions } from "@/components/home/QuickActions";
import { StreakCard } from "@/components/home/StreakCard";
import { RankingPreviewCard } from "@/components/home/RankingPreviewCard";
import { DailyGreeting } from "@/components/home/DailyGreeting";
import { HomeReflection } from "@/components/home/HomeReflection";
import { DailyChallenge } from "@/components/daily-challenge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { streakEventBus } from "@/lib/streakEventBus";

const Index = () => {
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [currentMood, setCurrentMood] = useState<number | null>(null);
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
  const [isRefreshing, setIsRefreshing] = useState(false);




  // Único fallback genérico en caso de caída extrema de red
  const GENERIC_FALLBACK = {
    content: 'Respira. Este momento es el único que tienes seguro.',
    author: 'Mindful Navigator'
  };

  /* 
   * Extrae una reflexión aleatoria desde la tabla system_reflections.
   */
  const getRandomReflection = async () => {
    setIsRefreshing(true);
    let selectedReflection = null;

    try {
      // Uso de RPC para ORDER BY random() LIMIT 1 optimizado
      const { data: reflections, error } = await supabase
        .rpc("get_random_reflection" as any) as any;

      if (error) throw error;

      if (reflections && Array.isArray(reflections) && reflections.length > 0) {
        selectedReflection = reflections[0];
      }
    } catch (error) {
      console.warn("Fallo al obtener reflexión de Supabase. Usando fallback genérico.", error);
    }

    if (!selectedReflection) {
      selectedReflection = GENERIC_FALLBACK;
    }

    // Evitar repetición consecutiva
    const lastReflection = sessionStorage.getItem('lastReflection');
    if (selectedReflection.content === lastReflection && selectedReflection.content !== GENERIC_FALLBACK.content) {
      try {
        const { data: retryReflections } = await supabase.rpc("get_random_reflection" as any) as any;
        if (retryReflections && retryReflections.length > 0 && retryReflections[0].content !== lastReflection) {
          selectedReflection = retryReflections[0];
        }
      } catch (e) { }
    }

    sessionStorage.setItem('lastReflection', selectedReflection.content);
    setDailyReflection(selectedReflection);
    setTimeout(() => setIsRefreshing(false), 400);
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
      const { data: profileData } = await supabase
        .from("profiles")
        .select("streak_count, longest_streak, last_check_in_date, display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const profile = profileData as any;

      if (profile) {
        // Use local date instead of UTC for check-in comparison
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        setHasCheckedIn(profile.last_check_in_date === today);
        setStreakData((prev) => ({
          ...prev,
          currentStreak: profile.streak_count || 0,
          longestStreak: profile.longest_streak || 0,
        }));
        if (profile.display_name) setUserName(profile.display_name);

        // Fetch latest mood for dynamic environment
        const { data: latestEntry } = await supabase
          .from("journal_entries")
          .select("mood_score")
          .eq("user_id", user.id)
          .eq("entry_type", "daily")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestEntry && latestEntry.mood_score !== undefined) {
          setCurrentMood(latestEntry.mood_score);
        }

      } else {
        // Profile doesn't exist - create it automatically
        console.log("Profile not found, creating new profile...");
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            user_id: user.id,
            display_name: user.email?.split('@')[0] || 'Usuario',
            streak_count: 0,
            last_check_in_date: null,
            is_premium: false,
            is_admin: false
          });

        if (insertError) {
          console.error("Error creating profile:", insertError);
        } else {
          console.log("Profile created successfully!");
          // Reload profile data
          await loadProfileData();
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleCheckIn = async (data: { mood: number; energy: number; stress: number }) => {
    setCurrentMood(data.mood);
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
      // Use local date instead of UTC
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const { data: profileData } = await supabase
        .from("profiles")
        .select("streak_count, longest_streak, last_check_in_date")
        .eq("user_id", user.id)
        .maybeSingle();

      const profile = profileData as any;

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
      let newLongestStreak = profile?.longest_streak || 0;
      if (newStreak > newLongestStreak) {
        newLongestStreak = newStreak;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          streak_count: newStreak,
          longest_streak: newLongestStreak,
          last_check_in_date: today,
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setStreakData((prev) => ({
        ...prev,
        currentStreak: newStreak,
        longestStreak: newLongestStreak
      }));
      streakEventBus.emit(newStreak); // sync DailyChallenge widget
      setHasCheckedIn(true);

      console.log("Check-in successful, streak updated to:", newStreak);

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

  // navigate ya no se usa directamente en este nivel (delegado a componentes)

  const getDynamicBgClass = () => {
    if (currentMood === null) return "bg-background";
    if (currentMood <= 3) return "bg-charcoal border-x-4 border-coral/50 transition-colors duration-1000 drop-shadow-[0_0_15px_rgba(255,69,58,0.1)]"; // Low mood = dark charcoal with coral threat
    if (currentMood >= 7) return "bg-background border-x-4 border-primary/50 transition-colors duration-1000"; // High mood = turquoise border
    return "bg-background transition-colors duration-1000";
  };

  return (
    <div className={`min-h-screen pb-24 ${getDynamicBgClass()}`}>
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container py-4">
          <DailyGreeting
            userName={userName}
            isLoading={loading}
            isAuthenticated={!!user}
          />
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Streak Card */}
        <StreakCard
          currentStreak={streakData.currentStreak}
          longestStreak={streakData.longestStreak}
          thisWeek={streakData.thisWeek}
        />

        {/* Mood Check-in - Hides after completion to save space */}
        {!hasCheckedIn && (
          <MoodCheckIn onComplete={handleCheckIn} />
        )}

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

        <HomeReflection
          content={dailyReflection?.content}
          author={dailyReflection?.author}
          isRefreshing={isRefreshing}
          onRefresh={getRandomReflection}
        />
      </main>

      <SOSButton />
    </div>
  );
};

export default Index;
