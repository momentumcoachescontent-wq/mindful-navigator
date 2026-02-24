# MINDNAV (Brave Path) - Más Allá del Miedo

Una plataforma integral de acompañamiento psicológico y transformación personal basada en el libro "Más Allá del Miedo". Conecta a usuarios con herramientas de auto-exploración, diarios introspectivos, audios guiados reflexivos, análisis IA de patrones emocionales (Sombras) y un ecosistema de comunidad y recompensas.

## 🏛️ Arquitectura del Proyecto

El proyecto está construido bajo una arquitectura moderna "Serverless Frontend-Heavy", separando responsabilidades rigurosamente para máxima escalabilidad y seguridad.

**Stack Tecnológico Core:**
- **Frontend / Cliente:** React (v18), TypeScript, Vite. Enrutamiento con `react-router-dom`. Estado gestionado con React Query (`@tanstack/react-query`) y Context API nativa.
- **Backend / BaaS:** Supabase (PostgreSQL, Realtime WebSockets, Storage, Edge Functions). Permisos manejados vía RLS (Row Level Security).
- **Estilos:** Tailwind CSS, `radix-ui` para primitivas accesibles, `framer-motion` para micro-animaciones fluidas.
- **Inteligencia Artificial:** OpenAI API (GPT-4o) y Google Gemini, orquestados desde Edge Functions de Deno.
- **Pasarela de Pagos:** Stripe Payouts & Subscriptions.

## 🔐 Seguridad y Variables de Entorno (Secrets)

Por diseño arquitectónico (Fase 12), este aplicativo **NO almacena llaves maestras en su código fuente, ni en tablas públicas o privadas de la base de datos**.

Todo servicio que involucre Tokens de Autoridad (IA, Pagos, Emails) debe ejecutarse obligatoriamente desde el entorno **Server-Side** (Supabase Edge Functions) utilizando la "Bóveda" interna del servidor (Supabase Vault / Edge Secrets).

### Secretos Requeridos en Supabase (Settings > Edge Functions > Secrets)
Para que el entorno de Producción opere, asegúrate de tener configurados estos valores:
- `STRIPE_SECRET_KEY`: Llave Secreta de tu cuenta de Producción/Test de Stripe (`sk_live_...`). Requerida para generar enlaces de pago y cancelar suscripciones.
- `STRIPE_WEBHOOK_SECRET`: Llave de validación criptográfica de Stripe (`whsec_...`). Evita ataques de inyección de pagos falsos.
- `OPENAI_API_KEY`: Token de OpenAI para el análisis de Diarios y Diagnósticos Psicológicos.
- `GEMINI_API_KEY`: Token de Gemini 1.5 Pro (Si decides usar el motor secundario).
- `SUPABASE_URL` y `SUPABASE_ANON_KEY`: Normalmente inyectadas por defecto, vitales para que las funciones conecten a la base de datos.
- `SUPABASE_SERVICE_ROLE_KEY`: Requerida dentro de las Edge Functions para realizar inyecciones directas ignorando el RLS del cliente (Ej. Asignar categoría Premium tras confirmación de Stripe).

## 🚀 Guías de Despliegue y Comandos 

### Desarrollo Local (Frontend)
Para correr la plataforma en tu entorno local:

```bash
# Instalar dependencias
npm install

# Correr servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

### Gestión de Edge Functions (Supabase CLI)
Si editas el código de la carpeta `/supabase/functions/`, debes desplegarlas al servidor:

```bash
# Autenticarte en el servidor de tu proyecto
npx supabase login

# Desplegar UNA función específica (Ej. El webhook que procesa compras)
npx supabase functions deploy stripe-webhook --project-ref TU_PROJECT_ID

# Revisar logs del servidor en vivo
npx supabase functions serve
```

## 🧠 Características Core (Módulos)
1. **Diario Terapéutico (Journal):** Inyección manual, auto-guardado, categorización (Gratitud, Ansiedad, Sombra) y auto-misiones.
2. **Escáner de Sombras (IA):** Análisis lingüístico heurístico utilizando promts inyectados por el Administrador. Devuelve un diagnóstico no clínico sobre bloqueos subconscientes.
3. **Tienda y Suscripciones:** Modelo Freemium vs Premium. El contenido bloqueado insta amigablemente hacia la tienda, gestionada de extremo a extremo por Stripe. Arquitectura de respuesta optimizada (Zero Polling) vía WebSockets para confirmación de pago.
4. **Ranking Global y Gamificación:** Puntos de Experiencia (XP), Niveles visuales (Semillas a Supernovas) y Rachas calculadas en tiempo real.
5. **Panel de Comando Admin:** Control de usuarios, catálogo de tienda, métricas financieras en gráficas iterativas y un **Panel de Diagnóstico ("Health Check") en vivo** para certificar el blindaje del proyecto.

> *"La tecnología aquí construida no tiene alma por sí sola; el alma reside en la intención curativa del texto contenido en ella."*
