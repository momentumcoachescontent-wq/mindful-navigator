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
        // 1. Get User from Auth Header
        const supabaseUrl = Deno.env.get("APP_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("APP_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

        // Create client to verify user token
        const supabaseClient = createClient(
            supabaseUrl ?? "",
            anonKey ?? "",
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            throw new Error("Unauthorized");
        }

        const { subscriptionId } = await req.json();

        if (!subscriptionId) {
            throw new Error("Missing subscriptionId");
        }

        // 2. Setup Admin Client for DB & Config access
        const supabaseAdmin = createClient(
            supabaseUrl ?? "",
            supabaseServiceKey ?? ""
        );

        // 3. Verify Ownership
        const { data: subscription, error: subError } = await supabaseAdmin
            .from("user_subscriptions")
            .select("*")
            .eq("id", subscriptionId)
            .eq("user_id", user.id)
            .single();

        if (subError || !subscription) {
            throw new Error("Subscription not found or does not belong to user");
        }

        // 4. Fetch Stripe Config
        const { data: config, error: configError } = await supabaseAdmin
            .from("payment_configs")
            .select("secret_key")
            .eq("provider", "stripe")
            .single();

        if (configError || !config?.secret_key) {
            throw new Error("Stripe configuration missing");
        }

        // 5. Cancel in Stripe (Cancel at period end)
        console.log(`[DEBUG] Canceling Stripe Sub: ${subscription.stripe_subscription_id}`);

        const stripeResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscription.stripe_subscription_id}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${config.secret_key}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                "cancel_at_period_end": "true"
            }).toString(),
        });

        const stripeData = await stripeResponse.json();

        if (!stripeResponse.ok) {
            console.error("Stripe Error:", stripeData);
            throw new Error(stripeData.error?.message || "Failed to cancel subscription in Stripe");
        }

        // 6. Update Local DB
        const { error: updateError } = await supabaseAdmin
            .from("user_subscriptions")
            .update({
                status: 'canceled', // Or 'active' but with cancel_at_period_end = true, let's trust the webhook to sync exact status if we prefer, but immediate feedback is good.
                cancel_at_period_end: true
            })
            .eq("id", subscriptionId);

        if (updateError) {
            console.error("DB Update Error", updateError);
        }

        return new Response(JSON.stringify({ success: true, stripe_status: stripeData.status }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("[DEBUG] Error:", error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
