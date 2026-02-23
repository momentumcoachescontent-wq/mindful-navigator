import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Corrected

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error, count } = await supabase
        .from('daily_reflections')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("Error querying table:", error);
    } else {
        console.log(`Total daily_reflections rows: ${count}`);
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('get_random_reflection');
    if (rpcError) {
        console.error("Error calling RPC:", rpcError.message);
    } else {
        console.log("RPC result returned rows:", rpcData?.length || 0);
        if (rpcData?.length) console.log("Example:", rpcData[0].content.substring(0, 50) + "...");
    }
}

check();
