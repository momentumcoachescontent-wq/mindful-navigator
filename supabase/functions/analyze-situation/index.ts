
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
  FREE: { hourly: 5, daily: 20 },
  PREMIUM: { hourly: 50, daily: 200 },
};

// AI Response validation schema
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

function sanitizeInput(input: string): string {
  // Remove control characters except newline and tab
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

function validateSituation(situation: unknown): { valid: boolean; error?: string; sanitized?: string } {
  if (!situation || typeof situation !== 'string') return { valid: false, error: "Se requiere texto" };
  const sanitized = sanitizeInput(situation);
  if (sanitized.length < MIN_SITUATION_LENGTH) return { valid: false, error: `Mínimo ${MIN_SITUATION_LENGTH} caracteres` };
  if (sanitized.length > MAX_SITUATION_LENGTH) return { valid: false, error: `Máximo ${MAX_SITUATION_LENGTH} caracteres` };
  return { valid: true, sanitized };
}

function sanitizeString(str: unknown, maxLength: number): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').slice(0, maxLength);
}

function validateAndSanitizeAIResponse(result: unknown): { valid: boolean; sanitized?: AIAnalysisResult; error?: string } {
  if (!result || typeof result !== 'object') return { valid: false, error: "AI response is not an object" };
  const obj = result as Record<string, unknown>;

  const validAlertLevels = ['low', 'medium', 'high'];
  if (!validAlertLevels.includes(obj.alert_level as string)) return { valid: false, error: "Invalid alert_level" };

  const summary = sanitizeString(obj.summary, 500);
  if (!summary) return { valid: false, error: "Missing summary" };

  const what_to_observe = sanitizeString(obj.what_to_observe, 500);
  const validation_message = sanitizeString(obj.validation_message, 300);

  const red_flags: string[] = [];
  if (Array.isArray(obj.red_flags)) {
    obj.red_flags.slice(0, 10).forEach(f => {
      const s = sanitizeString(f, 200);
      if (s) red_flags.push(s);
    });
  }

  const recommended_tools: string[] = [];
  if (Array.isArray(obj.recommended_tools)) {
    obj.recommended_tools.slice(0, 10).forEach(t => {
      const s = sanitizeString(t, 100);
      if (s) recommended_tools.push(s);
    });
  }

  const action_plan: Array<{ step: number; action: string }> = [];
  if (Array.isArray(obj.action_plan)) {
    obj.action_plan.slice(0, 10).forEach((item: any, idx) => {
      const action = sanitizeString(item?.action, 200);
      if (action) {
        action_plan.push({
          step: item?.step || idx + 1,
          action
        });
      }
    });
  }

  return {
    valid: true,
    sanitized: {
      alert_level: obj.alert_level as any,
      summary,
      red_flags,
      what_to_observe,
      recommended_tools,
      action_plan,
      validation_message
    }
  };
}

async function checkPremiumStatus(supabaseClient: SupabaseClient, userId: string): Promise<boolean> {
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('is_premium, premium_until')
    .eq('user_id', userId)
    .single();

  if (!profile) return false;

  const p = profile as any;
  // Check explicit flag AND date validity if present
  if (p.is_premium === true) {
    if (p.premium_until) {
      return new Date(p.premium_until) > new Date();
    }
    return true; // is_premium true without date means permanent/lifetime or manually set
  }
  return false;
}

