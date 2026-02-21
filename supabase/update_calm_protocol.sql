-- Actualización Quirúrgica del Protocolo C.A.L.M.
-- Este script SOLO actualiza la herramienta 'calm' y agrega la misión.
-- No borra ni recrea ninguna otra tabla en producción.

UPDATE public.tools
SET 
  title = 'Protocolo C.A.L.M.',
  content = '{
  "intro": "La técnica C.A.L.M. es tu herramienta de primeros auxilios emocionales para momentos de crisis.",
  "sections": [
    {
      "letter": "C",
      "title": "Calma",
      "description": "Detente y enfócate en tu respiración",
      "steps": ["Inhala profundo por 4 segundos", "Sostén el aire por 4 segundos", "Exhala lentamente por 6 segundos", "Repite 3-5 veces"],
      "tip": "Pon una mano en tu pecho para sentir cómo se calma tu corazón"
    },
    {
      "letter": "A",
      "title": "Analiza",
      "description": "Observa tus pensamientos sin juzgarlos",
      "steps": ["¿Qué emoción estoy sintiendo ahora?", "¿Qué pensamiento la desencadenó?", "¿Este pensamiento es un hecho o una interpretación?", "¿Qué diría mi mejor amigo/a sobre esto?"],
      "tip": "Nombrar la emoción ya reduce su intensidad"
    },
    {
      "letter": "L",
      "title": "Libera",
      "description": "Deja ir la tensión acumulada",
      "steps": ["Sacude las manos vigorosamente", "Haz movimientos de hombros hacia atrás", "Suelta la mandíbula", "Suspira profundamente"],
      "tip": "Las emociones son energía que necesita moverse"
    },
    {
      "letter": "M",
      "title": "Muévete",
      "description": "Cambia tu estado físico para cambiar tu estado mental",
      "steps": ["Camina aunque sea unos pasos", "Cambia de postura o de lugar", "Toma agua fresca", "Sal al aire libre si es posible"],
      "tip": "El movimiento rompe el ciclo de pensamientos negativos"
    }
  ],
  "challenges": [
    {
      "id": "calm_challenge_1",
      "title": "Contrato de Anclaje (Reporte de Daños)",
      "description": "Tu cuerpo te está mintiendo, no estás en peligro de muerte. Antes de comenzar a regular tu respiración, escribe exactamente dónde sientes el pánico ahora (pecho, garganta, estómago) y qué pensamiento lo está alimentando. Míralo a los ojos y séllalo aquí.",
      "xp_reward": 40,
      "tag": "calm-protocol"
    }
  ],
  "closing": "Practica C.A.L.M. regularmente, no solo en crisis. Así estará lista cuando más la necesites."
}'::jsonb
WHERE id = 'calm';
