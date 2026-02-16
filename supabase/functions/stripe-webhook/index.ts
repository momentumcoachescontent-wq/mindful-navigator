// Setup: npm install stripe
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
    const signature = req.headers.get("Stripe-Signature");

    if (!signature) {
        return new Response("Missing Stripe-Signature", { status: 400 });
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event;
    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret,
            undefined,
            cryptoProvider
        );
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new Response(err.message, { status: 400 });
    }

    console.log(`Event received: ${event.type}`);

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const supabase = createClient(
            // Use "APP_" prefix if setting manually, or fall back to system default.
            Deno.env.get("APP_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("APP_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { productId } = session.metadata || {};

        // Insert order
        const { error } = await supabase.from("orders").insert({
            stripe_session_id: session.id,
            user_id: null, // Modify if you capture user_id in client_reference_id or metadata
            product_id: productId || null,
            amount_total: session.amount_total / 100,
            currency: session.currency,
            status: session.payment_status,
            customer_email: session.customer_details?.email,
        });

        if (error) {
            console.error("Error inserting order:", error);
            return new Response("Database error", { status: 500 });
        }

        console.log("Order stored successfully:", session.id);
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
    });
});
