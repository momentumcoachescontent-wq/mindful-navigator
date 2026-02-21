-- Actualización Quirúrgica: Scripts de Límites → Taller de Escudos
-- Solo actualiza el título de la herramienta 'limits-scripts'.
-- El Taller de Forja (BoundaryScriptForge) es un componente React
-- que se activa automáticamente cuando la herramienta tiene 'categories'.
-- No es necesario modificar el JSON del content para activarlo.

UPDATE public.tools
SET title = 'Taller de Escudos'
WHERE id = 'limits-scripts';
