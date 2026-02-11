import { useState } from "react";
import { ArrowLeft, Shield, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { SOSButton } from "@/components/layout/SOSButton";
import { ScannerInput } from "@/components/scanner/ScannerInput";
import { ScanResult } from "@/components/scanner/ScanResult";
import { useScanner } from "@/hooks/useScanner";
import { useAuth } from "@/contexts/AuthContext";

const Scanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLoading, result, analyze, saveToJournal, reset } = useScanner();
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);

  const handleSubmit = async (text: string) => {
    setSavedEntryId(null); // Reset saved ID on new analysis
    await analyze(text);
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
              Escáner de Situaciones
            </h1>
            <p className="text-xs text-muted-foreground">
              Analiza y entiende dinámicas difíciles
            </p>
          </div>
          <Shield className="w-8 h-8 text-primary" />
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {!result ? (
          <>
            {/* Info Card */}
            <div className="bg-turquoise-soft rounded-2xl p-4">
              <p className="text-sm text-secondary leading-relaxed">
                <strong>¿Cómo funciona?</strong> Describe una situación que te preocupa
                y recibirás un análisis con señales de alerta, observaciones y
                herramientas recomendadas.
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
              result={{
                ...result,
                observations: result.observations
                  ? [result.observations]
                  : [],
                actionPlan: result.actionPlan.map(p => p.action),
              }}
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

            <Button variant="ghost" className="w-full" onClick={reset}>
              Analizar otra situación
            </Button>
          </>
        )}
      </main>

      <MobileNav />
      <SOSButton />
    </div>
  );
};

export default Scanner;
