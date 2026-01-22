import { useState } from "react";
import { MobileNav } from "@/components/layout/MobileNav";
import { SOSButton } from "@/components/layout/SOSButton";
import { MoodCheckIn } from "@/components/home/MoodCheckIn";
import { QuickActions } from "@/components/home/QuickActions";
import { StreakCard } from "@/components/home/StreakCard";
import { Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  const handleCheckIn = (data: { mood: number; energy: number; stress: number }) => {
    console.log("Check-in data:", data);
    setHasCheckedIn(true);
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
            <Button variant="ghost" size="icon-sm">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon-sm">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Streak Card */}
        <StreakCard 
          currentStreak={7}
          longestStreak={14}
          thisWeek={[true, true, true, true, true, true, false]}
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
