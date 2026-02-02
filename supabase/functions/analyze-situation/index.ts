import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MAX_SITUATION_LENGTH = 2000;
const MIN_SITUATION_LENGTH = 10;

const systemPrompt = `Eres un coach de apoyo emocional especializado en identificar señales de alerta en relaciones y situaciones interpersonales. Tu rol es ayudar a las personas a reconocer patrones de manipulación, abuso emocional, y comportamientos problemáticos.

IMPORTANTE:
- NO proporcionas diagnósticos médicos ni legales
- NO reemplazas ayuda profesional de emergencia
- Eres un apoyo educativo y de orientación

Para cada situación que analices, debes responder en formato JSON válido con esta estructura exacta:
{
  "alert_level": "low" | "medium" | "high",
  "summary": "Resumen claro de la situación en 2-3 oraciones",
  "red_flags": ["Lista de señales de alerta identificadas"],
  "what_to_observe": "Qué patrones o comportamientos observar a futuro",
  "recommended_tools": ["H.E.R.O.", "C.A.L.M.", etc.],
  "action_plan": [
    {"step": 1, "action": "Primera acción concreta"},
    {"step": 2, "action": "Segunda acción concreta"},
    {"step": 3, "action": "Tercera acción concreta"}
  ],
  "validation_message": "Mensaje de validación emocional y apoyo"
}

HERRAMIENTAS DISPONIBLES que puedes recomendar:
- H.E.R.O. (Hacer pausa, Evaluar, Responder, Observar): Para tomar decisiones conscientes
- C.A.L.M. (Calma, Analiza, Limita, Muévete): Para regular emociones intensas
- Scripts de comunicación asertiva: Para expresar límites
- Técnica del disco rayado: Para mantener límites firmes
- Respiración 4-7-8: Para calmar el sistema nervioso
- Grounding 5-4-3-2-1: Para anclarse al presente

SEÑALES DE ALERTA A IDENTIFICAR:
- Gaslighting (hacer dudar de la propia percepción)
- Love bombing (exceso de atención inicial)
- Aislamiento de amigos/familia
- Control excesivo (horarios, ropa, amistades)
- Minimización de sentimientos
- Culpabilización constante
- Amenazas veladas o directas
- Invalidación emocional
- Triangulación (usar a terceros)
- Ciclos de idealización/devaluación

NIVELES DE ALERTA:
- LOW: Situación incómoda pero manejable, sin patrones claros de abuso
- MEDIUM: Señales de alerta presentes, requiere atención y posibles límites
- HIGH: Múltiples red flags, posible situación de riesgo, considerar apoyo profesional

Responde SOLO con el JSON, sin texto adicional antes o después.`;

/**
 * Sanitize user input by removing control characters and trimming
 */
function sanitizeInput(input: string): string {
  // Remove control characters (except newlines and tabs which are valid in text)
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Validate the situation input
 */
function validateSituation(situation: unknown): { valid: boolean; error?: string; sanitized?: string } {
  if (!situation || typeof situation !== 'string') {
    return { valid: false, error: "Se requiere una descripción de la situación (texto)" };
  }

  const sanitized = sanitizeInput(situation);

  if (sanitized.length < MIN_SITUATION_LENGTH) {
    return { valid: false, error: `La descripción debe tener al menos ${MIN_SITUATION_LENGTH} caracteres` };
  }

  if (sanitized.length > MAX_SITUATION_LENGTH) {
    return { valid: false, error: `La descripción no puede exceder ${MAX_SITUATION_LENGTH} caracteres` };
  }

  return { valid: true, sanitized };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Se requiere autenticación" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client for auth verification
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase configuration missing");
      return new Response(
        JSON.stringify({ error: "Configuración del servicio incorrecta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    // Verify the user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Token de autenticación inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Authenticated user: ${user.id.substring(0, 8)}...`);

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Formato de solicitud inválido (JSON esperado)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { situation } = requestBody;
    
    // Validate input
    const validation = validateSituation(situation);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitizedSituation = validation.sanitized!;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Servicio de análisis no configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${user.id.substring(0, 8)}... analyzing situation (${sanitizedSituation.length} chars)`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analiza esta situación y responde en JSON:\n\n${sanitizedSituation}` },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo en unos momentos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Servicio temporalmente no disponible." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Error al analizar la situación" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in response:", data);
      return new Response(
        JSON.stringify({ error: "Respuesta vacía del análisis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response from the AI
    let analysisResult;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Error al procesar el análisis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analysis completed successfully for user ${user.id.substring(0, 8)}...`);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        raw_response: content
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-situation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
