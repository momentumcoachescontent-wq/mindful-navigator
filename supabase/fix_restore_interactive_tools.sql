-- ================================================================
-- FIX URGENTE: Restaurar contenido interactivo del Simulador y Mapa de Riesgo
-- Los tools con IDs en español (simulador-conversaciones, mapa-riesgo)
-- tienen un JSON estático. Los originales en inglés que borramos 
-- tenían el JSON interactivo correcto con type, scenarios, questions, etc.
-- Este script restaura el contenido interactivo.
-- ================================================================

-- 1. SIMULADOR DE CONVERSACIONES — restaurar JSON interactivo
UPDATE public.tools 
SET content = '{
  "type": "roleplay",
  "intro": "No vayas a la guerra sin haber entrenado. Visualiza y prepara tus respuestas.",
  "scenarios": [
    { "id": "jefe", "label": "Jefe/a", "icon": "briefcase" },
    { "id": "pareja", "label": "Pareja", "icon": "heart" },
    { "id": "madre_padre", "label": "Padre/Madre", "icon": "users" },
    { "id": "ex_pareja", "label": "Ex-Pareja", "icon": "user-minus" },
    { "id": "colega", "label": "Colega", "icon": "user-plus" }
  ],
  "personalities": [
    { "id": "dominante", "label": "Perfil Dominante", "description": "Se comunica con autoridad y espera resultados." },
    { "id": "pasivo_agresivo", "label": "Pasivo-Agresivo", "description": "Usa el sarcasmo o el silencio para manipular." },
    { "id": "victima", "label": "Perfil Víctima", "description": "Culpa a los demás y evita responsabilidad." },
    { "id": "evitativo", "label": "Perfil Evitativo", "description": "Evita el conflicto y las conversaciones profundas." },
    { "id": "explosivo", "label": "Perfil Explosivo", "description": "Reacciones desproporcionadas y desborde emocional." }
  ],
  "rounds": 3,
  "feedback_categories": ["clarity", "firmness", "empathy"],
  "script_versions": ["soft", "firm", "final_warning"],
  "closing": "El poder en una discusión no lo tiene quien grita más, lo tiene quien no pierde el centro."
}'::jsonb
WHERE id = 'simulador-conversaciones';

-- 2. MAPA DE RIESGO — restaurar JSON interactivo
UPDATE public.tools 
SET content = '{
  "type": "assessment",
  "intro": "Evalúa objetivamente la toxicidad de la relación o entorno en el que te encuentras.",
  "questions": [
    { "id": "q1", "text": "¿Esta persona te insulta, humilla o menosprecia?", "category": "verbal_abuse", "weight": 3 },
    { "id": "q2", "text": "¿Te hace sentir culpable por cosas que no son tu responsabilidad?", "category": "guilt_manipulation", "weight": 2 },
    { "id": "q3", "text": "¿Controla con quién hablas, a dónde vas o qué haces?", "category": "control", "weight": 3 },
    { "id": "q4", "text": "¿Cambia de humor drásticamente sin razón aparente?", "category": "instability", "weight": 2 },
    { "id": "q5", "text": "¿Te ha amenazado directa o indirectamente?", "category": "threats", "weight": 4 },
    { "id": "q6", "text": "¿Sientes que caminas sobre cáscaras de huevo a su alrededor?", "category": "fear", "weight": 2 },
    { "id": "q7", "text": "¿Ha destruido tus pertenencias o ha sido violento/a físicamente?", "category": "physical", "weight": 5 },
    { "id": "q8", "text": "¿Te aísla de tu familia o amigos?", "category": "isolation", "weight": 3 },
    { "id": "q9", "text": "¿Invalida tus sentimientos diciendo que exageras?", "category": "gaslighting", "weight": 2 },
    { "id": "q10", "text": "¿Sientes que has perdido tu identidad desde que estás con esta persona?", "category": "identity_loss", "weight": 3 }
  ],
  "risk_levels": [
    { "min": 0, "max": 8, "level": "low", "label": "Zona Verde", "color": "#22c55e", "description": "Situación manejable. Mantén la observación y fortalece tus límites." },
    { "min": 9, "max": 18, "level": "medium", "label": "Zona Amarilla", "color": "#eab308", "description": "Señales de alerta presentes. Establece límites firmes y busca apoyo." },
    { "min": 19, "max": 29, "level": "high", "label": "Zona Roja", "color": "#ef4444", "description": "Situación de riesgo. Considera buscar ayuda profesional y planifica tu seguridad." }
  ],
  "has_discrete_mode": true,
  "has_exit_plan": true,
  "closing": "Tu seguridad es lo primero. No estás exagerando."
}'::jsonb
WHERE id = 'mapa-riesgo';

-- 3. Verificar resultado
SELECT id, title, content->>'type' as tool_type
FROM public.tools
WHERE id IN ('simulador-conversaciones', 'mapa-riesgo')
ORDER BY title;
