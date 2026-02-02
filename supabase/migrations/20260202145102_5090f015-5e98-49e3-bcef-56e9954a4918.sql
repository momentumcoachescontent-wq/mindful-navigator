-- Allow authenticated users to insert daily reflections (for content management)
CREATE POLICY "Authenticated users can create daily reflections" 
ON public.daily_reflections 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update their own or manage reflections
CREATE POLICY "Authenticated users can update daily reflections" 
ON public.daily_reflections 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete daily reflections
CREATE POLICY "Authenticated users can delete daily reflections" 
ON public.daily_reflections 
FOR DELETE 
USING (auth.uid() IS NOT NULL);