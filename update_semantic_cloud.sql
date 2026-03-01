-- Ejecutar este script en el SQL Editor de Lovable / Supabase

CREATE OR REPLACE FUNCTION get_admin_semantic_cloud(days_back INT DEFAULT 30)
RETURNS TABLE (
  word text,
  frequency bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH raw_texts AS (
    SELECT 
      CASE 
        -- Extraer contenido si es texto JSON
        WHEN content::text LIKE '{%' THEN coalesce(content->>'text', content::text)
        ELSE content::text
      END as full_text
    FROM journal_entries
    WHERE created_at >= (now() - (days_back || ' days')::interval)
  ),
  words AS (
    -- Separar por espacio y puntuación general
    SELECT regexp_split_to_table(lower(full_text), '[\s,.\!\?()"-]+') AS word
    FROM raw_texts
  ),
  cleaned_words AS (
    -- Eliminar acentos y caracteres no alfabéticos
    SELECT regexp_replace(word, '[^a-záéíóúñ]', '', 'g') AS clean_word
    FROM words
  )
  SELECT 
    clean_word as word,
    COUNT(*) as frequency
  FROM cleaned_words
  WHERE length(clean_word) > 3
    AND clean_word NOT IN (
      'este', 'esta', 'para', 'como', 'pero', 'porque', 'cuando', 'donde', 'quien', 'sobre', 'entre', 'hacia', 'hasta', 'desde', 'todo', 'nada', 'algo', 'mucho', 'poco', 'tiene', 'tengo', 'hacer', 'puedo', 'quiero', 'estoy', 'esta', 'está', 'esto', 'esos', 'esas', 'ellos', 'ellas', 'nosotros', 'ustedes'
    )
  GROUP BY clean_word
  ORDER BY frequency DESC
  LIMIT 50;
END;
$$;
