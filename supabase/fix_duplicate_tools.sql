-- ============================================================
-- Fix: Eliminar herramientas duplicadas en la tabla tools
-- Causado por: inject_missing_tools.sql ejecutado después de
-- restore_complete_schema.sql (ambos insertan los mismos IDs
-- pero sin ON CONFLICT, generando filas duplicadas).
--
-- Este script mantiene SOLO UN registro por ID de herramienta,
-- conservando el que tiene created_at más reciente.
-- ============================================================

-- 1. Borrar duplicados manteniendo el registro más nuevo por id
DELETE FROM public.tools a
USING public.tools b
WHERE a.ctid < b.ctid
  AND a.id = b.id;

-- 2. Crear índice único en 'id' para evitar futuros duplicados
-- (solo si no existe ya)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'tools'
      AND indexname = 'tools_id_unique'
  ) THEN
    CREATE UNIQUE INDEX tools_id_unique ON public.tools(id);
  END IF;
END $$;

-- 3. Verificar resultado
SELECT id, title, COUNT(*) as count
FROM public.tools
GROUP BY id, title
ORDER BY title;
