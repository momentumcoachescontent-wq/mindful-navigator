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

    const supabase = createClient(
        Deno.env.get("APP_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("APP_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle Checkout Completed (New Subscription or One-time Payment)
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const { productId, userId } = session.metadata || {}; // Make sure to pass userId in metadata from client

        // 1. Record Order (Every payment)
        const { error: orderError } = await supabase.from("orders").insert({
            stripe_session_id: session.id,
            user_id: userId || null,
            product_id: productId || null,
            amount_total: session.amount_total / 100,
            currency: session.currency,
            status: session.payment_status,
            customer_email: session.customer_details?.email,
            subscription_id: null // We could link this if we have the ID, but user_subscriptions is better
        });

        if (orderError) console.error("Error inserting order:", orderError);

        // 2. Create/Update Subscription (If applicable)
        if (session.mode === 'subscription' && session.subscription) {
            // Retrieve subscription details to get period end
            const subscription = await stripe.subscriptions.retrieve(session.subscription);

            const { error: subError } = await supabase.from("user_subscriptions").insert({
                user_id: userId, // CRITICAL: Need userId here
                stripe_subscription_id: session.subscription,
                stripe_customer_id: session.customer,
                product_id: productId,
                status: 'active',
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end
            });

            if (subError) console.error("Error creating subscription:", subError);
        }
    }

    // Handle Recurring Payments (Renewals)
    if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object;

        // Check if it is a subscription renewal (subscription field is present)
        if (invoice.subscription) {
            console.log(`Subscription renewal: ${invoice.subscription}`);

            // Retrieve subscription to get new period
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);

            // Update local DB
            const { error } = await supabase
                .from("user_subscriptions")
                .update({
                    status: 'active',
                    current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
                })
                .eq("stripe_subscription_id", invoice.subscription);

            if (error) console.error("Error updating subscription renewal:", error);
        }
    }

    // Handle Subscription Updates (Cancellations, etc.)
    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
        const subscription = event.data.object;

        const { error } = await supabase
            .from("user_subscriptions")
            .update({
                status: subscription.status,
                cancel_at_period_end: subscription.cancel_at_period_end,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq("stripe_subscription_id", subscription.id);

        if (error) console.error("Error updating subscription status:", error);
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
    });
});
