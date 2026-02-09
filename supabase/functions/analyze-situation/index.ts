import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MAX_SITUATION_LENGTH = 2000;
const MIN_SITUATION_LENGTH = 10;

// Rate limiting constants
const RATE_LIMITS = {
  FREE: {
    hourly: 5,
    daily: 20,
  },
  PREMIUM: {
    hourly: 50,
    daily: 200,
  },
};

// AI Response validation schema (manual validation for Deno compatibility)
interface AIAnalysisResult {
  alert_level: "low" | "medium" | "high";
  summary: string;
  red_flags: string[];
  what_to_observe: string;
  recommended_tools: string[];
  action_plan: Array<{ step: number; action: string }>;
  validation_message: string;
}

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
    // eslint-disable-next-line no-control-regex
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

/**
 * Sanitize a string by removing potentially dangerous characters and limiting length
 */
function sanitizeString(str: unknown, maxLength: number): string {
  if (typeof str !== 'string') return '';
  // Remove control characters and limit length
  return str
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .slice(0, maxLength);
}

/**
 * Validate and sanitize AI response to prevent injection attacks
 */
function validateAndSanitizeAIResponse(result: unknown): { valid: boolean; sanitized?: AIAnalysisResult; error?: string } {
  if (!result || typeof result !== 'object') {
    return { valid: false, error: "AI response is not an object" };
  }

  const obj = result as Record<string, unknown>;

  // Validate alert_level
  const validAlertLevels = ['low', 'medium', 'high'];
  if (!validAlertLevels.includes(obj.alert_level as string)) {
    return { valid: false, error: "Invalid alert_level" };
  }

  // Validate and sanitize strings
  const summary = sanitizeString(obj.summary, 500);
  if (!summary) {
    return { valid: false, error: "Missing or invalid summary" };
  }

  const what_to_observe = sanitizeString(obj.what_to_observe, 500);
  const validation_message = sanitizeString(obj.validation_message, 300);

  // Validate and sanitize arrays
  const red_flags: string[] = [];
  if (Array.isArray(obj.red_flags)) {
    for (const flag of obj.red_flags.slice(0, 10)) {
      const sanitized = sanitizeString(flag, 200);
      if (sanitized) red_flags.push(sanitized);
    }
  }

  const recommended_tools: string[] = [];
  if (Array.isArray(obj.recommended_tools)) {
    for (const tool of obj.recommended_tools.slice(0, 10)) {
      const sanitized = sanitizeString(tool, 100);
      if (sanitized) recommended_tools.push(sanitized);
    }
  }

  // Validate and sanitize action_plan
  const action_plan: Array<{ step: number; action: string }> = [];
  if (Array.isArray(obj.action_plan)) {
    for (const item of obj.action_plan.slice(0, 10)) {
      if (typeof item === 'object' && item !== null) {
        const step = typeof (item as Record<string, unknown>).step === 'number'
          ? (item as Record<string, unknown>).step as number
          : action_plan.length + 1;
        const action = sanitizeString((item as Record<string, unknown>).action, 200);
        if (action) {
          action_plan.push({ step, action });
        }
      }
    }
  }

  return {
    valid: true,
    sanitized: {
      alert_level: obj.alert_level as "low" | "medium" | "high",
      summary,
      red_flags,
      what_to_observe,
      recommended_tools,
      action_plan,
      validation_message,
    }
  };
}

/**
 * Check if user has premium subscription
 */
async function checkPremiumStatus(
  supabaseClient: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('is_premium, premium_until')
    .eq('user_id', userId)
    .single();

  if (error || !profile) {
    return false;
  }

  const profileData = profile as { is_premium: boolean | null; premium_until: string | null };

  return (
    profileData.is_premium === true &&
    profileData.premium_until !== null &&
    new Date(profileData.premium_until) > new Date()
  );
}

/**
 * Check rate limits for user
 */
async function checkRateLimits(
  supabaseClient: SupabaseClient,
  userId: string,
  isPremium: boolean
): Promise<{ allowed: boolean; error?: string; retryAfter?: number }> {
  const limits = isPremium ? RATE_LIMITS.PREMIUM : RATE_LIMITS.FREE;
  const now = Date.now();
  const hourAgo = new Date(now - 3600000).toISOString();
  const dayAgo = new Date(now - 86400000).toISOString();

  // Check hourly limit
  const { count: hourlyCount, error: hourlyError } = await supabaseClient
    .from('scanner_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', hourAgo);

  if (hourlyError) {
    console.error("Error checking hourly rate limit:", hourlyError);
    // Allow on error to not block users
  } else if (hourlyCount !== null && hourlyCount >= limits.hourly) {
    const minutesRemaining = 60 - Math.floor((now % 3600000) / 60000);
    return {
      allowed: false,
      error: isPremium
        ? `Has alcanzado el límite de ${limits.hourly} análisis por hora. Intenta en ${minutesRemaining} minutos.`
        : `Límite gratuito alcanzado (${limits.hourly}/hora). Actualiza a Premium para más análisis o intenta en ${minutesRemaining} minutos.`,
      retryAfter: minutesRemaining * 60,
    };
  }

  // Check daily limit
  const { count: dailyCount, error: dailyError } = await supabaseClient
    .from('scanner_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', dayAgo);

  if (dailyError) {
    console.error("Error checking daily rate limit:", dailyError);
  } else if (dailyCount !== null && dailyCount >= limits.daily) {
    return {
      allowed: false,
      error: isPremium
        ? `Has alcanzado el límite de ${limits.daily} análisis por día. Vuelve mañana.`
        : `Límite diario gratuito alcanzado (${limits.daily}/día). Actualiza a Premium para más análisis.`,
    };
  }

  return { allowed: true };
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

    // Check premium status for rate limiting
    const isPremium = await checkPremiumStatus(supabaseClient, user.id);
    console.log(`User ${user.id.substring(0, 8)}... premium status: ${isPremium}`);

    // Check rate limits
    const rateLimitCheck = await checkRateLimits(supabaseClient, user.id, isPremium);
    if (!rateLimitCheck.allowed) {
      console.log(`Rate limit exceeded for user ${user.id.substring(0, 8)}...`);
      const headers: Record<string, string> = {
        ...corsHeaders,
        "Content-Type": "application/json",
      };
      if (rateLimitCheck.retryAfter) {
        headers["Retry-After"] = String(rateLimitCheck.retryAfter);
      }
      return new Response(
        JSON.stringify({
          error: rateLimitCheck.error,
          upgrade_available: !isPremium,
        }),
        { status: 429, headers }
      );
    }

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

    // Add timeout for AI request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error("AI request timed out");
        return new Response(
          JSON.stringify({ error: "La solicitud tardó demasiado. Intenta con una descripción más breve." }),
          { status: 408, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw error;
    }

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

    // Validate and sanitize the AI response
    const aiValidation = validateAndSanitizeAIResponse(analysisResult);
    if (!aiValidation.valid || !aiValidation.sanitized) {
      console.error("AI response validation failed:", aiValidation.error);
      return new Response(
        JSON.stringify({ error: "Error al procesar el análisis (respuesta inválida)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitizedAnalysis = aiValidation.sanitized;

    console.log(`Analysis completed successfully for user ${user.id.substring(0, 8)}...`);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: sanitizedAnalysis,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-situation error:", error);
    return new Response(
      JSON.stringify({ error: "Error desconocido. Por favor intenta de nuevo." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
