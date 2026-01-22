import { ArrowLeft, User, Settings, Bell, Shield, Heart, LogOut, ChevronRight, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { SOSButton } from "@/components/layout/SOSButton";

const menuItems = [
  { icon: Bell, label: "Notificaciones", path: "/settings/notifications" },
  { icon: Shield, label: "Privacidad y seguridad", path: "/settings/privacy" },
  { icon: Heart, label: "Contactos de confianza", path: "/settings/contacts" },
  { icon: Settings, label: "Configuración", path: "/settings" },
];

const Profile = () => {
  const navigate = useNavigate();

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
              Mi Perfil
            </h1>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-card rounded-2xl p-6 shadow-soft text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-turquoise-light flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">
            Usuario
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Miembro desde enero 2024
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
            <div>
              <p className="text-2xl font-display font-bold text-foreground">7</p>
              <p className="text-xs text-muted-foreground">Días racha</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">12</p>
              <p className="text-xs text-muted-foreground">Victorias</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">28</p>
              <p className="text-xs text-muted-foreground">Entradas</p>
            </div>
          </div>
        </div>

        {/* Premium CTA */}
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

        {/* Menu Items */}
        <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 p-4 text-left hover:bg-muted/50 transition-colors ${
                index !== menuItems.length - 1 ? "border-b border-border" : ""
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
        <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
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
