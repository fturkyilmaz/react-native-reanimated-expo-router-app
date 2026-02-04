// @ts-nocheck
// Supabase client configuration for React Native

// Environment variables for Supabase
// These should be in your .env.local file:
// EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
// EXPO_PUBLIC_SUPABASE_KEY=your-anon-key

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
    return Boolean(supabaseUrl && supabaseKey && supabaseUrl.includes('supabase.co'));
};

export const getSupabaseUrl = () => supabaseUrl;
export const getSupabaseAnonKey = () => supabaseKey;

// Export for backwards compatibility
export const getSupabaseClient = () => {
    if (!isSupabaseConfigured()) {
        return null;
    }

    // Dynamic import to avoid issues with Metro bundler
    return createSupabaseClient(supabaseUrl, supabaseKey);
};

export const createClient = () => {
    return getSupabaseClient();
};

// Create client using direct import
function createSupabaseClient(url: string, key: string) {
    // Using require to avoid ES module issues
    const lib = require('@supabase/supabase-js');
    return lib.createClient(url, key);
}
