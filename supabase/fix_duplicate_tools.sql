-- ================================================================
-- LIMPIEZA DEFINITIVA DE HERRAMIENTAS DUPLICADAS
-- Ejecutar en el SQL Editor de Supabase
-- ================================================================

-- PASO 1: Eliminar duplicados manteniendo el registro con id de fila mayor
-- (borra las copias anteriores, conserva la más reciente)
DELETE FROM public.tools a
USING public.tools b
WHERE a.ctid < b.ctid
  AND a.id = b.id;

-- PASO 2: Si la tabla tiene PRIMARY KEY en un campo serial/uuid diferente al campo 'id' (texto),
-- y no tiene restricción UNIQUE en 'id', crearla ahora.
DO $$
BEGIN
  -- Verificar si ya existe una constraint UNIQUE en la columna 'id'
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename  = 'tools'
      AND indexname  = 'tools_id_unique'
  ) THEN
    -- También verificar que no haya una PK ya en 'id'
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'tools'
        AND tc.constraint_type = 'PRIMARY KEY'
        AND kcu.column_name = 'id'
    ) THEN
      CREATE UNIQUE INDEX tools_id_unique ON public.tools(id);
      RAISE NOTICE 'Índice UNIQUE creado en tools.id';
    ELSE
      RAISE NOTICE 'La columna id ya es PRIMARY KEY, no es necesario crear índice extra';
    END IF;
  ELSE
    RAISE NOTICE 'El índice UNIQUE ya existe';
  END IF;
END $$;

-- PASO 3: Verificar — debe mostrar count=1 para cada tool
SELECT id, title, COUNT(*) as copias
FROM public.tools
GROUP BY id, title
ORDER BY title;
