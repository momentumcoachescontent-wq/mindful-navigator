
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

// We need to test as an authenticated user to trigger RLS correctly.
// Ideally we would sign in, but for quick diagnosis let's try service role first to check SCHEMA validity,
// and then anon key if possible (but we need a user token). 
// Actually, let's just use Service Role to see if the TABLE accepts the columns.
// If Service Role fails, it's a Schema/Type error.
// If Service Role succeeds but User fails, it's an RLS error.

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("Attempting to insert a check-in via Service Role...");

// 1. Get a valid user ID (any user) to satisfy foreign key
const { data: users, error: userError } = await supabase.auth.admin.listUsers();
if (userError || !users.users.length) {
    console.error("Could not find any users:", userError);
    Deno.exit(1);
}
const userId = users.users[0].id;
console.log(`Using User ID: ${userId}`);

// 2. Try insert
const { data, error } = await supabase.from("journal_entries").insert({
    user_id: userId,
    mood_score: 5,
    energy_score: 5,
    stress_score: 5,
    entry_type: "daily",
    content: { text: "Test entry from script" } // JSONB required usually? Schema says content is jsonb not null
}).select();

if (error) {
    console.error("❌ INSERT FAILED:", JSON.stringify(error, null, 2));
} else {
    console.log("✅ INSERT SUCCESS:", data);
    // Clean up
    await supabase.from("journal_entries").delete().eq("id", data[0].id);
}
