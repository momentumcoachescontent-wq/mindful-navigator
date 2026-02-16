# Guía de Despliegue Manual: Edge Function `create-checkout` 🚀

Sigue estos pasos para activar la función de pagos en Supabase:

1.  **Ve a tu Dashboard de Supabase:**
    *   Entra a la sección **Edge Functions** (icono `fx` en la barra lateral izquierda).

2.  **Crea una Nueva Función:**
    *   Haz clic en **"Create a new Function"**.
    *   Nombre: `create-checkout`
    *   Haz clic en **"Save and deploy"** (o similar para crear el cascarón).

3.  **Edita el Código:**
    *   Una vez creada, verás un editor de código en el navegador.
    *   Borra todo el contenido existente.
    *   Copia y pega el código de abajo (es el mismo que creé en tu proyecto).

4.  **Guarda y Despliega:**
    *   Haz clic en **"Deploy"** o **"Save"**.

---

### Código para Copiar y Pegar:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Manejo de CORS (Preflight request)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { productId, successUrl, cancelUrl } = await req.json();

    if (!productId) {
      throw new Error("Missing productId");
    }

    // 1. Inicializar Cliente Supabase (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. Obtener Llave Secreta de Stripe desde la Base de Datos
    const { data: config, error: configError } = await supabaseAdmin
      .from("payment_configs")
      .select("secret_key")
      .eq("provider", "stripe")
      .eq("is_active", true)
      .single();

    if (configError || !config?.secret_key) {
      console.error("Stripe config error:", configError);
      throw new Error("Stripe no está configurado o activo en el admin.");
    }

    const stripe = new Stripe(config.secret_key, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    // 3. Obtener Detalles del Producto
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      throw new Error("Producto no encontrado");
    }

    // 4. Crear Sesión de Stripe Checkout
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
            unit_amount: Math.round(product.price * 100), // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl || "${req.headers.get('origin')}/shop?success=true",
      cancel_url: cancelUrl || "${req.headers.get('origin')}/shop?canceled=true",
      metadata: {
        productId: product.id,
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
```
