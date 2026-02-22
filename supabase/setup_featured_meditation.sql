-- 1. Add is_featured column to meditations and audio_content
ALTER TABLE public.meditations ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.audio_content ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- 2. Insert the featured meditation if it doesn't exist
INSERT INTO public.meditations (title, description, duration_seconds, category, is_free, is_featured, order_index)
SELECT 'Calma antes de una conversación difícil', 'Prepárate mentalmente', 420, 'calm', true, true, 0
WHERE NOT EXISTS (
    SELECT 1 FROM public.meditations WHERE title = 'Calma antes de una conversación difícil'
);

-- 3. Ensure only one featured item exists (optional but good practice)
-- If we just inserted one, it's fine. The UI will handle taking the most recently featured one.
