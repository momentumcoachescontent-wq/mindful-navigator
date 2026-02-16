import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { productId, successUrl, cancelUrl } = await req.json();

        if (!productId) {
            throw new Error("Missing productId");
        }

        // 1. Env Var Check
        const supabaseUrl = Deno.env.get("APP_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("APP_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        const supabaseAdmin = createClient(
            supabaseUrl ?? "",
            supabaseServiceKey ?? ""
        );

        // 2. Fetch Stripe Config
        const { data: config, error: configError } = await supabaseAdmin
            .from("payment_configs")
            .select("secret_key, is_active")
            .eq("provider", "stripe")
            .single();

        if (configError || !config?.secret_key) {
            throw new Error("Stripe Secret Key is missing in DB");
        }

        // 3. Fetch Product (including 'interval' for subscriptions)
        const { data: product, error: productError } = await supabaseAdmin
            .from("products")
            .select("*")
            .eq("id", productId)
            .single();

        if (productError || !product) {
            throw new Error("Product not found");
        }

        // 4. Determine Mode (Payment vs Subscription)
        const isSubscription = !!product.interval; // 'month' or 'year'
        const mode = isSubscription ? "subscription" : "payment";

        console.log(`[DEBUG] Product: ${product.title}, Interval: ${product.interval}, Mode: ${mode}`);

        // 5. Call Stripe API
        const params = new URLSearchParams();
        params.append("payment_method_types[]", "card");
        params.append("mode", mode);
        params.append("success_url", successUrl || `${req.headers.get('origin')}/shop?success=true`);
        params.append("cancel_url", cancelUrl || `${req.headers.get('origin')}/shop?canceled=true`);

        // Line Item
        params.append("line_items[0][price_data][currency]", product.currency || "mxn");
        params.append("line_items[0][price_data][product_data][name]", product.title);
        params.append("line_items[0][price_data][unit_amount]", Math.round(product.price * 100).toString());

        if (isSubscription) {
            params.append("line_items[0][price_data][recurring][interval]", product.interval);
        } else {
            params.append("line_items[0][quantity]", "1");
        }

        params.append("metadata[productId]", product.id);

        const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${config.secret_key}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        const stripeData = await stripeResponse.json();

        if (!stripeResponse.ok) {
            console.error("[DEBUG] Stripe Error Data:", JSON.stringify(stripeData));
            throw new Error(`Stripe API: ${stripeData.error?.message || "Unknown error"}`);
        }

        return new Response(JSON.stringify({ url: stripeData.url }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("[DEBUG] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200, // Return 200 so frontend can parse the error message
        });
    }
});
