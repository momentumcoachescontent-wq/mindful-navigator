-- ==========================================
-- 1. STORAGE BUCKET CREATION (audio-library)
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-library', 'audio-library', true) 
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public access to audio-library
CREATE POLICY "Audio library is publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'audio-library' );

-- Policy to allow authenticated users to upload to audio-library
CREATE POLICY "Authenticated users can upload audio."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'audio-library' AND auth.role() = 'authenticated' );

-- Policy to allow users to update audio-library objects
CREATE POLICY "Authenticated users can update audio."
  ON storage.objects FOR UPDATE
  WITH CHECK ( bucket_id = 'audio-library' AND auth.role() = 'authenticated' );

-- Policy to allow users to delete audio-library objects
CREATE POLICY "Authenticated users can delete audio."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'audio-library' AND auth.role() = 'authenticated' );

-- ==========================================
-- 2. DYNAMIC FEATURED MEDITATIONS MIGRATION
-- ==========================================
-- Add is_featured column to meditations and audio_content
ALTER TABLE public.meditations ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.audio_content ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Insert the featured meditation if it doesn't exist
INSERT INTO public.meditations (title, description, duration_seconds, category, is_free, is_featured, order_index)
SELECT 'Calma antes de una conversación difícil', 'Prepárate mentalmente', 420, 'calm', true, true, 0
WHERE NOT EXISTS (
    SELECT 1 FROM public.meditations WHERE title = 'Calma antes de una conversación difícil'
);
