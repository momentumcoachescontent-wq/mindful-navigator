-- Create meditations table for audio content
CREATE TABLE public.meditations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 300,
  category TEXT NOT NULL DEFAULT 'calm',
  audio_url TEXT,
  thumbnail_url TEXT,
  is_free BOOLEAN NOT NULL DEFAULT false,
  narrator TEXT DEFAULT 'Ernesto',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for meditations
ALTER TABLE public.meditations ENABLE ROW LEVEL SECURITY;

-- Meditations are viewable by everyone (free/premium logic handled in frontend)
CREATE POLICY "Meditations are viewable by everyone"
ON public.meditations FOR SELECT
USING (true);

-- Create user_favorites table for marking favorite meditations
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meditation_id UUID NOT NULL REFERENCES public.meditations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, meditation_id)
);

-- Enable RLS for favorites
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
ON public.user_favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites"
ON public.user_favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON public.user_favorites FOR DELETE
USING (auth.uid() = user_id);

-- Create tools table with full content
CREATE TABLE public.tools (
  id TEXT NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Shield',
  color TEXT NOT NULL DEFAULT 'primary',
  category TEXT NOT NULL,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  content JSONB NOT NULL DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for tools
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

-- Tools are viewable by everyone
CREATE POLICY "Tools are viewable by everyone"
ON public.tools FOR SELECT
USING (true);

-- Add is_premium column to profiles for subscription tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create storage bucket for meditation audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('meditations', 'meditations', true);

-- Storage policies for meditations bucket
CREATE POLICY "Meditation audio is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'meditations');

-- Insert initial tools data
INSERT INTO public.tools (id, title, description, icon, color, category, is_premium, content) VALUES
('hero', 'H.E.R.O. Framework', 'Reconoce patrones de manipulación: Humillación, Exigencias, Rechazo, Órdenes', 'Shield', 'turquoise', 'protection', false, '{
  "intro": "El framework H.E.R.O. te ayuda a identificar las 4 señales principales de manipulación emocional.",
  "sections": [
    {
      "letter": "H",
      "title": "Humillación",
      "description": "Comentarios que buscan hacerte sentir inferior o avergonzado/a",
      "examples": ["\"Eres tan torpe, no puedes hacer nada bien\"", "\"Nadie más te aguantaría\"", "\"Mira cómo te vistes, das pena\""],
      "action": "Reconoce que la humillación dice más de quien la hace que de ti. No eres lo que te dicen."
    },
    {
      "letter": "E",
      "title": "Exigencias",
      "description": "Demandas irrazonables disfrazadas de necesidades legítimas",
      "examples": ["\"Si me amaras, dejarías a tus amigos\"", "\"Necesito tu contraseña para confiar en ti\"", "\"Tienes que estar disponible siempre\""],
      "action": "Las relaciones sanas tienen espacio para ambas personas. Tus necesidades también importan."
    },
    {
      "letter": "R",
      "title": "Rechazo",
      "description": "Ignorar, invalidar tus emociones o usar el silencio como castigo",
      "examples": ["\"Estás exagerando, no fue para tanto\"", "\"Siempre te haces la víctima\"", "Días sin hablarte después de una discusión"],
      "action": "Tus emociones son válidas. El silencio punitivo es una forma de control."
    },
    {
      "letter": "O",
      "title": "Órdenes",
      "description": "Intentos de controlar tu comportamiento, decisiones o aspecto",
      "examples": ["\"No quiero que hables con esa persona\"", "\"Tienes que avisarme dónde estás siempre\"", "\"Cámbiate esa ropa, no me gusta\""],
      "action": "Eres una persona adulta con derecho a tomar tus propias decisiones."
    }
  ],
  "closing": "Si identificas estos patrones de forma frecuente, es momento de buscar apoyo. No estás solo/a."
}'::jsonb),

('calm', 'C.A.L.M. Technique', 'Regula tus emociones: Calma, Analiza, Libera, Muévete', 'Brain', 'coral', 'emotions', false, '{
  "intro": "La técnica C.A.L.M. es tu herramienta de primeros auxilios emocionales para momentos de crisis.",
  "sections": [
    {
      "letter": "C",
      "title": "Calma",
      "description": "Detente y enfócate en tu respiración",
      "steps": ["Inhala profundo por 4 segundos", "Sostén el aire por 4 segundos", "Exhala lentamente por 6 segundos", "Repite 3-5 veces"],
      "tip": "Pon una mano en tu pecho para sentir cómo se calma tu corazón"
    },
    {
      "letter": "A",
      "title": "Analiza",
      "description": "Observa tus pensamientos sin juzgarlos",
      "steps": ["¿Qué emoción estoy sintiendo ahora?", "¿Qué pensamiento la desencadenó?", "¿Este pensamiento es un hecho o una interpretación?", "¿Qué diría mi mejor amigo/a sobre esto?"],
      "tip": "Nombrar la emoción ya reduce su intensidad"
    },
    {
      "letter": "L",
      "title": "Libera",
      "description": "Deja ir la tensión acumulada",
      "steps": ["Sacude las manos vigorosamente", "Haz movimientos de hombros hacia atrás", "Suelta la mandíbula", "Suspira profundamente"],
      "tip": "Las emociones son energía que necesita moverse"
    },
    {
      "letter": "M",
      "title": "Muévete",
      "description": "Cambia tu estado físico para cambiar tu estado mental",
      "steps": ["Camina aunque sea unos pasos", "Cambia de postura o de lugar", "Toma agua fresca", "Sal al aire libre si es posible"],
      "tip": "El movimiento rompe el ciclo de pensamientos negativos"
    }
  ],
  "closing": "Practica C.A.L.M. regularmente, no solo en crisis. Así estará lista cuando más la necesites."
}'::jsonb),

('limits-scripts', 'Scripts de Límites', 'Frases claras para establecer fronteras saludables', 'MessageSquare', 'secondary', 'communication', false, '{
  "intro": "Estas frases te ayudarán a comunicar tus límites de forma clara, firme y respetuosa.",
  "categories": [
    {
      "name": "Límites de Tiempo",
      "scripts": [
        "Ahora no puedo atender esto. Podemos hablarlo mañana.",
        "Necesito tiempo para pensarlo antes de responder.",
        "Hoy no es buen momento. Te aviso cuando esté disponible."
      ]
    },
    {
      "name": "Límites Emocionales",
      "scripts": [
        "Puedo escucharte, pero no puedo cargar con tu problema.",
        "Entiendo que estás molesto/a, pero no voy a permitir gritos.",
        "Mis sentimientos también son válidos en esta conversación."
      ]
    },
    {
      "name": "Límites Físicos",
      "scripts": [
        "No me siento cómodo/a con eso. Por favor, respeta mi espacio.",
        "Prefiero no tener contacto físico ahora mismo.",
        "Necesito mi privacidad. Por favor, toca antes de entrar."
      ]
    },
    {
      "name": "Límites Digitales",
      "scripts": [
        "No reviso mensajes fuera de horario laboral.",
        "No voy a compartir mis contraseñas.",
        "Prefiero no estar en videollamada ahora, podemos hablar por texto."
      ]
    }
  ],
  "tips": [
    "Di \"no\" sin dar explicaciones extensas",
    "Mantén un tono neutro, no defensivo",
    "Es normal sentir culpa al principio, pero pasará",
    "Practica frente al espejo antes de situaciones difíciles"
  ]
}'::jsonb),

('sos-phrases', 'Tarjetas SOS', 'Qué decir, qué no decir, qué hacer en momentos difíciles', 'Zap', 'coral', 'protection', true, '{
  "intro": "Guía rápida de respuestas para situaciones de conflicto o manipulación.",
  "scenarios": [
    {
      "situation": "Te culpan de todo",
      "do_say": ["\"Entiendo tu perspectiva, pero no acepto toda la responsabilidad\"", "\"Podemos hablar cuando ambos estemos más tranquilos\""],
      "dont_say": ["\"Tienes razón, es mi culpa\"", "\"Lo siento, lo siento, lo siento\""],
      "do_action": "Retírate temporalmente si la discusión escala",
      "dont_action": "No cedas solo para evitar el conflicto"
    },
    {
      "situation": "Amenazas veladas",
      "do_say": ["\"¿Podrías explicar qué quieres decir con eso?\"", "\"Esa frase me hace sentir incómodo/a\""],
      "dont_say": ["\"Estás loco/a\"", "\"Nunca harías eso\""],
      "do_action": "Documenta la conversación (captura de pantalla)",
      "dont_action": "No minimices ni ignores las amenazas"
    },
    {
      "situation": "Te hacen gaslighting",
      "do_say": ["\"Yo recuerdo las cosas de manera diferente\"", "\"Mis percepciones son válidas\""],
      "dont_say": ["\"¿Tal vez me equivoqué?\"", "\"Quizás estoy exagerando\""],
      "do_action": "Escribe lo que pasó inmediatamente después",
      "dont_action": "No dudes de tu propia memoria"
    }
  ],
  "emergency": {
    "title": "En caso de peligro inmediato",
    "steps": ["Llama a tu contacto de emergencia", "Sal del lugar si es posible", "Marca a la línea de emergencias", "Guarda evidencia cuando sea seguro"]
  }
}'::jsonb),

('self-care', 'Plan de Autocuidado', 'Construye tu rutina de bienestar emocional personalizada', 'Heart', 'turquoise', 'emotions', false, '{
  "intro": "El autocuidado no es egoísmo, es supervivencia. Diseña tu plan personalizado.",
  "pillars": [
    {
      "name": "Cuerpo",
      "icon": "Activity",
      "ideas": ["Dormir 7-8 horas", "Hacer 20 min de movimiento", "Comer sin distracciones", "Tomar suficiente agua", "Estirarte cada hora"]
    },
    {
      "name": "Mente",
      "icon": "Brain",
      "ideas": ["5 minutos de meditación", "Escribir 3 cosas de gratitud", "Limitar noticias negativas", "Aprender algo nuevo", "Descansos de pantallas"]
    },
    {
      "name": "Emociones",
      "icon": "Heart",
      "ideas": ["Nombrar lo que sientes", "Hablar con alguien de confianza", "Permitirte llorar si lo necesitas", "Celebrar pequeños logros", "Perdonarte por errores"]
    },
    {
      "name": "Conexión",
      "icon": "Users",
      "ideas": ["Llamar a alguien que te hace bien", "Pedir ayuda cuando la necesites", "Establecer límites sanos", "Soltar relaciones tóxicas", "Pasar tiempo en comunidad"]
    }
  ],
  "weekly_planner": {
    "monday": "Cuerpo: Elige una actividad física",
    "tuesday": "Mente: 10 min sin pantallas antes de dormir",
    "wednesday": "Emociones: Escribe cómo te sientes",
    "thursday": "Conexión: Contacta a alguien importante",
    "friday": "Cuerpo: Prepara una comida nutritiva",
    "saturday": "Mente: Haz algo creativo o nuevo",
    "sunday": "Emociones: Revisa tu semana y celebra victorias"
  }
}'::jsonb),

('support-network', 'Red de Apoyo', 'Identifica y organiza tus contactos de confianza', 'Users', 'secondary', 'communication', false, '{
  "intro": "Tu red de apoyo es tu escudo. Identifica quiénes pueden ayudarte en diferentes situaciones.",
  "circles": [
    {
      "level": 1,
      "name": "Círculo Íntimo",
      "description": "1-3 personas que conocen toda tu situación",
      "criteria": ["Confías completamente en ellas", "Pueden ayudarte en emergencias", "No te juzgan", "Respetan tu confidencialidad"]
    },
    {
      "level": 2,
      "name": "Círculo Cercano",
      "description": "3-5 personas de confianza general",
      "criteria": ["Amigos/familia con quienes puedes hablar", "Te apoyan aunque no sepan todos los detalles", "Puedes llamarlos si necesitas distracción"]
    },
    {
      "level": 3,
      "name": "Recursos Profesionales",
      "description": "Apoyo especializado",
      "criteria": ["Terapeuta o consejero", "Líneas de ayuda", "Grupos de apoyo", "Abogado si es necesario"]
    }
  ],
  "action_plan": {
    "title": "Plan de Seguridad",
    "items": [
      "Guarda números importantes en un lugar seguro",
      "Ten un código secreto con tu círculo íntimo",
      "Identifica lugares seguros donde puedas ir",
      "Prepara una bolsa de emergencia si es necesario",
      "Comparte tu ubicación con personas de confianza"
    ]
  }
}'::jsonb);

-- Insert sample meditations
INSERT INTO public.meditations (title, description, duration_seconds, category, is_free, narrator, order_index) VALUES
('Respira y Suelta', 'Meditación guiada para liberar el estrés del día', 600, 'calm', true, 'Ernesto', 1),
('Reconectando Contigo', 'Un espacio seguro para escuchar tu voz interior', 900, 'self-esteem', true, 'Ernesto', 2),
('Liberando el Miedo', 'Visualización para soltar miedos y preocupaciones', 720, 'anxiety', false, 'Ernesto', 3),
('Afirmaciones de Valor', 'Refuerza tu autoestima con palabras poderosas', 480, 'self-esteem', false, 'Ernesto', 4),
('Estableciendo Límites', 'Meditación para fortalecer tu capacidad de decir no', 660, 'boundaries', false, 'Ernesto', 5),
('Noche Tranquila', 'Relajación profunda para antes de dormir', 1200, 'sleep', true, 'Ernesto', 6),
('Sanando Heridas', 'Un viaje de compasión hacia ti mismo/a', 840, 'healing', false, 'Ernesto', 7),
('Coraje Interior', 'Despierta tu fuerza interna', 540, 'empowerment', false, 'Ernesto', 8);