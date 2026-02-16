import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

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

    // 1. Initialize Supabase Client (Service Role for internal access)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. Fetch Stripe Secret Key from payment_configs
    const { data: config, error: configError } = await supabaseAdmin
      .from("payment_configs")
      .select("secret_key")
      .eq("provider", "stripe")
      .eq("is_active", true)
      .single();

    if (configError || !config?.secret_key) {
      console.error("Stripe config error:", configError);
      throw new Error("Stripe is not configured or active.");
    }

    const stripe = new Stripe(config.secret_key, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    // 3. Fetch Product Details
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      throw new Error("Product not found");
    }

    // 4. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: product.currency || "mxn",
            product_data: {
              name: product.title,
              description: product.description || undefined,
              images: product.image_url ? [product.image_url] : undefined,
            },
            unit_amount: Math.round(product.price * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl || "${req.headers.get('origin')}/shop?success=true",
      cancel_url: cancelUrl || "${req.headers.get('origin')}/shop?canceled=true",
      metadata: {
        productId: product.id,
        // userId: req.headers.get('x-user-id') // TODO: Extract user from JWT if needed
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
