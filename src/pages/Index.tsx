import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileNav } from "@/components/layout/MobileNav";
import { SOSButton } from "@/components/layout/SOSButton";
import { MoodCheckIn } from "@/components/home/MoodCheckIn";
import { QuickActions } from "@/components/home/QuickActions";
import { StreakCard } from "@/components/home/StreakCard";
import { RankingPreviewCard } from "@/components/home/RankingPreviewCard";
import { DailyChallenge } from "@/components/daily-challenge";
import { Bell, LogIn, User } from "lucide-react";
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
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("streak_count, last_check_in_date")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        const today = new Date().toISOString().split("T")[0];
        setHasCheckedIn(profile.last_check_in_date === today);
        setStreakData((prev) => ({
          ...prev,
          currentStreak: profile.streak_count || 0,
        }));
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
              Tu Coach de Bolsillo
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

        {/* Mood Check-in or Success Message */}
        {!hasCheckedIn ? (
          <MoodCheckIn onComplete={handleCheckIn} />
        ) : (
          <div className="bg-success/10 border-2 border-success/30 rounded-2xl p-5 text-center animate-fade-up">
            <p className="text-success font-medium">
              ✨ ¡Check-in guardado! Sigue así.
            </p>
          </div>
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

        {/* Daily Tip */}
        <section className="bg-gradient-to-br from-secondary to-primary rounded-2xl p-5 text-primary-foreground">
          <p className="text-xs uppercase tracking-wider opacity-70 mb-2">
            Reflexión del día
          </p>
          <p className="font-display text-lg leading-relaxed">
            "Poner límites no es ser egoísta. Es cuidar tu energía para estar mejor contigo y con los demás."
          </p>
        </section>
      </main>

      <MobileNav />
      <SOSButton />
    </div>
  );
};

export default Index;
