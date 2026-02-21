
// GoogleGenerativeAI SDK removed - using REST API directly

export interface AIConfig {
    provider?: 'gemini' | 'openai';
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface AIResponse {
    text: string;
    provider: string;
    model: string;
}

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export class AIService {
    private geminiKey: string | undefined;
    private openAIKey: string | undefined;

    constructor() {
        this.geminiKey = Deno.env.get('GEMINI_API_KEY');
        this.openAIKey = Deno.env.get('OPENAI_API_KEY');
    }

    async generateText(
        prompt: string,
        systemPrompt?: string,
        config: AIConfig = {}
    ): Promise<AIResponse> {
        // 1. Determine Provider (Default to Gemini if available)
        const provider = config.provider || (this.geminiKey ? 'gemini' : 'openai');

        if (provider === 'gemini') {
            return this.generateWithGemini(prompt, systemPrompt, config);
        } else {
            return this.generateWithOpenAI(prompt, systemPrompt, config);
        }
    }

    private async generateWithGemini(
        prompt: string,
        systemPrompt?: string,
        config: AIConfig
    ): Promise<AIResponse> {
        if (!this.geminiKey) {
            console.warn("Gemini Key missing, falling back to OpenAI");
            return this.generateWithOpenAI(prompt, systemPrompt, config);
        }

        const modelName = config.model || 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.geminiKey}`;

        // Construct contents
        const contents = [];
        if (systemPrompt) {
            contents.push({ role: 'user', parts: [{ text: `System Instruction: ${systemPrompt}` }] });
            // Gemini often expects a model response after a user message if we want to simulate system prompt effectively in chat history, 
            // but for simple generation, concatenating or using system_instruction field (if supported) is better.
            // v1beta supports system_instruction.
        }
        contents.push({ role: 'user', parts: [{ text: prompt }] });

        const body: any = {
            contents: contents,
            generationConfig: {
                temperature: config.temperature || 0.7,
                maxOutputTokens: config.maxTokens,
            }
        };

        // Use system_instruction if systemPrompt is present (cleaner than concatenation)
        if (systemPrompt) {
            body.system_instruction = {
                parts: [{ text: systemPrompt }]
            };
            // Reset contents to just the user prompt
            body.contents = [{ role: 'user', parts: [{ text: prompt }] }];
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            // Extract text
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error('Gemini response missing text');
            }

            return {
                text: text,
                provider: 'gemini',
                model: modelName
            };
        } catch (error) {
            console.error("Gemini Error:", error);
            // Fallback to OpenAI if Gemini fails and OpenAI key is available
            if (this.openAIKey) {
                console.warn("Gemini failed, falling back to OpenAI:", (error as Error).message);
                return this.generateWithOpenAI(prompt, systemPrompt, config);
            }
            throw error;
        }
    }

    private async generateWithOpenAI(
        prompt: string,
        systemPrompt?: string,
        config: AIConfig
    ): Promise<AIResponse> {
        if (!this.openAIKey) {
            throw new Error("Missing OPENAI_API_KEY");
        }

        const model = config.model || 'gpt-4o-mini';

        const messages = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: prompt });

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openAIKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: config.temperature || 0.7,
                max_tokens: config.maxTokens,
            }),
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(`OpenAI Error: ${data.error.message}`);
        }

        return {
            text: data.choices[0].message.content,
            provider: 'openai',
            model: model
        };
    }

    // Utils for HTTP responses
    static createResponse(body: any, status = 200) {
        return new Response(JSON.stringify(body), {
            status,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
    }

    static handleOptions() {
        return new Response('ok', { headers: CORS_HEADERS });
    }
}
