
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Try to load env from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditLatestEntry() {
    console.log("Auditing latest journal entry...");

    const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error("Error fetching entry:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("No entries found.");
        return;
    }

    const entry = data[0];
    console.log("Latest Entry ID:", entry.id);
    console.log("Title:", entry.title);
    console.log("Entry Type:", entry.entry_type);
    console.log("Content Type:", typeof entry.content);
    console.log("Raw Content:", entry.content);

    if (typeof entry.content === 'string') {
        try {
            const parsed = JSON.parse(entry.content);
            console.log("Parsed Content keys:", Object.keys(parsed));
            console.log("Parsed Type:", parsed.type);
            console.log("Parsed Title (inside content):", parsed.title);
            console.log("Parsed Text (inside content):", parsed.text);
        } catch (e) {
            console.log("Content is not valid JSON string.");
        }
    } else {
        console.log("Content is object/jsonb. Keys:", Object.keys(entry.content));
        console.log("Parsed Type:", entry.content.type);
        console.log("Parsed Title (inside content):", entry.content.title);
        console.log("Parsed Text (inside content):", entry.content.text);
    }
}

auditLatestEntry();
