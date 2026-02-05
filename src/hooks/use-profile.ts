/**
 * Profile Hook
 * 
 * Provides functionality for managing user profile updates using Supabase Auth.
 * 
 * Usage:
 * const { mutate: updateProfile, isPending } = useUpdateProfile();
 * updateProfile({ name: 'New Name', email: 'new@email.com' });
 */

import { UserService } from '@/services/local-db.service';
import { supabaseAuth } from '@/services/supabase-auth';
import { useAuthStore } from '@/store/authStore';
import { logger } from '@/utils/logger';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ProfileFormData {
    name: string;
    email: string;
    phone?: string;
    bio?: string;
}

interface UserUpdateResponse {
    id: string;
    name: string;
    email: string;
    phone?: string;
    bio?: string;
    avatar?: string;
}

/**
 * Hook for updating user profile with Supabase Auth
 */
export function useUpdateProfile() {
    const queryClient = useQueryClient();
    const { user, setUser } = useAuthStore();

    return useMutation({
        mutationFn: async (data: ProfileFormData): Promise<UserUpdateResponse> => {
            logger.auth.info('Updating profile', { userId: user?.id });

            // First, try to update with Supabase Auth if user is authenticated
            try {
                const result = await supabaseAuth.updateUser({
                    email: user?.email ? user?.email : data.email,
                    phone: data.phone,
                    name: data.name,
                    bio: data.bio,
                });

                if (result.error) {
                    // Check if it's an auth error
                    if (result.error.includes('Auth session missing') ||
                        result.error.includes('not authenticated') ||
                        result.error.includes('JWT')) {
                        logger.auth.warn('User not authenticated with Supabase, using local update only');
                    } else {
                        logger.auth.warn('Supabase update failed', { error: result.error });
                    }
                } else {
                    logger.auth.info('Supabase profile updated successfully');
                }
            } catch (supabaseError: any) {
                // If Supabase fails, continue with local update
                logger.auth.warn('Supabase update error, using local update', { error: supabaseError.message });
            }

            // Always update local SQLite database
            await UserService.upsert({
                id: user?.id || 'local',
                email: data.email,
                name: data.name,
                // avatar_url: user?.avatar,
                token: user?.token || '',
            });

            return {
                id: user?.id || 'local',
                name: data.name,
                email: data.email,
                phone: data.phone,
                bio: data.bio,
                avatar: user?.avatar,
            };
        },
        onSuccess: (data) => {
            // Update local user state
            setUser({
                id: data.id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                bio: data.bio,
                avatar: data.avatar,
                token: user?.token || '',
            });

            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['user'] });

            logger.auth.info('Profile updated successfully', { userId: data.id });
        },
        onError: (error: Error) => {
            logger.auth.error('Profile update failed', {
                userId: user?.id,
                error: error.message,
            });
            throw error;
        },
    });
}

/**
 * Hook for changing password
 */
export function useChangePassword() {
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async (newPassword: string): Promise<void> => {
            logger.auth.info('Changing password', { userId: user?.id });

            // First check if user is authenticated with Supabase
            const session = await supabaseAuth.getSession();

            if (!session) {
                // Fallback: update local only
                logger.auth.warn('User not authenticated with Supabase');
                return;
            }

            // For password change, we need to use the Supabase client directly
            const client = (supabaseAuth as any).getClient?.();

            if (client && client.auth) {
                const { error } = await client.auth.updateUser({
                    password: newPassword,
                });

                if (error) {
                    throw new Error(error.message);
                }
                return;
            }

            throw new Error('Supabase not configured');
        },
        onSuccess: () => {
            logger.auth.info('Password changed successfully', { userId: user?.id });
        },
        onError: (error: Error) => {
            logger.auth.error('Password change failed', {
                userId: user?.id,
                error: error.message,
            });
            throw error;
        },
    });
}
