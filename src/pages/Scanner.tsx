import { useState } from "react";
import { ArrowLeft, Shield, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { SOSButton } from "@/components/layout/SOSButton";
import { ScannerInput } from "@/components/scanner/ScannerInput";
import ScanResult from "@/components/scanner/ScanResult";
import { useScanner } from "@/hooks/useScanner";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const Scanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLoading, result, analyze, saveToJournal, reset } = useScanner();
  const { toast } = useToast();

  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState("");

  const handleSubmit = async (text: string) => {
    setSavedEntryId(null); // Reset saved ID on new analysis
    try {
      await analyze(text);
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("anónima") || msg.includes("gratis") || msg.includes("Premium")) {
        setAuthModalMessage(msg);
        setShowAuthModal(true);
      } else {
        toast({
          title: "Error de conexión",
          description: msg || "El Oráculo no pudo responder en este momento.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveToJournal = async () => {
    if (result && !savedEntryId) {
      const id = await saveToJournal(result);
      if (id) setSavedEntryId(id);
    }
  };

  const handleCreatePlan = async () => {
    if (savedEntryId) {
      navigate(`/journal/${savedEntryId}`);
      return;
    }

    if (result) {
      const id = await saveToJournal(result);
      if (id) {
        setSavedEntryId(id);
        navigate(`/journal/${id}`);
      }
    }
  };

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
              El Oráculo
            </h1>
            <p className="text-xs text-muted-foreground">
              Revela la sombra que nubla tu camino
            </p>
          </div>
          <Shield className="w-8 h-8 text-primary" />
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {!result ? (
          <>
            {/* Info Card */}
            <div className="bg-charcoal border-2 border-[hsl(var(--turquoise)_/_0.3)] brutal-card rounded-none p-4">
              <p className="text-sm text-foreground leading-relaxed">
                <strong>La ceremonia inicia:</strong> Alimenta al Oráculo con una situación que drena tu energía. La niebla se disipará para revelar el patrón oculto y forjar tu arma de defensa.
              </p>
            </div>

            {/* Not logged in warning */}
            {!user && (
              <div className="bg-warmth/10 border border-warmth/30 rounded-2xl p-4 flex items-start gap-3">
                <Heart className="w-5 h-5 text-warmth flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-foreground">
                    <strong>Consejo:</strong> Inicia sesión para guardar tus análisis y
                    hacer seguimiento de tu progreso.
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-warmth"
                    onClick={() => navigate("/auth")}
                  >
                    Crear cuenta gratis →
                  </Button>
                </div>
              </div>
            )}

            {/* Scanner Input */}
            <ScannerInput onSubmit={handleSubmit} isLoading={isLoading} />

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center px-4">
              Este análisis es orientativo y no constituye un diagnóstico profesional.
              Si sientes que estás en peligro, busca ayuda profesional.
            </p>
          </>
        ) : (
          <>
            <ScanResult
              result={result}
              onSaveToJournal={handleSaveToJournal}
              onCreatePlan={handleCreatePlan}
            />

            {/* Validation message */}
            {result.validationMessage && (
              <div className="bg-success/10 border border-success/30 rounded-2xl p-4">
                <p className="text-sm text-foreground">
                  💚 {result.validationMessage}
                </p>
              </div>
            )}

            <Button variant="ghost" className="w-full brutal-btn text-muted-foreground hover:text-foreground mt-4" onClick={reset}>
              Consultar un nuevo ecos
            </Button>
          </>
        )}
      </main>

      <MobileNav />
      <SOSButton />

      {/* Auth/Registration Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md bg-card border-2 border-primary/20 brutal-card">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Límite del Oráculo
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              {authModalMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              className="w-full brutal-btn bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => navigate(authModalMessage.includes("Premium") ? "/premium" : "/auth")}
            >
              {authModalMessage.includes("Premium") ? "Desbloquear Premium" : "Crear cuenta gratis"}
            </Button>
            <Button
              variant="outline"
              className="w-full brutal-btn"
              onClick={() => setShowAuthModal(false)}
            >
              Quizás más tarde
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Scanner;
