import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dcncnrlbwvknssanwlgp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjbmNucmxid3ZrbnNzYW53bGdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMTQxNDYsImV4cCI6MjA4NDY5MDE0Nn0.QQ5wcgqyo5KPfpAlruBSv9zMeFwyJPjE3RMVb5wb3V8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProfiles() {
    console.log("Iniciando escrutinio de Almas (Perfiles)...");

    const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, is_premium, is_admin, streak_count');

    if (error) {
        console.error("Error al escrutar:", error.message);
        if (error.code === '42501' || error.message.includes('permission')) {
            console.log("==========================================");
            console.log("ACCESO DENEGADO (Row Level Security - RLS)");
            console.log("El Umbral está sellado. La llave pública (anon) no tiene privilegios para leer los perfiles de todos los usuarios.");
            console.log("Se requiere la llave SERVICE_ROLE de Supabase.");
            console.log("==========================================");
        }
        return;
    }

    console.log("------------------------------------------");
    console.log(`ALMAS REGISTRADAS ACCESIBLES: ${data.length}`);
    console.log("------------------------------------------");
    data.forEach((p, i) => {
        const role = p.is_admin ? "ADMIN" : "USUARIO";
        const status = p.is_premium ? "PREMIUM" : "ESTÁNDAR";
        console.log(`[${i + 1}] ID: ${p.id} | Nombre: ${p.display_name || "Oculto"} | Privilegio: ${role} | Estado: ${status} | Racha: ${p.streak_count}`);
    });
    console.log("------------------------------------------");
}

inspectProfiles();
