// @ts-nocheck
import { SecureStorage, StorageKey } from '@/security';
import { createClient, isSupabaseConfigured } from '@/supabase/client';

// Initialize secure storage
const secureStorage = SecureStorage.getInstance();

interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    token: string;
}

interface AuthResult {
    user: User | null;
    error: string | null;
}

class SupabaseAuthService {
    // Check if Supabase is configured
    isConfigured(): boolean {
        return isSupabaseConfigured();
    }

    private getClient() {
        if (!isSupabaseConfigured()) {
            return null;
        }
        return createClient();
    }

    // Sign up with email and password
    async signUp(email: string, password: string, name: string): Promise<AuthResult> {
        const client = this.getClient();
        if (!client) {
            return { user: null, error: 'Supabase not configured' };
        }

        try {
            const { data, error } = await client.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                    },
                },
            });

            if (error) {
                return { user: null, error: error.message };
            }

            if (data.user) {
                const user: User = {
                    id: data.user.id,
                    email: data.user.email!,
                    name: name,
                    token: data.session?.access_token || '',
                };

                // Save to secure storage
                await secureStorage.setSecureItem(StorageKey.AUTH_TOKEN, user.token);
                await secureStorage.setObject(StorageKey.USER_DATA, user, true);

                return { user, error: null };
            }

            return { user: null, error: 'Kayıt başarısız' };
        } catch (error) {
            return { user: null, error: (error as Error).message };
        }
    }

    // Sign in with email and password
    async signIn(email: string, password: string): Promise<AuthResult> {
        const client = this.getClient();
        if (!client) {
            return { user: null, error: 'Supabase not configured' };
        }

        try {
            const { data, error } = await client.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { user: null, error: error.message };
            }

            if (data.user) {
                const user: User = {
                    id: data.user.id,
                    email: data.user.email!,
                    name: data.user.user_metadata.name || '',
                    avatar: data.user.user_metadata.avatar_url,
                    token: data.session?.access_token || '',
                };

                // Save to secure storage
                await secureStorage.setSecureItem(StorageKey.AUTH_TOKEN, user.token);
                await secureStorage.setObject(StorageKey.USER_DATA, user, true);

                return { user, error: null };
            }

            return { user: null, error: 'Giriş başarısız' };
        } catch (error) {
            return { user: null, error: (error as Error).message };
        }
    }

    // Sign out
    async signOut(): Promise<void> {
        const client = this.getClient();
        if (!client) {
            return;
        }

        try {
            await client.auth.signOut();
            // Clear secure storage
            secureStorage.deleteSecureItem(StorageKey.AUTH_TOKEN);
            secureStorage.deleteSecureItem(StorageKey.USER_DATA);
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }

    // Get current session
    async getSession(): Promise<User | null> {
        const client = this.getClient();
        if (!client) {
            return null;
        }

        try {
            const { data } = await client.auth.getSession();

            if (data.session?.user) {
                const user = data.session.user;
                return {
                    id: user.id,
                    email: user.email!,
                    name: user.user_metadata.name || '',
                    avatar: user.user_metadata.avatar_url,
                    token: data.session.access_token,
                };
            }
        } catch (error) {
            console.error('Get session error:', error);
        }
        return null;
    }

    // Get current user
    async getUser(): Promise<User | null> {
        const client = this.getClient();
        if (!client) {
            return null;
        }

        try {
            const { data } = await client.auth.getUser();

            if (data.user) {
                const user = data.user;
                return {
                    id: user.id,
                    email: user.email!,
                    name: user.user_metadata.name || '',
                    avatar: user.user_metadata.avatar_url,
                    token: '',
                };
            }
        } catch (error) {
            console.error('Get user error:', error);
        }
        return null;
    }

    // Update user profile (email, phone, metadata)
    async updateUser(updates: {
        email?: string;
        phone?: string;
        name?: string;
        bio?: string;
    }): Promise<AuthResult> {
        const client = this.getClient();
        if (!client) {
            return { user: null, error: 'Supabase not configured' };
        }

        try {
            const updateData: any = {};

            if (updates.email) {
                updateData.email = updates.email;
            }

            if (updates.phone) {
                updateData.phone = updates.phone;
            }

            if (updates.name || updates.bio) {
                updateData.data = {};
                if (updates.name) updateData.data.name = updates.name;
                if (updates.bio) updateData.data.bio = updates.bio;
            }

            const { data, error } = await client.auth.updateUser(updateData);

            if (error) {
                return { user: null, error: error.message };
            }

            if (data.user) {
                const user: User = {
                    id: data.user.id,
                    email: data.user.email!,
                    name: data.user.user_metadata.name || updates.name || '',
                    avatar: data.user.user_metadata.avatar_url,
                    token: '',
                };

                return { user, error: null };
            }

            return { user: null, error: 'Update failed' };
        } catch (error) {
            return { user: null, error: (error as Error).message };
        }
    }
}

export const supabaseAuth = new SupabaseAuthService();

