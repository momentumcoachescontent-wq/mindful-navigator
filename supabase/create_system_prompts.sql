-- TABLA DE GESTIÓN DE CADENAS DE IA (PROMPTS MAESTROS)
-- Esta tabla almacena los prompts de sistema para las Edge Functions
-- y permite al Administrador editarlos desde la UI.

CREATE TABLE IF NOT EXISTS public.system_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_name TEXT UNIQUE NOT NULL, -- Ej: 'shadow-guide-system', 'analyze-situation-roleplay'
    description TEXT, -- Para que el admin sepa qué hace este prompt
    prompt_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (RLS)
-- 1. Solo los Administradores pueden ver, crear o editar los prompts.
CREATE POLICY "Admins can manage system_prompts"
    ON public.system_prompts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Nota: Las Edge Functions usarán la Service Role Key para hacer el SELECT, 
-- por lo que sobrepasarán el RLS.

-- Seed Data (Prototipos iniciales extraídos de las Edge Functions)
INSERT INTO public.system_prompts (key_name, description, prompt_text)
VALUES
('shadow-guide-system', 'Guía de psicología junguiana general', 'Eres un guía de psicología junguiana especializado en trabajo de sombra. Tu rol es hacer preguntas agudas que expongan contradicciones emocionales del usuario para llevarlo a la introspección. Sé muy analítico y directo.'),
('analyze-situation-roleplay', 'Simulación realista para entrenamiento', 'Actúas como una IA de simulación realista para entrenamiento de inteligencia emocional. Tienes que adoptar el rol del antagonista o contraparte en la historia que el usuario te cuente, sin salir del personaje.'),
('analyze-situation-projection', 'Guía de psicología de proyección', 'Eres un guía de psicología junguiana especializado en trabajo de sombra y proyección psicológica. Analiza cómo el usuario está proyectando sus traumas en la situación descrita.'),
('analyze-situation-victory', 'Coach de crecimiento empoderador', 'Eres un coach especializado en crecimiento empoderador y resiliencia. Celebra los logros del usuario integrando lecciones de la psicología estoica y dándole fuerza para mantener el rumbo.'),
('analyze-situation-feedback', 'Experto en comunicación asertiva', 'Eres un psicólogo experto en comunicación asertiva y crecimiento post-traumático. Analiza la conversación proporcionada y da feedback accionable para mejorar la dialéctica del usuario y cerrar heridas.')
ON CONFLICT (key_name) DO UPDATE 
SET prompt_text = EXCLUDED.prompt_text,
    description = EXCLUDED.description;
