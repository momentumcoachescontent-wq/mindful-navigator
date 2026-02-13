
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
    to: string;
    name: string;
    subject: string;
    html: string;
}

serve(async (req) => {
    // 1. CORS Preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // 2. Validate Env Vars
        if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.error("Missing Env Vars");
            return new Response(
                JSON.stringify({ error: "Server misconfiguration" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 3. Authenticate User (Security Patch) 🔒
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Auth required" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Invalid token" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 4. Parse Body
        const body: EmailRequest = await req.json();
        const { to, name, subject, html } = body;

        // Basic validation
        if (!to || !subject || !html) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 5. Send User-User Email via Resend (SYSTEM SENDER)
        // We use a system "from" address to prevent spoofing, setting Reply-To as the sender if needed, 
        // but here the use case is "App sending on behalf of user". 
        // Typically: from: "Mindful Support <no-reply@app.com>", reply_to: user.email

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Mindful Navigator <onboarding@resend.dev>",
                to: [to],
                subject: subject,
                html: html,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Resend API error:", data);
            return new Response(JSON.stringify({ error: data }), {
                status: res.status,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error sending email:", error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
