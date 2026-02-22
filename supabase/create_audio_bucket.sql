-- 1. Create a new storage bucket for audio
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-library', 'audio-library', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. Policy to allow public access to audio-library
CREATE POLICY "Audio library is publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'audio-library' );

-- 3. Policy to allow authenticated users to upload to audio-library
CREATE POLICY "Authenticated users can upload audio."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'audio-library' AND auth.role() = 'authenticated' );

-- 4. Policy to allow users to update audio-library objects
CREATE POLICY "Authenticated users can update audio."
  ON storage.objects FOR UPDATE
  WITH CHECK ( bucket_id = 'audio-library' AND auth.role() = 'authenticated' );

-- 5. Policy to allow users to delete audio-library objects
CREATE POLICY "Authenticated users can delete audio."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'audio-library' AND auth.role() = 'authenticated' );
