-- Enable RLS for meditations table (in case it wasn't already)
ALTER TABLE public.meditations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admins to fully manage meditations (INSERT, UPDATE, DELETE)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'meditations' 
        AND policyname = 'Admins can manage meditations'
    ) THEN
        CREATE POLICY "Admins can manage meditations" ON public.meditations
          FOR ALL USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true)
          )
          WITH CHECK (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true)
          );
    END IF;
END
$$;
