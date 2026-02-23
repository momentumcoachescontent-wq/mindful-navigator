-- SQL Script for Data Mining: Semantic Cloud
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_admin_semantic_cloud(days_back INTEGER DEFAULT 30)
RETURNS TABLE (word TEXT, frequency BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- AUTH CHECK
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE user_id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  WITH words AS (
    SELECT regexp_split_to_table(lower(content), '\W+') AS word
    FROM public.journal_entries
    WHERE created_at >= (now() - (days_back || ' days')::interval)
  ),
  filtered_words AS (
    SELECT w.word
    FROM words w
    WHERE length(w.word) > 3
    AND w.word NOT IN (
      'para', 'como', 'pero', 'este', 'esta', 'esto', 'todo', 'nada', 'algo', 'solo',
      'cuando', 'donde', 'quien', 'porque', 'tengo', 'tiene', 'estoy', 'esta',
      'hacer', 'puedo', 'quiero', 'mucho', 'poco', 'siempre', 'nunca', 'sobre', 'entre',
      'hasta', 'desde', 'bien', 'tambien', 'estaba', 'tienen', 'ellos', 'ellas',
      'nosotros', 'ustedes', 'aqui', 'alla', 'entonces', 'ahora', 'despues', 'antes',
      'muy', 'mas', 'menos', 'mejor', 'peor', 'mayor', 'menor', 'gran', 'buen', 'mal',
      'cada', 'cual', 'que', 'los', 'las', 'del', 'por', 'con', 'una', 'uno', 'unas',
      'unos', 'soy', 'eres', 'somos', 'son', 'algun', 'alguna', 'esos', 'esas', 'aquel'
    )
  )
  SELECT fw.word, count(*) as frequency
  FROM filtered_words fw
  WHERE fw.word != ''
  GROUP BY fw.word
  ORDER BY frequency DESC
  LIMIT 10;
END;
$$;
