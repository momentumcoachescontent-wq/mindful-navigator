-- ================================================================
-- Fix: Eliminar tools con IDs en inglés (versiones duplicadas)
-- Los scripts nuevos insertaron herramientas con IDs en español,
-- generando una versión duplicada por cada tool.
--
-- CONSERVAR: IDs en español
-- ELIMINAR:  IDs en inglés (los originales del seed)
-- ================================================================

-- Eliminar los registros con IDs en inglés
DELETE FROM public.tools
WHERE id IN (
  'audio-library',        -- duplicado de biblioteca-audios
  'risk-map',             -- duplicado de mapa-riesgo
  'pattern-break',        -- duplicado de protocolo-ruptura
  'projection-radar',     -- duplicado de radar-proyecciones
  'conversation-simulator' -- duplicado de simulador-conversaciones
);

-- Verificar resultado final (deben quedar sin duplicados de título)
SELECT id, title
FROM public.tools
ORDER BY title;
