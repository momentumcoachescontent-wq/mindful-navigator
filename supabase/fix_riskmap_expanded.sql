-- ================================================================
-- MAPA DE RIESGO v2 — 20 preguntas expandidas
-- Cubre: abuso verbal, manipulación, control, aislamiento,
--        gaslighting, violencia física, abuso financiero,
--        vigilancia digital, coerción sexual, humillación pública,
--        uso de familia como arma, escalada con sustancias,
--        ciclos de promesas, amenazas de autolesión del agresor,
--        creación de dependencia, minimización de logros.
--
-- Peso máximo posible: 56 puntos
-- Umbrales: Verde 0-15 / Amarillo 16-30 / Rojo 31+
-- ================================================================

UPDATE public.tools 
SET content = '{
  "type": "assessment",
  "intro": "Evalúa objetivamente la toxicidad de la relación o entorno en el que te encuentras.",
  "questions": [
    { "id": 1,  "text": "¿Esta persona te insulta, humilla o menosprecia?", "category": "verbal_abuse", "weight": 3 },
    { "id": 2,  "text": "¿Te hace sentir culpable por cosas que no son tu responsabilidad?", "category": "guilt_manipulation", "weight": 2 },
    { "id": 3,  "text": "¿Controla con quién hablas, a dónde vas o qué haces?", "category": "control", "weight": 3 },
    { "id": 4,  "text": "¿Cambia de humor drásticamente sin razón aparente?", "category": "instability", "weight": 2 },
    { "id": 5,  "text": "¿Te ha amenazado directa o indirectamente?", "category": "threats", "weight": 4 },
    { "id": 6,  "text": "¿Sientes que caminas sobre cáscaras de huevo a su alrededor?", "category": "fear", "weight": 2 },
    { "id": 7,  "text": "¿Ha destruido tus pertenencias o ha sido violento/a físicamente?", "category": "physical", "weight": 5 },
    { "id": 8,  "text": "¿Te aísla de tu familia o amigos?", "category": "isolation", "weight": 3 },
    { "id": 9,  "text": "¿Invalida tus sentimientos diciendo que exageras o que estás loco/a?", "category": "gaslighting", "weight": 2 },
    { "id": 10, "text": "¿Sientes que has perdido tu identidad desde que estás con esta persona?", "category": "identity_loss", "weight": 3 },
    { "id": 11, "text": "¿Controla tu dinero, te pide cuentas de cada gasto o te impide trabajar?", "category": "financial_abuse", "weight": 3 },
    { "id": 12, "text": "¿Revisa tu teléfono, tus redes sociales o tu correo sin tu permiso?", "category": "digital_surveillance", "weight": 2 },
    { "id": 13, "text": "¿Te presiona o fuerza a tener relaciones íntimas cuando no quieres?", "category": "sexual_coercion", "weight": 4 },
    { "id": 14, "text": "¿Te ridiculiza o te expone frente a otras personas para avergonzarte?", "category": "public_humiliation", "weight": 2 },
    { "id": 15, "text": "¿Usa a tus hijos, familiares o mascotas como herramienta de presión?", "category": "weaponizing_family", "weight": 3 },
    { "id": 16, "text": "¿Su comportamiento empeora cuando consume alcohol u otras sustancias?", "category": "substance_escalation", "weight": 3 },
    { "id": 17, "text": "¿Promete cambiar después de cada episodio pero el ciclo se repite?", "category": "cycle_promises", "weight": 2 },
    { "id": 18, "text": "¿Amenaza con hacerse daño a sí mismo/a si lo/la dejas?", "category": "self_harm_threats", "weight": 4 },
    { "id": 19, "text": "¿Ha generado una situación donde dependes económica o emocionalmente de él/ella?", "category": "dependency_creation", "weight": 2 },
    { "id": 20, "text": "¿Minimiza tus logros, tus sueños o tu crecimiento personal?", "category": "minimizing_achievements", "weight": 2 }
  ],
  "risk_levels": {
    "green":  { "min": 0,  "max": 15, "title": "Zona Verde — Baja Toxicidad",  "color": "#22c55e" },
    "yellow": { "min": 16, "max": 30, "title": "Zona Amarilla — Alerta Activa", "color": "#eab308" },
    "red":    { "min": 31, "max": 56, "title": "Zona Roja — Riesgo Elevado",    "color": "#ef4444" }
  },
  "has_discrete_mode": true,
  "has_exit_plan": true,
  "closing": "Tu seguridad es lo primero. No estás exagerando. Confía en lo que sientes."
}'::jsonb
WHERE id = 'mapa-riesgo';

-- Verificar
SELECT id, title, 
       jsonb_array_length(content->'questions') as total_questions,
       content->'risk_levels'->'red'->>'title' as red_level_title
FROM public.tools
WHERE id = 'mapa-riesgo';
