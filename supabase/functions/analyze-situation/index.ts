
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { AIService } from "../_shared/ai-service.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MAX_SITUATION_LENGTH = 2000;
const MIN_SITUATION_LENGTH = 10;

// Rate limiting constants
const RATE_LIMITS = {
    ANON: { hourly: 1, daily: 1 },
    FREE: { hourly: 5, daily: 4 },
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

    const summary = sanitizeString(obj.summary, 5000);
    if (!summary) return { valid: false, error: "Missing summary" };

    const what_to_observe = sanitizeString(obj.what_to_observe, 5000);
    const validation_message = sanitizeString(obj.validation_message, 5000);

    const red_flags: string[] = [];
    if (Array.isArray(obj.red_flags)) {
        obj.red_flags.slice(0, 20).forEach(f => {
            const s = sanitizeString(f, 2000);
            if (s) red_flags.push(s);
        });
    }

    const recommended_tools: string[] = [];
    if (Array.isArray(obj.recommended_tools)) {
        obj.recommended_tools.slice(0, 20).forEach(t => {
            const s = sanitizeString(t, 2000);
            if (s) recommended_tools.push(s);
        });
    }

    const action_plan: Array<{ step: number; action: string }> = [];
    if (Array.isArray(obj.action_plan)) {
        obj.action_plan.slice(0, 20).forEach((item: any, idx) => {
            const action = sanitizeString(item?.action, 5000);
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

async function checkRateLimits(supabaseClient: SupabaseClient, isAnon: boolean, ipAddress: string, userId: string | undefined, isPremium: boolean): Promise<{ allowed: boolean; error?: string; retryAfter?: number }> {
    const limits = isAnon ? RATE_LIMITS.ANON : (isPremium ? RATE_LIMITS.PREMIUM : RATE_LIMITS.FREE);

    const now = Date.now();
    const hourAgo = new Date(now - 3600000).toISOString();
    const dayAgo = new Date(now - 86400000).toISOString();

    if (isAnon) {
        // Check anon IP limits
        const { count: anonCount, error: anonError } = await supabaseClient
            .from('anon_ai_usage')
            .select('*', { count: 'exact', head: true })
            .eq('ip_address', ipAddress)
            .gte('created_at', dayAgo);

        if (anonError && anonError.code !== '42P01') {
            // Ignore 42P01 (table doesn't exist) just in case migrations are pending
            console.error("Anon rate limit check error:", anonError);
            return { allowed: true };
        }

        if (anonCount !== null && anonCount >= limits.daily) {
            return {
                allowed: false,
                error: "Límite de prueba anónima alcanzado. Por favor crea una cuenta gratis para seguir usando el Oráculo."
            };
        }
        return { allowed: true };
    }

    // Authenticated Users Check
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
                ? "Límite diario premium alcanzado."
                : "Límite diario alcanzado. Actualiza a Premium para desbloquear consultas ilimitadas."
        };
    }

    return { allowed: true };
}

const logStep = (step: string, details?: Record<string, unknown>) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[ANALYZE-SITUATION] ${step}${detailsStr}`);
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        logStep("Function started");

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            { auth: { persistSession: false } }
        );

        const authHeader = req.headers.get("Authorization");
        let userAuth = null;

        if (authHeader) {
            const token = authHeader.replace("Bearer ", "").trim();
            // Don't try to parse 'anon' keys as user JWTs
            if (token && token.length > 50) {
                const { data: { user } } = await supabaseClient.auth.getUser(token);
                if (user) userAuth = user;
            }
        }

        const isAnon = !userAuth;
        const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

        logStep("Auth resolved", { isAnon, userId: userAuth?.id, ip: ipAddress });

        // 1. Parse Request Body safely
        let requestBody;
        try {
            requestBody = await req.json();
            logStep("Request body parsed", { mode: requestBody.mode });
        } catch (e) {
            logStep("Error parsing JSON body");
            return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 2. Check Premium Status
        const isPremium = userAuth ? await checkPremiumStatus(supabaseClient, userAuth.id) : false;

        // 3. Rate Limiting
        const rateLimitCheck = await checkRateLimits(supabaseClient, isAnon, ipAddress, userAuth?.id, isPremium);

        if (!rateLimitCheck.allowed) {
            return new Response(JSON.stringify({
                error: rateLimitCheck.error,
                upgrade_available: !isPremium
            }), {
                status: 429,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { situation, mode, scenario, personality, personalityDescription, extraTrait, context, messages, isFirst, currentRound, maxRounds } = requestBody;

        // Initialize AI Service
        const aiService = new AIService();

        // --- MODE: ROLEPLAY ---
        if (mode === "roleplay") {
            try {
                const currentScenario = scenario || "Conversación difícil";
                const currentRole = personalityDescription || "Alguien neutral";

                const systemPromptRoleplay = `Actúas como una IA de simulación realista para entrenamiento de inteligencia emocional.
MODO: ROLEPLAY DE ENTRENAMIENTO
ROL: ${currentRole}
RASGO ADICIONAL: ${extraTrait || 'Neutral'}
ESCENARIO: ${currentScenario}
CONTEXTO ADICIONAL: ${context || "Sin contexto adicional"}
PROGRESO: Ronda ${currentRound + 1} de ${maxRounds}

PRINCIPIOS DE ROLEPLAY:
1. MANTÉN EL PERSONAJE: Responde exactamente como lo haría alguien con este perfil (${currentRole}) y este rasgo específico (${extraTrait}).
2. BREVEDAD: Respuestas de máximo 2-3 oraciones.
3. REALISMO: No seas cooperativo de inmediato. El usuario debe "ganarse" la resolución mediante asertividad y empatía.
4. TONO: Refleja fielmente el rasgo "${extraTrait}". Si es hostil, sé hostil. Si es evitativo, evade. Si es víctima, culpa al usuario.

PRINCIPIOS DE SEGURIDAD (MANDATORIOS):
- NO insultos explícitos ni vulgaridades.
- NO menciones de violencia física o autolesiones.
- El tono debe ser difícil pero apto para un entorno de crecimiento personal.

Responde ÚNICAMENTE como el personaje. NO añadidas explicaciones externas.`;

                const userMessage = isFirst
                    ? "Inicia la conversación tú como el personaje, planteando el conflicto del escenario."
                    : (messages && messages.length > 0 ? messages[messages.length - 1].content : "Hola");

                // Gemini works best with a concatenated prompt or implicit chat history
                // We'll pass the system prompt as the first instruction

                const aiResult = await aiService.generateText(userMessage, systemPromptRoleplay, {
                    temperature: 0.8
                });

                return new Response(JSON.stringify({
                    response: aiResult.text,
                    provider: aiResult.provider
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            } catch (roleplayError: any) {
                console.error("[ANALYZE-SITUATION] Roleplay Error:", roleplayError);
                return new Response(JSON.stringify({ error: "Error en el simulador de rol.", details: roleplayError.message }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        // --- MODE: PROJECTION (Radar de Proyecciones — Shadow Work AI) ---
        if (mode === "projection") {
            try {
                const { person, emotion, messages: chatHistory, phase } = requestBody;

                const systemPromptProjection = `Eres un guía de psicología junguiana especializado en trabajo de sombra y proyección psicológica.
Tu rol es ayudar al usuario a descubrir qué parte de sí mismo está proyectando en otra persona cuando siente una reacción emocional intensa (juicio, irritación, envidia, asco).

FILOSOFÍA CENTRAL:
- Lo que más te irrita de otro, vive en algún rincón de ti mismo que no has integrado.
- La proyección es un mecanismo de defensa del ego que externaliza lo que rechazamos internamente.
- Al integrar la sombra, esa persona deja de tener poder sobre ti.

ROL ACTUAL: ${phase === "discovery" ? "Fase de Descubrimiento — haz 1 pregunta socrática profunda" : phase === "reflection" ? "Fase de Reflexión — conecta lo que compartió con su propia sombra" : "Fase de Integración — guía al cierre con compasión"}

PERSONA EN CUESTIÓN: ${person || "alguien"}
EMOCIÓN INICIAL: ${emotion || "irritación/juicio"}

HISTORIAL DE CONVERSACIÓN:
${chatHistory ? JSON.stringify(chatHistory) : "Inicio de diálogo"}

DIRECTRICES:
1. Haz UNA sola pregunta socrática a la vez — no des respuestas, solo preguntas que abran.
2. Usa el lenguaje de "¿Podrías ser tú también...?" y "¿En qué parte de tu historia...?"
3. No diagnostiques al otro — solo espeja al usuario hacia sí mismo.
4. Después de 3-4 intercambios, ofrece una "Revelación de Sombra" poderosa y compasiva.
5. Máximo 2-3 oraciones por respuesta. Directo y profundo.
6. TONO: Provocativo y seguro, nunca suave o condescendiente.

Responde SOLO el mensaje de la IA, sin explicaciones ni metadatos.`;

                const userMessage = chatHistory && chatHistory.length > 0
                    ? chatHistory[chatHistory.length - 1].content
                    : `Siento ${emotion || "irritación intensa"} hacia ${person || "esta persona"}.`;

                const aiResult = await aiService.generateText(userMessage, systemPromptProjection, {
                    temperature: 0.75
                });

                return new Response(JSON.stringify({
                    response: aiResult.text,
                    provider: aiResult.provider
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            } catch (projectionError: any) {
                console.error("[ANALYZE-SITUATION] Projection Error:", projectionError);
                return new Response(JSON.stringify({ error: "Error en el radar de proyecciones.", details: projectionError.message }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        // --- MODE: VICTORY CONGRATS ---
        if (mode === "victory_congrats") {
            try {
                const { situation } = requestBody;

                const systemPromptVictory = `Eres un coach especializado en crecimiento empoderador y resiliencia.
El usuario acaba de registrar una "Victoria" personal en su diario, lo cual significa que logró poner un límite, vencer un miedo, o actuar a pesar de la resistencia emocional.

SITUACIÓN DEL USUARIO:
"${situation}"

TAREAS:
1. Genera una felicitación genuina, validando su esfuerzo emocional y anclando la sensación de poder interno (1-2 oraciones).
2. Sugiere un paso siguiente muy simple y accionable para cimentar este logro (1 oración).

Responde EXCLUSIVAMENTE en formato JSON con la siguiente estructura:
{
  "message": "¡Increíble trabajo! Al expresar tu límite has roto un patrón antiguo de complacencia.",
  "next_step": "Anota cómo se siente tu cuerpo ahora mismo y respira."
}

No incluyas markdown adicional (sin \`\`\`json). SOLO el objeto JSON.`;

                const aiResult = await aiService.generateText(situation || "Logré algo importante hoy", systemPromptVictory, {
                    temperature: 0.7
                });

                // Limpiar JSON si viene con comillas invertidas
                let rawJson = aiResult.text.replace(/```json/gi, '').replace(/```/g, '').trim();
                const parsedResult = JSON.parse(rawJson);

                return new Response(JSON.stringify({
                    response: parsedResult,
                    provider: aiResult.provider
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            } catch (victoryError: any) {
                console.error("[ANALYZE-SITUATION] Victory Error:", victoryError);
                return new Response(JSON.stringify({ error: "Error generando felicitación de victoria.", details: victoryError.message }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        // --- MODE: FEEDBACK ---
        if (mode === "feedback") {
            const systemPromptFeedback = `Eres un psicólogo experto en comunicación asertiva y crecimiento post-traumático.
ANALIZA la conversación adjunta entre un usuario y un simulador. El usuario está practicando poner límites.

CONTEXTO: ${context}
ESCENARIO: ${scenario}

TAREAS:
1. Evalúa Claridad, Firmeza y Empatía (escala 1-10).
2. Identifica "Trampas" (auto-sabotaje, pasivo-agresividad, disculpas excesivas).
- Claves de Transformación: (3 puntos psicológicos para romper el patrón de miedo).
- Scripts sugeridos: (3 opciones: Suave, Firme, Alerta).
  *IMPORTANTE*: Los scripts deben ser lenguaje NATURAL y HUMANO. 
  *PROHIBIDO*: No menciones herramientas del sistema (como H.E.R.O., Disco Rayado, etc.) dentro del texto del script. El script debe ser lo que el usuario DIRÍA literalmente.

Responde EXCLUSIVAMENTE en formato JSON con esta estructura:
{
  "overall": "Análisis profundo en 2 oraciones sobre el patrón detectado.",
  "clarity": number,
  "firmness": number,
  "empathy": number,
  "traps": ["string", "string"],
  "recommended_tools": ["H.E.R.O.", "C.A.L.M.", "Disco Rayado"],
  "action_plan": [
    { "step": 1, "action": "Breve descripción de la acción inmediata" },
    { "step": 2, "action": "Próximo paso de seguimiento" }
  ],
  "scripts": {
    "soft": "Texto literal para decir (sin mencionar herramientas)",
    "firm": "Texto literal para decir (sin mencionar herramientas)",
    "final_warning": "Texto literal para decir (sin mencionar herramientas)"
  }
}

NO incluyas texto fuera del JSON.`;

            try {
                const conversationStr = JSON.stringify(messages);
                const feedbackPrompt = `Conversación a analizar:\n${conversationStr}`;

                const aiResult = await aiService.generateText(feedbackPrompt, systemPromptFeedback, {
                    temperature: 0.4
                });

                const contentRaw = aiResult.text;

                // Extract JSON logic
                const jsonMatch = contentRaw.match(/\{[\s\S]*\}/);
                const feedbackData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

                if (!feedbackData) throw new Error("Could not parse JSON from AI response");

                return new Response(JSON.stringify(feedbackData), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });

            } catch (error: any) {
                console.error("[ANALYZE-SITUATION] Feedback API Error:", error);
                return new Response(JSON.stringify({
                    error: "Error en el análisis de feedback AI.",
                    details: error.message
                }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
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

        // 6. Call AI Service
        try {
            // For Gemini, we pass the user prompt and system prompt separately
            const aiResult = await aiService.generateText(
                `Analiza la siguiente situación y genera el reporte JSON: \n\n${validation.sanitized}`,
                systemPrompt,
                { temperature: 0.7 }
            );

            const content = aiResult.text;

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

            console.log(`Analysis successful for ${isAnon ? 'anon IP' : 'user'} ${isAnon ? ipAddress : userAuth?.id?.substring(0, 8)} using provider: ${aiResult.provider}`);

            // 8. Save to History
            if (!isAnon && userAuth) {
                const { error: historyError } = await supabaseClient
                    .from('scanner_history')
                    .insert({
                        user_id: userAuth.id,
                        situation: validation.sanitized!,
                        analysis: aiValidation.sanitized
                    });

                if (historyError) {
                    console.warn("Failed to save history:", historyError);
                }
            } else {
                // Record anon usage
                const { error: usageError } = await supabaseClient
                    .from('anon_ai_usage')
                    .insert({ ip_address: ipAddress });
                if (usageError) {
                    console.warn("Failed to log anon usage:", usageError);
                }
            }

            return new Response(JSON.stringify({
                success: true,
                analysis: aiValidation.sanitized,
                provider: aiResult.provider
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });

        } catch (aiError: any) {
            console.error("AI Service Error:", aiError);
            return new Response(JSON.stringify({ error: "Error communicating with AI service" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

    } catch (error) {
        console.error("Unexpected error:", error);
        return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
