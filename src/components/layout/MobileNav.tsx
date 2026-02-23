import { Home, Users, User, ShoppingBag } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Inicio", path: "/" },
  { icon: ShoppingBag, label: "Tienda", path: "/shop" },
  { icon: Users, label: "Comunidad", path: "/community" },
  { icon: User, label: "Perfil", path: "/profile" },
];

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const hiddenRoutes = ["/auth", "/onboarding"];
  if (hiddenRoutes.includes(location.pathname) || location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-primary/20 safe-area shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 transition-transform duration-300",
                  isActive && "scale-110"
                )}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