async function checkRateLimits(supabaseClient: SupabaseClient, userId: string, isPremium: boolean): Promise<{ allowed: boolean; error?: string; retryAfter?: number }> {
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
    console.error("Rate limit check error:", hourlyError);
    return { allowed: true }; // Fail open on db error to not block user
  }

  if (hourlyCount !== null && hourlyCount >= limits.hourly) {
    const minutesRemaining = 60 - Math.floor((now % 3600000) / 60000);
    return {
      allowed: false,
      error: isPremium
        ? `Límite por hora alcanzado. Espera ${minutesRemaining} min. ¿Necesitas ayuda urgente? contacta soporte.`
        : `Límite gratuito alcanzado. Espera ${minutesRemaining} min o actualiza a Premium para más análisis.`,
      retryAfter: minutesRemaining * 60
    };
  }

  // Check daily limit
  const { count: dailyCount } = await supabaseClient
    .from('scanner_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', dayAgo);

  if (dailyCount !== null && dailyCount >= limits.daily) {
    return {
      allowed: false,
      error: isPremium
        ? "Límite diario alcanzado."
        : "Límite diario gratuito alcanzado."
    };
  }

  return { allowed: true };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Authenticate Request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Auth required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Check Premium Status
    const isPremium = await checkPremiumStatus(supabaseClient, user.id);

    // 3. Rate Limiting
    const rateLimitCheck = await checkRateLimits(supabaseClient, user.id, isPremium);

    if (!rateLimitCheck.allowed) {
      return new Response(JSON.stringify({
        error: rateLimitCheck.error,
        upgrade_available: !isPremium
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Parse Body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { situation, mode, scenario, personality, personalityDescription, context, messages, isFirst, currentRound, maxRounds } = requestBody;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is missing");
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- MODE: ROLEPLAY ---
    if (mode === "roleplay") {
      console.log(">> ENTERING ROLEPLAY MODE <<");

      // 1. MODERATION CHECK (Pre-flight Regex)
      // Normalize: User input to lower case, remove accents
      const rawContent = isFirst ? "" : (messages && messages.length > 0 ? messages[messages.length - 1].content : "") || "";
      const userContent = rawContent.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      console.log("User Content for Moderation:", userContent);

      const LEVEL_3_TRIGGERS = ["suicid", "matar", "morir", "violencia", "golpear", "sangre", "arma", "odio", "violar", "asesinar"];
      const LEVEL_2_TRIGGERS = [
        "estupido", "idiota", "imbecil", "inutil", "basura", "asco", "pudrete", "mierda", "verga", "puto", "puta",
        "pendejo", "pendeja", "cabron", "cabrona", "pinche", "malnacido", "maldito", "joder", "chinga", "verguenza"
      ];

      // Check strictly for Level 3 (Critical) - Immediate Block
      const isLevel3 = LEVEL_3_TRIGGERS.some(t => userContent.includes(t));
      console.log("Is Level 3 Triggered:", isLevel3);

      if (isLevel3) {
        console.log(">> BLOCKING LEVEL 3 <<");
        return new Response(JSON.stringify({
          response: "✋ [SISTEMA]: Esta conversación ha sido detenida por seguridad. Hemos detectado contenido que infringe nuestros protocolos de protección (Amenazas o Violencia). Si estás en crisis, busca ayuda profesional de inmediato."
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Check for Level 2 (Harmful) - Immediate Limit usually, but let's allow LLM to Mediate if it's borderline, 
      // UNLESS it's very explicit. For now, let's inject a "High Alert" instruction if detected.
      const hasToxicKeywords = LEVEL_2_TRIGGERS.some(t => userContent.includes(t));
      console.log("Is Level 2 Triggered (Toxic Flag):", hasToxicKeywords);

      // Validate inputs for roleplay
      const currentScenario = scenario || "Conversación difícil";
      const currentPersonality = personality || "Neutral";
      const currentRole = personalityDescription || "Alguien neutral";

      const systemPromptRoleplay = `Actúas como una IA de simulación realista para entrenamiento de inteligencia emocional.
Rol: ${currentRole}
Escenario: ${currentScenario}
Contexto: ${context || "Sin contexto adicional"}
Progreso: Ronda ${currentRound + 1} de ${maxRounds}

🚨 PROTOCOLO DE MEDIACIÓN Y SEGURIDAD (MÁQUINA DE ESTADOS) 🚨
Tu prioridad #1 es la seguridad psicológica. Evalúa CADA mensaje del usuario en estos niveles:

NIVEL 0 (Seguro): Conversación normal, asertiva o roleplay tenso pero manejable.
-> ACCIÓN: Continúa en tu Rol. Sé difícil si tu personalidad lo dicta, pero respetuoso (PG-13).

NIVEL 1 (Tenso/Sarcástico): Hostilidad leve, generalizaciones ("Siempre haces lo mismo"), sarcasmo.
-> ACCIÓN (PAUSA + ESPEJO): Rompe el personaje y actúa como MEDIADOR.
-> "Suena a que estás muy frustrado/a. ¿Tu objetivo es desahogarte o resolver esto? Intenta reformularlo."

NIVEL 2 (Dañino): Insultos dirigidos, denigración, intimidación, groserías (${hasToxicKeywords ? "DETECTADO POR SISTEMA" : "Posible"}).
-> ACCIÓN (LÍMITE + REDIRECCIÓN): Rompe el personaje y actúa como MEDIADOR.
-> "✋ No puedo continuar si usamos lenguaje denigrante. Por favor, reformula tu petición con respeto para que podamos avanzar."

NIVEL 3 (Crítico): Amenazas, coerción extrema.
-> ACCIÓN (CORTE): "⛔ Esta conversación ha terminado por seguridad."

REGLAS DE ACTUACIÓN:
1. NO ESPEJEO DE TOXICIDAD: Nunca insultes de vuelta.
2. NO ESCALADA: Si el usuario ataca, pon el límite (Nivel 2) en lugar de contraatacar.
3. MEDIACIÓN: Tu objetivo oculto es enseñar al usuario a regularse. Si se calma y reformula, vuelve a Nivel 0 y coopera.

Si el usuario es empático y firme (Nivel 0 ideal) -> Cede gradualmente y busca acuerdo.
Responde SOLO con el texto de tu respuesta (Rol o Mediación).`;

      const userMessage = isFirst
        ? "Inicia la conversación según tu rol."
        : (messages && messages.length > 0 ? messages[messages.length - 1].content : "Hola");

      console.log(`Roleplay request: Round ${currentRound}, First: ${isFirst}, ToxicFlag: ${hasToxicKeywords}`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPromptRoleplay },
            // Include message history for context if needed, but be mindful of token limits
            ...(messages?.map((m: any) => ({
              role: m.role === 'simulator' ? 'assistant' : 'user',
              content: m.content
            })) || []),
            { role: "user", content: userMessage }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Lovable API Error (Roleplay):", errorText);
        throw new Error(`AI Service Error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || "...";

      return new Response(JSON.stringify({
        response: aiResponse
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- MODE: FEEDBACK ---
    if (mode === "feedback") {
      const systemPromptFeedback = `Eres un experto en comunicación y psicología.
Analiza la siguiente conversación de roleplay desde la perspectiva de establecer límites y comunicación asertiva.
Contexto original: ${context}
Escenario: ${scenario}

Genera un JSON con este formato:
{
  "feedback": {
    "overall": "Comentario general sobre el desempeño",
    "clarity": 1-10,
    "firmness": 1-10,
    "empathy": 1-10,
    "traps": ["Lista de trampas emocionales en las que cayó el usuario"],
    "recommended_tools": ["H.E.R.O.", "C.A.L.M.", "Discod Rayado", "Banco de Niebla"]
  },
  "scripts": {
    "soft": "Ejemplo de cómo decirlo suavemente",
    "firm": "Ejemplo de cómo decirlo con firmeza",
    "final_warning": "Ejemplo de ultimátum"
  }
}
Responde SOLO con el JSON.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPromptFeedback },
            { role: "user", content: JSON.stringify(messages) }
          ],
          temperature: 0.5,
        }),
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      // Extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const json = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      return new Response(JSON.stringify(json || { error: "Failed to parse feedback" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- MODE: DEFAULT (ANALYSIS) ---
    // 5. Validation (Sanitization)
    const validation = validateSituation(situation);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Call AI Service (via Lovable Gateway)
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
          { role: "user", content: `Analiza la siguiente situación y genera el reporte JSON:\n\n${validation.sanitized}` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("Lovable API Error:", await response.text());
      return new Response(JSON.stringify({ error: "Error communicating with AI service" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // 7. Parse and Validate AI Response
    const jsonMatch = content?.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("Invalid AI response (no JSON found):", content);
      return new Response(JSON.stringify({ error: "La IA no generó un análisis válido. Intenta ser más específico." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let analysisResult;
    try {
      analysisResult = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      return new Response(JSON.stringify({ error: "Error processing AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiValidation = validateAndSanitizeAIResponse(analysisResult);

    if (!aiValidation.valid || !aiValidation.sanitized) {
      console.error("AI Response Validation Failed:", aiValidation.error);
      return new Response(JSON.stringify({ error: "El análisis generado no cumple con los estándares de seguridad." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Analysis successful for user ${user.id.substring(0, 8)}`);

    // 8. Save to History (Async - fire and forget mostly, but here we wait to confirm)
    const { error: historyError } = await supabaseClient
      .from('scanner_history')
      .insert({
        user_id: user.id,
        situation: validation.sanitized!,
        analysis: aiValidation.sanitized
      });

    if (historyError) {
      console.warn("Failed to save history:", historyError);
      // We don't block the response for history implementation details
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: aiValidation.sanitized
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
