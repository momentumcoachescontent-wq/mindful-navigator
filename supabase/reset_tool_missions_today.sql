-- Reset de misiones de Herramientas del día de hoy
-- Ejecuta este script para limpiar las entradas de prueba en daily_missions
-- y que puedas verificar que el contador de "+XP HOY" funciona correctamente.
--
-- IMPORTANTE: Esto solo borra entradas del día de hoy con tipo 'tool_protocol'.
-- No afecta los Contratos de Sombra (misiones regulares del DailyChallenge).

DELETE FROM public.daily_missions
WHERE mission_type = 'tool_protocol'
  AND mission_date = CURRENT_DATE;
