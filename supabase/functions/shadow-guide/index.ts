import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple AI call via OpenAI compatible API
async function callAI(systemPrompt: string, userMessage: string): Promise<string> {
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

    // Try OpenAI first
    if (openaiKey) {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openaiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage },
                ],
                temperature: 0.8,
            }),
        });
        if (resp.ok) {
            const data = await resp.json();
            return data.choices?.[0]?.message?.content || "";
        }
    }

    // Fallback to Anthropic
    if (anthropicKey) {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": anthropicKey,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-3-haiku-20240307",
                system: systemPrompt,
                messages: [{ role: "user", content: userMessage }],
            }),
        });
        if (resp.ok) {
            const data = await resp.json();
            return data.content?.[0]?.text || "";
        }
    }

    throw new Error("No AI provider available. Configure OPENAI_API_KEY or ANTHROPIC_API_KEY.");
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Auth check
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "No authorization header" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const body = await req.json();
        const { person, emotion, messages = [], phase = "discovery" } = body;

        if (!person || !emotion) {
            return new Response(JSON.stringify({ error: "person and emotion are required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Build phase-specific instruction
        const phaseInstruction =
            phase === "discovery"
                ? "Haz UNA sola pregunta socrática que invite al usuario a reconocer algo de sí mismo en la persona que describe."
                : phase === "reflection"
                    ? "Conecta lo que compartió con la sombra interna del usuario. Haz UNA sola pregunta que profundice la auto-observación."
                    : "Ofrece una revelación de sombra poderosa y compasiva. Nombra el patrón proyectado con claridad y sin juicio.";

        const systemPrompt = `Eres un guía de psicología junguiana especializado en trabajo de sombra.

PERSONA EN CUESTIÓN: ${person}
EMOCIÓN DISPARADORA: ${emotion}
FASE ACTUAL: ${phaseInstruction}

REGLAS ABSOLUTAS:
1. Responde con UNA sola frase o pregunta. Máximo 2 oraciones.
2. NO des consejos. NO diagnostiques al otro. Solo espeja al usuario.
3. Usa preguntas como: "¿En qué momento de tu vida tú también...?", "¿Qué parte de ti desearía...?", "¿Reconoces en ti...?"
4. Tono: directo, cálido, sin miedo. Nunca condescendiente.
5. Responde SOLO en español.`;

        // Build conversation context
        const conversationHistory = messages.length > 0
            ? "\n\nCONVERSACIÓN PREVIA:\n" + messages.map((m: { role: string; content: string }) =>
                `${m.role === "user" ? "Usuario" : "Guía"}: ${m.content}`
            ).join("\n")
            : "";

        const userMessage = messages.length > 0
            ? messages[messages.length - 1]?.content || `Siento ${emotion} hacia ${person}`
            : `Siento ${emotion} hacia ${person}. Empieza el diálogo de sombra.`;

        const fullPrompt = systemPrompt + conversationHistory;
        const aiResponse = await callAI(fullPrompt, userMessage);

        if (!aiResponse) {
            throw new Error("AI returned empty response");
        }

        return new Response(JSON.stringify({ response: aiResponse }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("[shadow-guide] Error:", err);
        return new Response(
            JSON.stringify({ error: err.message || "Internal server error" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
