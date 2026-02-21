import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dcncnrlbwvknssanwlgp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjbmNucmxid3ZrbnNzYW53bGdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMTQxNDYsImV4cCI6MjA4NDY5MDE0Nn0.QQ5wcgqyo5KPfpAlruBSv9zMeFwyJPjE3RMVb5wb3V8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProgress() {
    console.log("Conectando a", supabaseUrl);
    const { data, error } = await supabase
        .from('user_progress')
        .select('user_id');

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    console.log("Registros en user_progress:", data.length);

    const { data: prof, error: err2 } = await supabase
        .from('profiles')
        .select('id, display_name');

    console.log("Registros en profiles:", prof ? prof.length : 'Error', prof);
}

inspectProgress();
