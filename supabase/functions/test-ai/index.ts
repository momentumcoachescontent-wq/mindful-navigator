
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AIService } from "../_shared/ai-service.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { prompt, provider, systemPrompt } = await req.json();

        if (!prompt) {
            return new Response(JSON.stringify({ error: 'Prompt is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const aiService = new AIService();

        // Call the shared service
        // This will default to Gemini if provider is not specified and Gemini key is present
        const result = await aiService.generateText(prompt, systemPrompt, {
            provider: provider as 'gemini' | 'openai' | undefined
        });

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error("Test AI Error:", error);
        return new Response(JSON.stringify({
            error: (error as Error).message,
            stack: (error as Error).stack
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
