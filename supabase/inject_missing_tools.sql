-- Sincronización del Arsenal: Inyección de Herramientas de Producción
-- Script diseñado para el SQL Editor de Lovable / Supabase
-- Ejecuta este script para asegurar que las 5 herramientas premium/avanzadas existan
-- y cuenten con la estructura JSON (content) necesaria para la interfaz gráfica.

-- Upsert para evitar duplicados. Utilizaremos el ID en texto plano como identificador.

INSERT INTO public.tools (id, title, description, icon, color, category, is_premium, content) 
VALUES 
(
  'protocolo-ruptura', 
  'Protocolo de Ruptura', 
  'S.O.S. para salir de espirales de ansiedad o loops mentales.', 
  'Zap', 
  'coral', 
  'emotions', 
  false, 
  '{
    "intro": "Cuando la mente entra en bucle, la lógica no sirve. Debes romper el patrón físicamente.",
    "sections": [
      {
        "title": "Shock Físico (El Reseteo)",
        "description": "El sistema nervioso necesita un interruptor.",
        "steps": ["Salpica agua helada en tu cara", "Sostén un cubo de hielo hasta que moleste", "Muerde un limón o algo extremadamente ácido"]
      },
      {
        "title": "Anclaje de 5 Sentidos",
        "description": "Fuerza tu mente a regresar al presente inmediato.",
        "steps": ["Nombra 5 cosas que puedes ver", "Toca 4 texturas diferentes a tu alrededor", "Escucha 3 sonidos distintos", "Identifica 2 olores", "Saborea 1 cosa"]
      },
      {
        "title": "Respiración Táctica (Caja)",
        "description": "Toma el control de tu ritmo cardíaco.",
        "steps": ["Inhala profundo en 4 segundos", "Sostén el aire 4 segundos", "Exhala en 4 segundos", "Mantén los pulmones vacíos 4 segundos"]
      }
    ],
    "closing": "No luches contra el loop mental. Rómpelo. Tu fisiología domina tu psicología en crisis."
  }'::jsonb
),
(
  'radar-proyecciones', 
  'Radar de Proyecciones', 
  'Lo que te irrita de otros, vive en ti. Transforma el juicio en autoconocimiento.', 
  'Eye', 
  'secondary', 
  'emotions', 
  true, 
  '{
    "intro": "La sombra se proyecta. Lo que detestas en los demás suele ser lo que reprimes en ti.",
    "sections": [
      {
        "title": "Identifica el Gatillo",
        "description": "Piensa en esa persona que te irrita profundamente.",
        "action": "¿Qué actitud suya te dispara? (Ej: Su arrogancia, su pereza, su necesidad de atención)"
      },
      {
        "title": "El Reflejo",
        "description": "Gira el espejo hacia ti mismo sin juicio.",
        "questions": [
          "¿En qué momento de mi vida yo actué así?",
          "¿Desearía, secretamente, tener el valor para actuar así?",
          "¿De quién tuve que defenderme cuando niño que actuaba de esta forma?"
        ]
      },
      {
        "title": "Integración",
        "description": "Aceptar la dualidad te hace invulnerable.",
        "action": "Reconoce que tienes permiso para ser egoísta, necesitas validación o tienes defectos. Cuando lo aceptas, el otro deja de irritarte."
      }
    ]
  }'::jsonb
),
(
  'simulador-conversaciones', 
  'Simulador de Conversaciones', 
  'Practica conversaciones difíciles con un entrenador virtual que simula diferentes perfiles.', 
  'MessageSquare', 
  'turquoise', 
  'communication', 
  true, 
  '{
    "intro": "No vayas a la guerra sin haber entrenado. Visualiza y prepara tus respuestas.",
    "profiles": [
      {
        "type": "El Agresivo",
        "tactic": "Intimida, alza la voz, exige obediencia.",
        "defense": "Habla más lento y más bajo. No justifiques. Di: ''Entiendo tu frustración, pero necesitas bajar el tono para que yo te escuche.''."
      },
      {
        "type": "La Víctima",
        "tactic": "Llora, culpa a sus traumas, te hace sentir mala persona por poner límites.",
        "defense": "Valida la emoción pero mantén el límite. Di: ''Siento mucho que estés pasando por esto, pero mi decisión respecto a [situación] se mantiene.''."
      },
      {
        "type": "El Pasivo-Agresivo",
        "tactic": "Sarcasmo, olvidos 'accidentales', castigo del silencio.",
        "defense": "Pon la agresión sobre la mesa. Di: ''Noto que estás actuando distante. Cuando estés listo para hablarlo de frente, aquí estaré.'' Y retírate."
      }
    ],
    "closing": "El poder en una discusión no lo tiene quien grita más, lo tiene quien no pierde el centro."
  }'::jsonb
),
(
  'mapa-riesgo', 
  'Mapa de Riesgo', 
  'Evalúa tu situación con un semáforo de riesgo y obtén un plan de acción personalizado.', 
  'ShieldAlert', 
  'coral', 
  'protection', 
  true, 
  '{
    "intro": "Evalúa objetivamente la toxicidad de la relación o entorno en el que te encuentras.",
    "levels": [
      {
        "color": "Rojo (Peligro)",
        "signals": ["Agresión física o destrucción de propiedad", "Amenazas a tu vida externa (trabajo, reputación)", "Aislamiento de tu red de apoyo"],
        "action": "Zona Cero. No hay diálogo posible. Ejecuta plan de salida. Contacta recursos profesionales o línea de emergencia."
      },
      {
        "color": "Amarillo (Precaución)",
        "signals": ["Insultos disfrazados de 'bromas'", "Inconsistencia extrema (te aman un día, te odian otro)", "Culpa constante hacia ti"],
        "action": "Mantén distancia emocional. Aplica límites de hierro. Documenta interacciones. No escales la confrontación."
      },
      {
        "color": "Verde (Fricción Normal)",
        "signals": ["Desacuerdos comunicados con respeto", "Sentimientos heridos sin malicia intencional", "Frustración temporal"],
        "action": "Aplica técnicas de asertividad. Comunica cómo te sentiste usando 'Yo siento' en lugar de 'Tú eres'."
      }
    ]
  }'::jsonb
),
(
  'biblioteca-audios', 
  'Biblioteca de Audios', 
  'Micro-intervenciones de 2-5 minutos según tu estado emocional actual.', 
  'Headphones', 
  'secondary', 
  'emotions', 
  true, 
  '{
    "intro": "Escucha tu sombra en un entorno seguro. Reprogramación auditiva de emergencia.",
    "categories": [
      {
        "name": "Para el Ataque de Pánico",
        "action": "Busca la pista 'Reseteo Autonómico'. 2 minutos de respiración guiada para bajar el pulso."
      },
      {
        "name": "Para recuperar el poder",
        "action": "Pista 'El Edicto'. 3 minutos de verbalización de límites. Repite en voz alta."
      },
      {
        "name": "Para el insomnio ansioso",
        "action": "Pista 'Apagado del Núcleo'. 5 minutos de relajación progresiva para forzar al cerebro a abandonar la alerta."
      }
    ]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  category = EXCLUDED.category,
  is_premium = EXCLUDED.is_premium,
  content = EXCLUDED.content;
