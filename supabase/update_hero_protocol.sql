-- Actualización Quirúrgica del Protocolo H.E.R.O.
-- Este script SOLO actualiza la herramienta 'hero' y agrega la misión.
-- No borra ni recrea ninguna otra tabla en producción.

UPDATE public.tools
SET 
  title = 'Protocolo H.E.R.O.',
  content = '{
  "intro": "El framework H.E.R.O. te ayuda a identificar las 4 señales principales de manipulación emocional.",
  "sections": [
    {
      "letter": "H",
      "title": "Humillación",
      "description": "Comentarios que buscan hacerte sentir inferior o avergonzado/a",
      "examples": ["\"Eres tan torpe, no puedes hacer nada bien\"", "\"Nadie más te aguantaría\"", "\"Mira cómo te vistes, das pena\""],
      "action": "Reconoce que la humillación dice más de quien la hace que de ti. No eres lo que te dicen."
    },
    {
      "letter": "E",
      "title": "Exigencias",
      "description": "Demandas irrazonables disfrazadas de necesidades legítimas",
      "examples": ["\"Si me amaras, dejarías a tus amigos\"", "\"Necesito tu contraseña para confiar en ti\"", "\"Tienes que estar disponible siempre\""],
      "action": "Las relaciones sanas tienen espacio para ambas personas. Tus necesidades también importan."
    },
    {
      "letter": "R",
      "title": "Rechazo",
      "description": "Ignorar, invalidar tus emociones o usar el silencio como castigo",
      "examples": ["\"Estás exagerando, no fue para tanto\"", "\"Siempre te haces la víctima\"", "Días sin hablarte después de una discusión"],
      "action": "Tus emociones son válidas. El silencio punitivo es una forma de control."
    },
    {
      "letter": "O",
      "title": "Órdenes",
      "description": "Intentos de controlar tu comportamiento, decisiones o aspecto",
      "examples": ["\"No quiero que hables con esa persona\"", "\"Tienes que avisarme dónde estás siempre\"", "\"Cámbiate esa ropa, no me gusta\""],
      "action": "Eres una persona adulta con derecho a tomar tus propias decisiones."
    }
  ],
  "challenges": [
    {
      "id": "hero_challenge_1",
      "title": "Registro de la Sombra",
      "description": "El miedo se alimenta del silencio. Abre tu diario ahora mismo y escribe detalladamente la última vez que alguien usó uno de estos 4 patrones (H.E.R.O.) contra ti. Nombra al perpetrador, describe la táctica y documenta cómo te hizo sentir. Sacarlo a la luz es el primer paso para desarmarlo.",
      "xp_reward": 50,
      "tag": "hero-protocol"
    }
  ],
  "closing": "Si identificas estos patrones de forma frecuente, es momento de buscar apoyo. No estás solo/a."
}'::jsonb
WHERE id = 'hero';
