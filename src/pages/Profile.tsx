import { ArrowLeft, User, Settings, Bell, Shield, Heart, LogOut, ChevronRight, Crown, Database, Camera, Loader2, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { SOSButton } from "@/components/layout/SOSButton";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useState } from "react";
import { toast } from "sonner";

const menuItems = [
  { icon: Bell, label: "Notificaciones", path: "/settings/notifications" },
  { icon: Shield, label: "Privacidad y seguridad", path: "/settings/privacy" },
  { icon: Heart, label: "Contactos de confianza", path: "/settings/contacts" },
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
      console.log("Profile Data:", data);
      return data;
    },
    enabled: !!user,
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
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
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
        {/* Profile Card */}
        <div className="bg-card rounded-2xl p-6 shadow-soft text-center">
          <div className="relative w-24 h-24 mx-auto mb-4 group">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-full rounded-full overflow-hidden border-4 border-background shadow-md relative"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-turquoise-light flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}

              {/* Overlay on hover/loading */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </div>
            </button>
          </div>

          <h2 className="text-xl font-display font-bold text-foreground">
            {profile?.display_name || user?.email?.split('@')[0] || "Usuario"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {profile?.occupation || "Explorador de consciencia"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Miembro desde {new Date(user?.created_at || Date.now()).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{profile?.streak_count || 0}</p>
              <p className="text-xs text-muted-foreground">Días racha</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">12</p> {/* Placeholder for Victories */}
              <p className="text-xs text-muted-foreground">Victorias</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">28</p> {/* Placeholder for Entries */}
              <p className="text-xs text-muted-foreground">Entradas</p>
            </div>
          </div>
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
            if (item.path === "/data") return true;
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
