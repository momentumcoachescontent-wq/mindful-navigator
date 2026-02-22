-- Función para obtener una reflexión aleatoria eficientemente
CREATE OR REPLACE FUNCTION get_random_reflection()
RETURNS SETOF daily_reflections
LANGUAGE sql
STABLE
AS $$
  -- ORDER BY random() puede ser lento en tablas gigantes, pero para ~1000 filas es rapidísimo y óptimo.
  SELECT * FROM daily_reflections ORDER BY random() LIMIT 1;
$$;
