import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface ScanResultData {
  summary: string;
  alertLevel: "low" | "medium" | "high";
  redFlags: string[];
  observations: string;
  recommendedTools: { name: string; reason: string }[];
  actionPlan: { step: number; action: string }[];
  validationMessage: string;
}

interface AnalysisResponse {
  alert_level: "low" | "medium" | "high";
  summary: string;
  red_flags: string[];
  what_to_observe: string;
  recommended_tools: string[];
  action_plan: { step: number; action: string }[];
  validation_message: string;
}

export function useScanner() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScanResultData | null>(null);
  const [situationText, setSituationText] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const analyze = async (text: string): Promise<ScanResultData | null> => {
    setIsLoading(true);
    setSituationText(text);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-situation", {
        body: { situation: text },
      });

      if (error) {
        console.error("Scanner error:", error);
        toast({
          title: "Error al analizar",
          description: error.message || "No se pudo analizar la situación",
          variant: "destructive",
        });
        setIsLoading(false);
        return null;
      }

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        setIsLoading(false);
        return null;
      }

      const analysis: AnalysisResponse = data.analysis;

      // Transform the response to match our component's expected format
      const transformedResult: ScanResultData = {
        summary: analysis.summary,
        alertLevel: analysis.alert_level,
        redFlags: analysis.red_flags || [],
        observations: analysis.what_to_observe || "",
        recommendedTools: (analysis.recommended_tools || []).map((tool: string) => ({
          name: tool,
          reason: getToolReason(tool),
        })),
        actionPlan: analysis.action_plan || [],
        validationMessage: analysis.validation_message || "",
      };

      setResult(transformedResult);
      setIsLoading(false);
      return transformedResult;
    } catch (error) {
      console.error("Scanner error:", error);
      toast({
        title: "Error",
        description: "No se pudo conectar con el servicio de análisis",
        variant: "destructive",
      });
      setIsLoading(false);
      return null;
    }
  };

  const saveToHistory = async (scanResult: ScanResultData) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas una cuenta para guardar el análisis",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase.from("scanner_history").insert({
        user_id: user.id,
        situation_text: situationText,
        alert_level: scanResult.alertLevel,
        red_flags: scanResult.redFlags,
        recommended_tools: scanResult.recommendedTools.map((t) => t.name),
        action_plan: scanResult.actionPlan,
        ai_response: scanResult.summary,
      });

      if (error) throw error;

      toast({
        title: "Guardado",
        description: "El análisis se guardó en tu historial",
      });
      return true;
    } catch (error) {
      console.error("Error saving to history:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el análisis",
        variant: "destructive",
      });
      return false;
    }
  };

  const saveToJournal = async (scanResult: ScanResultData) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas una cuenta para guardar en el diario",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Create tags from alert level and valid red flags (cleaned)
      const safeTags = ["escáner", scanResult.alertLevel];
      if (scanResult.redFlags && Array.isArray(scanResult.redFlags)) {
        // Take first 3 red flags as tags to avoid overcrowding
        safeTags.push(...scanResult.redFlags.slice(0, 3).map(f => f.toLowerCase().replace(/[^a-z0-9áéíóúñ ]/g, '')));
      }

      const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

      const { data, error } = await supabase.from("journal_entries").insert({
        user_id: user.id,
        content: `**Situación analizada:**
${situationText}

**Nivel de Alerta:** ${scanResult.alertLevel.toUpperCase()}

**Resumen:**
${scanResult.summary}

**💡 Qué Observar:**
${scanResult.observations}

**🚩 Señales de alerta:**
${scanResult.redFlags.map(f => `- ${f}`).join("\n")}

**🛠️ Herramientas Recomendadas:**
${scanResult.recommendedTools.map(t => `- **${t.name}**: ${t.reason}`).join("\n")}

**📋 Plan de acción:**
${scanResult.actionPlan.map((p) => `${p.step}. ${p.action}`).join("\n")}

**💚 Mensaje de Apoyo:**
${scanResult.validationMessage}`,
        entry_type: "scanner_result",
        tags: safeTags,
        metadata: {
          title: `Análisis de la situación - ${dateStr}`,
          follow_up: true,
          alert_level: scanResult.alertLevel,
          red_flags: scanResult.redFlags,
          recommended_tools: scanResult.recommendedTools,
          action_plan: scanResult.actionPlan,
          progress: {
            actionPlan: scanResult.actionPlan.map(() => false),
            tools: scanResult.recommendedTools.map(() => false)
          }
        },
      }).select().single();

      if (error) throw error;

      toast({
        title: "Guardado en Diario",
        description: "El análisis se guardó en tu diario",
      });
      return data.id;
    } catch (error) {
      console.error("Error saving to journal:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar en el diario",
        variant: "destructive",
      });
      return null;
    }
  };

  const reset = () => {
    setResult(null);
    setSituationText("");
  };

  return {
    isLoading,
    result,
    analyze,
    saveToHistory,
    saveToJournal,
    reset,
  };
}

// Helper to provide reasons for recommended tools
function getToolReason(tool: string): string {
  const reasons: Record<string, string> = {
    "H.E.R.O.": "Para tomar decisiones conscientes y reconocer patrones",
    "C.A.L.M.": "Para regular emociones y mantener la calma",
    "Scripts de comunicación asertiva": "Para expresar límites con claridad",
    "Técnica del disco rayado": "Para mantener límites ante insistencia",
    "Respiración 4-7-8": "Para calmar el sistema nervioso rápidamente",
    "Grounding 5-4-3-2-1": "Para anclarte al presente cuando sientes ansiedad",
  };
  return reasons[tool] || "Herramienta recomendada para esta situación";
}
