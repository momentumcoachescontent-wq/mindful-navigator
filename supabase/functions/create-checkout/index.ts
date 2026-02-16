import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // 0. LOG: Request Received
    console.log(`[DEBUG] Request method: ${req.method}`);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const bodyText = await req.text();
        console.log(`[DEBUG] Request Body: ${bodyText}`);

        let bodyJson;
        try {
            bodyJson = JSON.parse(bodyText);
        } catch (e) {
            throw new Error("Invalid JSON body");
        }

        const { productId, successUrl, cancelUrl } = bodyJson;

        if (!productId) {
            throw new Error("Missing productId");
        }

        // 1. Env Var Check
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        console.log(`[DEBUG] Env Check - URL: ${!!supabaseUrl}, Key: ${!!supabaseServiceKey}`);

        const supabaseAdmin = createClient(
            supabaseUrl ?? "",
            supabaseServiceKey ?? ""
        );

        // 2. Fetch Stripe Config
        console.log("[DEBUG] Fetching Payment Config...");
        const { data: config, error: configError } = await supabaseAdmin
            .from("payment_configs")
            .select("secret_key, is_active")
            .eq("provider", "stripe")
            .single();

        if (configError) {
            console.error("[DEBUG] Config DB Error:", configError);
            throw new Error(`DB Error for Config: ${configError.message}`);
        }

        console.log(`[DEBUG] Config Found - Active: ${config?.is_active}, Key Length: ${config?.secret_key?.length}`);

        if (!config?.secret_key) {
            throw new Error("Stripe Secret Key is missing in DB");
        }

        // 3. Fetch Product
        console.log(`[DEBUG] Fetching Product ${productId}...`);
        const { data: product, error: productError } = await supabaseAdmin
            .from("products")
            .select("*")
            .eq("id", productId)
            .single();

        if (productError) {
            console.error("[DEBUG] Product DB Error:", productError);
            throw new Error(`DB Error for Product: ${productError.message}`);
        }

        if (!product) {
            throw new Error("Product not found");
        }

        // 4. Call Stripe API
        console.log("[DEBUG] Preparing Stripe API call...");
        const params = new URLSearchParams();
        params.append("payment_method_types[]", "card");
        params.append("mode", "payment");
        params.append("success_url", successUrl || `${req.headers.get('origin')}/shop?success=true`);
        params.append("cancel_url", cancelUrl || `${req.headers.get('origin')}/shop?canceled=true`);
        params.append("line_items[0][price_data][currency]", product.currency || "mxn");
        params.append("line_items[0][price_data][product_data][name]", product.title);
        params.append("line_items[0][price_data][unit_amount]", Math.round(product.price * 100).toString());
        params.append("line_items[0][quantity]", "1");
        params.append("metadata[productId]", product.id);

        console.log("[DEBUG] Sending request to Stripe...");
        const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${config.secret_key}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        const stripeData = await stripeResponse.json();
        console.log(`[DEBUG] Stripe Response Status: ${stripeResponse.status}`);

        if (!stripeResponse.ok) {
            console.error("[DEBUG] Stripe Error Data:", JSON.stringify(stripeData));
            throw new Error(`Stripe API: ${stripeData.error?.message || "Unknown error"}`);
        }

        return new Response(JSON.stringify({ url: stripeData.url }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("[DEBUG] FINAL CATCH:", error);
        return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
