-- Diagnóstico: Verificar si los contratos de herramientas llegaron a daily_missions
-- Ejecuta esto en el SQL Editor de Supabase para confirmar si los inserts están funcionando.
-- Si ves filas de tipo "tool_protocol", el insert funciona y el problema es solo el refresh del UI.
-- Si no hay filas, hay un problema con el insert (RLS o columna faltante).

SELECT 
  mission_id,
  mission_type,
  xp_earned,
  mission_date,
  metadata
FROM public.daily_missions
WHERE mission_type = 'tool_protocol'
ORDER BY mission_date DESC
LIMIT 20;
