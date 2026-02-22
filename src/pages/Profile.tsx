import { ArrowLeft, User, Settings, Bell, Shield, Heart, LogOut, ChevronRight, Crown, Database, Camera, Loader2, LayoutDashboard, MapPin, Trophy, Flame, Activity, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { SOSButton } from "@/components/layout/SOSButton";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LevelBadge, XPBar } from "@/components/gamification";

interface ProfileData {
  id: string;
  user_id: string;
  avatar_url: string | null;
  display_name: string | null;
  occupation: string | null;
  is_admin: boolean | null;
  is_premium: boolean | null;
  streak_count: number | null;
  age_range: string | null;
  gender: string | null;
  goals: string[] | null;
  onboarding_completed: boolean | null;
  created_at: string;
  updated_at: string;
}

// Derived fields from user_progress
const DEFAULT_LEVEL = 1;
const DEFAULT_XP = 0;

const menuItems = [
  { icon: Bell, label: "Notificaciones", path: "/settings/notifications" },
  { icon: Shield, label: "Privacidad y seguridad", path: "/settings/privacy" },
  { icon: Heart, label: "Contactos de confianza", path: "/settings/contacts" },
  { icon: Package, label: "Mis Pedidos", path: "/orders" },
  { icon: Database, label: "Gestión de datos", path: "/data" },
  { icon: LayoutDashboard, label: "Panel de Admin", path: "/admin" },
  { icon: Settings, label: "Configuración", path: "/settings" },
];

const Profile = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch Profile Data
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      return data as ProfileData;
    },
    enabled: !!user,
  });

  // Fetch user progress for XP/level
  const { data: progress } = useQuery({
    queryKey: ['user-progress'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_progress')
        .select('total_xp, current_level')
        .eq('user_id', user?.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const userLevel = progress ? Math.floor(Math.sqrt(progress.total_xp) / 10) + 1 : DEFAULT_LEVEL;
  const userXP = progress?.total_xp || DEFAULT_XP;

  // Mock stats
  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      return {
        checkins: 42,
        meditations: 15,
        journal_entries: 28
      };
    }
  });

  // Upload Avatar Mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // 1. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // 3. Update Profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('user_id', user?.id);

        if (updateError) throw updateError;

        return publicUrl;
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success("Foto de perfil actualizada");
    },
    onError: (error: Error) => {
      toast.error("Error al subir imagen: " + error.message);
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    const file = event.target.files[0];
    uploadAvatarMutation.mutate(file);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container flex items-center gap-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            {/* Admin Debug Indicator */}
            {profile?.is_admin && <span className="text-xs text-green-500">Admin Mode</span>}
            <h1 className="text-lg font-display font-bold text-foreground">
              Mi Perfil
            </h1>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Profile Header Block */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative cursor-pointer"
              >
                <Avatar className="w-20 h-20 border-4 border-background shadow-xl">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {profile?.display_name?.[0] || user?.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Level Badge Overlay */}
                <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 shadow-sm pointer-events-none">
                  <LevelBadge level={userLevel} showLabel={false} className="scale-75" />
                </div>

                {/* Upload Overlay */}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-display font-bold text-foreground">
                {profile?.display_name || "Usuario"}
              </h2>
              <p className="text-muted-foreground flex items-center gap-1 text-sm">
                <MapPin className="w-3 h-3" /> Explorador Interior
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs gap-1 px-2 py-0.5">
                  <Trophy className="w-3 h-3 text-amber-500" />
                  Nivel {userLevel}
                </Badge>
                {(profile?.streak_count || 0) > 0 && (
                  <Badge variant="outline" className="text-xs gap-1 border-orange-500/30 bg-orange-500/5 text-orange-600 px-2 py-0.5">
                    <Flame className="w-3 h-3" />
                    {profile?.streak_count} días
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Gamification Progress */}
        <Card className="border-none shadow-md bg-gradient-to-br from-card to-secondary/20">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <LevelBadge level={userLevel} />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Siguiente Hito</p>
                <p className="text-sm font-semibold text-primary">
                  {((Math.floor(Math.sqrt(userXP) / 10) + 1) * 10) ** 2 - userXP} XP para subir
                </p>
              </div>
            </div>
            <XPBar currentXP={userXP} level={userLevel} />
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center space-y-1">
              <Activity className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats?.checkins || 0}</div>
              <div className="text-xs text-muted-foreground font-medium uppercase">Check-ins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center space-y-1">
              <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{profile?.streak_count || 0}</div>
              <div className="text-xs text-muted-foreground font-medium uppercase">Mejor Racha</div>
            </CardContent>
          </Card>
        </div>

        {/* Premium CTA */}
        {!profile?.is_premium && (
          <button
            onClick={() => navigate("/premium")}
            className="w-full bg-gradient-to-r from-coral to-coral-light rounded-2xl p-5 shadow-glow-coral flex items-center gap-4 text-left transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-display font-semibold text-white">
                Obtén Premium
              </h4>
              <p className="text-xs text-white/70 mt-0.5">
                Acceso completo a todas las herramientas
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70" />
          </button>
        )}

        {/* Menu Items */}
        <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
          {menuItems.filter(item => {
            if (item.path === "/data") return profile?.is_admin;
            if (item.path === "/admin") return profile?.is_admin;
            return true;
          }).map((item, index, array) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 p-4 text-left hover:bg-muted/50 transition-colors ${index !== array.length - 1 ? "border-b border-border" : ""
                }`}
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-foreground font-medium text-sm">
                {item.label}
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Sign Out */}
        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar sesión</span>
        </Button>

        {/* Version info */}
        <p className="text-xs text-muted-foreground text-center">
          Versión 1.0.0 • Más Allá del Miedo
        </p>
      </main>

      <MobileNav />
      <SOSButton />
    </div>
  );
};

export default Profile;
