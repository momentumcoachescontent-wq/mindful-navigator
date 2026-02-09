-- Enable RLS (just in case)
ALTER TABLE daily_reflections ENABLE ROW LEVEL SECURITY;

-- Policy to allow admins to insert
CREATE POLICY "Admins can insert daily reflections"
ON daily_reflections
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy to allow admins to update
CREATE POLICY "Admins can update daily reflections"
ON daily_reflections
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy to allow admins to delete
CREATE POLICY "Admins can delete daily reflections"
ON daily_reflections
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);
