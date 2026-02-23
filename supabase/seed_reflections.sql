-- Migración para inyectar 30 reflexiones de respaldo a la Base de Datos
-- Autor: Mindful Navigator AI
-- Fecha: 2026-02-22

INSERT INTO public.daily_reflections (content, author, category, is_active, display_date) 
VALUES
('El miedo no es tu enemigo, es un mapa hacia tu poder oculto.', 'Más allá del Miedo', 'psicologia', true, CURRENT_DATE),
('La ansiedad es solo emoción contenida que pide movimiento.', 'Mindful Navigator', 'psicologia', true, CURRENT_DATE),
('No necesitas "arreglarte", solo necesitas observarte sin juicio.', 'Ernesto', 'mindfulness', true, CURRENT_DATE),
('Tu oscuridad contiene la energía necesaria para tu propia iluminación.', 'Carl Jung', 'sombra', true, CURRENT_DATE),
('Lo que resistes, persiste. Lo que aceptas, se transforma.', 'Carl Jung', 'mindfulness', true, CURRENT_DATE),
('Hoy, sé el adulto que necesitabas cuando eras niño.', 'Inner Child', 'sanacion', true, CURRENT_DATE),
('Poner límites es un acto de amor propio, no de agresión.', 'Más allá del Miedo', 'amor_propio', true, CURRENT_DATE),
('La incomodidad es el precio de la admisión para una vida significativa.', 'Susan David', 'resiliencia', true, CURRENT_DATE),
('No eres tus pensamientos. Eres el cielo donde tus pensamientos son las nubes.', 'Eckhart Tolle', 'mindfulness', true, CURRENT_DATE),
('Si te da paz, es el camino correcto. Si te da confusión, es una lección.', 'Anónimo', 'sabiduria', true, CURRENT_DATE),
('La vulnerabilidad no es debilidad, es nuestra medida más precisa de valor.', 'Brené Brown', 'coraje', true, CURRENT_DATE),
('Respira. Este momento es el único que tienes seguro.', 'Mindful Navigator', 'mindfulness', true, CURRENT_DATE),
('Confía en la incertidumbre. Ahí es donde ocurre la magia.', 'Más allá del Miedo', 'crecimiento', true, CURRENT_DATE),
('Perdonar no es liberar al otro, es liberarte a ti mismo del veneno.', 'Anónimo', 'sanacion', true, CURRENT_DATE),
('Tu cuerpo lleva la cuenta. Escucha lo que te dice tu tensión.', 'Bessel van der Kolk', 'somatico', true, CURRENT_DATE),
('La disciplina es el puente entre metas y logros.', 'Jim Rohn', 'habitos', true, CURRENT_DATE),
('No busques que el mundo cambie, cambia tu forma de verlo y el mundo cambiará.', 'Wayne Dyer', 'perspectiva', true, CURRENT_DATE),
('El fracaso es solo información. No una sentencia.', 'Mindful Navigator', 'resiliencia', true, CURRENT_DATE),
('Date permiso para descansar. No eres una máquina.', 'Self Care', 'autocuidado', true, CURRENT_DATE),
('La felicidad no es la ausencia de problemas, es la habilidad de tratar con ellos.', 'Steve Maraboli', 'resiliencia', true, CURRENT_DATE),
('Sé amable contigo mismo. Estás haciendo lo mejor que puedes.', 'Auto-compasión', 'amor_propio', true, CURRENT_DATE),
('El primer paso para sanar es reconocer que te duele.', 'Más allá del Miedo', 'sanacion', true, CURRENT_DATE),
('No tienes que creer todo lo que piensas.', 'Byron Katie', 'mindfulness', true, CURRENT_DATE),
('La paz viene de adentro. No la busques fuera.', 'Buda', 'sabiduria', true, CURRENT_DATE),
('Cada vez que eliges lo difícil sobre lo fácil, ganas poder personal.', 'Stoicism', 'poder', true, CURRENT_DATE),
('Obsérvate a ti mismo como si fueras otra persona.', 'Distanciamiento', 'mindfulness', true, CURRENT_DATE),
('El dolor es inevitable, el sufrimiento es opcional.', 'Haruki Murakami', 'sabiduria', true, CURRENT_DATE),
('Hoy es un buen día para empezar de nuevo.', 'Esperanza', 'motivacion', true, CURRENT_DATE),
('Tus emociones son mensajeros, no dictadores.', 'Emotional Intelligence', 'regulacion', true, CURRENT_DATE),
('La libertad está al otro lado de tu miedo.', 'Más allá del Miedo', 'poder', true, CURRENT_DATE)
ON CONFLICT DO NOTHING;
