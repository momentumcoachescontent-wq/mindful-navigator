import { useState } from "react";
import { ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { SOSButton } from "@/components/layout/SOSButton";
import { ScannerInput } from "@/components/scanner/ScannerInput";
import { ScanResult, ScanResultData } from "@/components/scanner/ScanResult";

// Mock AI response - in production this would come from the backend
const mockAnalysis: ScanResultData = {
  summary: "Identificamos patrones de comunicación que podrían afectar tu bienestar emocional. Es importante reconocer estas dinámicas.",
  alertLevel: "medium",
  redFlags: [
    "Uso de frases que buscan generar inseguridad",
    "Patrón de comparación negativa",
    "Intento de aislar emocionalmente",
  ],
  observations: [
    "Presta atención a cómo te sientes después de estas conversaciones",
    "Observa si este patrón se repite en diferentes contextos",
    "Nota si hay momentos donde la comunicación es más respetuosa",
  ],
  recommendedTools: [
    { name: "H.E.R.O. Framework", reason: "Para reconocer patrones de manipulación" },
    { name: "C.A.L.M. Technique", reason: "Para regular tu respuesta emocional" },
    { name: "Scripts de Límites", reason: "Frases para establecer fronteras claras" },
  ],
  actionPlan: [
    "Esta semana, practica identificar cómo te sientes después de cada interacción",
    "Prepara una frase límite simple para usar la próxima vez",
    "Habla con alguien de confianza sobre lo que estás experimentando",
  ],
};

const Scanner = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScanResultData | null>(null);

  const handleSubmit = async (text: string) => {
    setIsLoading(true);
    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setResult(mockAnalysis);
    setIsLoading(false);
  };

  const handleReset = () => {
    setResult(null);
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
              onSaveToJournal={() => {
                // TODO: Implement save to journal
                console.log("Saving to journal");
              }}
              onCreatePlan={() => {
                // TODO: Implement create plan
                console.log("Creating plan");
              }}
            />
            <Button variant="ghost" className="w-full" onClick={handleReset}>
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
