// Supabase client configuration for React Native

// Environment variables for Supabase
// These should be in your .env.local file:
// EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
// EXPO_PUBLIC_SUPABASE_KEY=your-anon-key

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || "";

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && supabaseKey && supabaseUrl.includes("supabase.co"),
  );
};

export const getSupabaseUrl = (): string => supabaseUrl;
export const getSupabaseAnonKey = (): string => supabaseKey;

// Type for Supabase client
export type SupabaseClient = {
  auth: {
    signInWithPassword: (data: { email: string; password: string }) => Promise<{
      data: { user: SupabaseUser | null; session: SupabaseSession | null };
      error: { message: string } | null;
    }>;
    signUp: (data: {
      email: string;
      password: string;
      options?: { data?: { name?: string } };
    }) => Promise<{
      data: { user: SupabaseUser | null; session: SupabaseSession | null };
      error: { message: string } | null;
    }>;
    signOut: () => Promise<{ error: { message: string } | null }>;
    getSession: () => Promise<{ data: { session: SupabaseSession | null } }>;
    getUser: () => Promise<{ data: { user: SupabaseUser | null } }>;
    updateUser: (data: {
      email?: string;
      phone?: string;
      data?: { name?: string; bio?: string };
    }) => Promise<{
      data: { user: SupabaseUser | null };
      error: { message: string } | null;
    }>;
    user?: () => SupabaseUser | null;
    onAuthStateChange: (
      callback: (event: string, session: unknown) => void,
    ) => { data: { subscription: { unsubscribe: () => void } } };
  };
  from: (table: string) => unknown;
};

export interface SupabaseUser {
  id: string;
  email: string | null;
  user_metadata: Record<string, unknown>;
}

export interface SupabaseSession {
  access_token: string;
  user: SupabaseUser;
}

// Export for backwards compatibility
export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  // Dynamic import to avoid issues with Metro bundler
  return createSupabaseClient(supabaseUrl, supabaseKey);
};

export const createClient = (): SupabaseClient | null => {
  return getSupabaseClient();
};

// Create client using direct import
function createSupabaseClient(url: string, key: string): SupabaseClient {
  // Using require to avoid ES module issues
  const lib = require("@supabase/supabase-js");
  return lib.createClient(url, key) as SupabaseClient;
}
