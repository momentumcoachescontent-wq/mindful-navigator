-- Parche de la Fase 6: Asegurar que los perfiles nuevos tengan is_ranking_private = false por defecto (Públicos)

-- 1. Modificar la función trigger que crea los perfiles nuevos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, is_ranking_private)
  VALUES (NEW.id, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Normalizar la data histórica (opcional)
-- Aquellos que tengan NULL o no hayan expresado su deseo, los asumimos como públicos (false) para que el tablero no se vacíe.
UPDATE public.profiles 
SET is_ranking_private = false 
WHERE is_ranking_private IS NULL;
