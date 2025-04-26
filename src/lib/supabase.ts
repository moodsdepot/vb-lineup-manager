import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js' // Import type

// Variable to hold the client instance once created
let supabaseBrowserClient: SupabaseClient | null = null; 

// Function to get the client instance (creates if it doesn't exist)
export function getSupabaseBrowserClient(): SupabaseClient {
    // Return existing client if already created
    if (supabaseBrowserClient) {
        return supabaseBrowserClient;
    }

    // Get environment variables *at the time the function is called*
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; 
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log("getSupabaseBrowserClient called. URL:", supabaseUrl, "Key Present:", !!supabaseAnonKey); // Log when called

    if (!supabaseUrl || !supabaseAnonKey) {
        // This error will now happen if the function is called before env vars are ready client-side
        throw new Error("Supabase environment variables NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are not available in the browser environment.");
    }

    // Create the client
    try {
        supabaseBrowserClient = createClient(supabaseUrl, supabaseAnonKey);
        console.log("Supabase browser client created successfully.");
        return supabaseBrowserClient;
    } catch (error) {
        console.error("Error creating Supabase client:", error);
        // Re-throw or handle as appropriate
        throw new Error(`Failed to create Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Note: We are no longer exporting a constant 'supabase' instance directly from this file.
// Components will call getSupabaseBrowserClient() to get the instance.
