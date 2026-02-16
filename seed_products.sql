-- Semilla de Productos para Mindful Navigator (Fase 1.1)

-- 1. Suscripción Premium
INSERT INTO public.products (title, description, price, category, cta_link, is_active, is_featured, image_url)
VALUES 
(
    'Suscripción Premium Mensual', 
    'Acceso ilimitado a todas las herramientas: Escáner, Simulador, Audios exclusivos y seguimiento avanzado.', 
    9.99, 
    'subscription', 
    'https://buy.stripe.com/test_subscription_link', 
    true, 
    true, 
    'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=800'
);

-- 2. Ebook "Más allá del Miedo"
INSERT INTO public.products (title, description, price, category, cta_link, is_active, is_featured, image_url)
VALUES 
(
    'Ebook: Más allá del Miedo', 
    'La guía definitiva para transformar tus sombras en poder. Incluye ejercicios prácticos y teoría profunda.', 
    14.99, 
    'ebook', 
    'https://gumroad.com/test_ebook_link', 
    true, 
    false, 
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'
);

-- 3. Pack "Kit de Emergencia"
INSERT INTO public.products (title, description, price, category, cta_link, is_active, is_featured, image_url)
VALUES 
(
    'Kit de Emergencia Emocional', 
    'Pack de 5 audios y 3 guías PDF para momentos de crisis aguda. Descarga inmediata.', 
    4.99, 
    'pack', 
    'https://gumroad.com/test_pack_link', 
    true, 
    false, 
    'https://images.unsplash.com/photo-1600618528240-fb9fc964b853?auto=format&fit=crop&q=80&w=800'
);

-- 4. Mentoría (Para probar la sección dinámica)
INSERT INTO public.products (title, description, price, category, cta_link, is_active, is_featured, image_url)
VALUES 
(
    'Sesión de Desbloqueo 1:1', 
    '45 minutos con un Coach Senior para identificar tu herida primaria y trazar un plan de acción.', 
    75.00, 
    'service', 
    'https://calendly.com/test_booking_link', 
    true, 
    false, 
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800'
);
