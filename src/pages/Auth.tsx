import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Shield, Heart, Sparkles } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Email inválido").optional(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const [view, setView] = useState<"login" | "register" | "forgot" | "update_password">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { signIn, signUp, resetPassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user && view !== "update_password") {
      navigate("/");
    }
  }, [user, loading, navigate, view]);

  useEffect(() => {
    // Check if we are in a password recovery flow
    const hash = window.location.hash;
    const query = new URLSearchParams(window.location.search);

    if (query.get("type") === "recovery" || query.get("view") === "update_password" || hash.includes("type=recovery")) {
      setView("update_password");
    }
  }, []);

  const validateForm = () => {
    try {
      if (view === "login" || view === "register") {
        authSchema.parse({ email, password });
      } else if (view === "forgot") {
        z.object({ email: z.string().email("Email inválido") }).parse({ email });
      } else if (view === "update_password") {
        z.object({ password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres") }).parse({ password });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === "email") fieldErrors.email = err.message;
          if (err.path[0] === "password") fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    setIsLoading(true);

    try {
      if (view === "forgot") {
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Correo enviado",
            description: "Revisa tu bandeja de entrada para restablecer tu contraseña",
          });
          setView("login");
        }
        return;
      }

      if (view === "update_password") {
        const { error } = await supabase.auth.updateUser({ password: password });
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Contraseña actualizada",
            description: "Tu contraseña ha sido actualizada exitosamente",
          });
          setView("login");
          navigate("/");
        }
        return;
      }

      if (view === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Error de acceso",
              description: "Email o contraseña incorrectos",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "¡Bienvenido de vuelta!",
            description: "Has iniciado sesión correctamente",
          });
          navigate("/");
        }
      } else if (view === "register") {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "Usuario existente",
              description: "Este email ya está registrado. Intenta iniciar sesión.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "¡Cuenta creada!",
            description: "Tu cuenta ha sido creada exitosamente",
          });
          navigate("/onboarding");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />

      {/* Logo and title */}
      <div className="text-center mb-8 animate-slide-up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-4">
          <Shield className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Más Allá del Miedo
        </h1>
        <p className="text-muted-foreground mt-2">Tu coach de bolsillo</p>
      </div>

      <Card className="w-full max-w-md animate-slide-up" style={{ animationDelay: "100ms" }}>
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl">
            {view === "login" ? "Bienvenido de vuelta"
              : view === "register" ? "Crea tu cuenta"
                : view === "forgot" ? "Recuperar contraseña"
                  : "Actualizar contraseña"}
          </CardTitle>
          <CardDescription>
            {view === "login" ? "Ingresa tus datos para continuar"
              : view === "register" ? "Comienza tu viaje hacia el empoderamiento"
                : view === "forgot" ? "Ingresa tu email para recibir un enlace de recuperación"
                  : "Ingresa tu nueva contraseña"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {view !== "update_password" && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
            )}

            {view !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? "border-destructive pr-10" : "pr-10"}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
            )}

            {view === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setView("forgot")}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="animate-pulse">
                  Cargando...
                </span>
              ) : (
                <>
                  {view === "login" ? "Iniciar sesión"
                    : view === "register" ? "Crear cuenta"
                      : view === "forgot" ? "Enviar enlace"
                        : "Actualizar contraseña"}
                  <Sparkles className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setView(view === "login" ? "register" : "login");
                setErrors({});
              }}
              className="text-sm text-primary hover:underline"
            >
              {view === "login"
                ? "¿No tienes cuenta? Regístrate"
                : view === "register"
                  ? "¿Ya tienes cuenta? Inicia sesión"
                  : view === "update_password"
                    ? ""
                    : "Volver a Iniciar sesión"}
            </button>
          </div>

          {/* Features preview */}
          {view === "register" && (
            <div className="mt-6 pt-6 border-t border-border space-y-3">
              <p className="text-xs text-muted-foreground text-center mb-3">
                Al registrarte tendrás acceso a:
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="w-4 h-4 text-warmth" />
                <span>Escáner de situaciones con IA</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                <span>Diario guiado y seguimiento</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>Herramientas de empoderamiento</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center mt-6 max-w-sm">
        Esta app es un apoyo educativo y no reemplaza la ayuda profesional de emergencia.
      </p>
    </div>
  );
}
