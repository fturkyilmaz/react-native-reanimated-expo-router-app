/**
 * Profile Hook
 * 
 * Provides functionality for managing user profile updates.
 * 
 * Usage:
 * const { mutate: updateProfile, isPending } = useUpdateProfile();
 * updateProfile({ name: 'New Name', email: 'new@email.com' });
 */

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
 * Hook for updating user profile
 */
export function useUpdateProfile() {
    const queryClient = useQueryClient();
    const { user, setUser } = useAuthStore();

    return useMutation({
        mutationFn: async (data: ProfileFormData): Promise<UserUpdateResponse> => {
            logger.auth.info('Updating profile', { userId: user?.id });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // In a real app, this would be an API call:
            // const response = await apiClient.put('/user/profile', data);

            // Mock successful response
            const response: UserUpdateResponse = {
                id: user?.id || '1',
                name: data.name,
                email: data.email,
                phone: data.phone,
                bio: data.bio,
                avatar: user?.avatar,
            };

            return response;
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
        },
    });
}

/**
 * Hook for changing password
 */
export function useChangePassword() {
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
            logger.auth.info('Changing password', { userId: user?.id });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock successful response
            return { success: true };
        },
        onSuccess: () => {
            logger.auth.info('Password changed successfully', { userId: user?.id });
        },
        onError: (error: Error) => {
            logger.auth.error('Password change failed', {
                userId: user?.id,
                error: error.message,
            });
        },
    });
}

/**
 * Hook for uploading avatar
 */
export function useUploadAvatar() {
    const queryClient = useQueryClient();
    const { user, setUser } = useAuthStore();

    return useMutation({
        mutationFn: async (avatarUri: string) => {
            logger.auth.info('Uploading avatar', { userId: user?.id });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Mock response with new avatar URL
            const newAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=E50914&color=fff&size=128&t=${Date.now()}`;

            return { avatarUrl: newAvatarUrl };
        },
        onSuccess: (data) => {
            setUser({ avatar: data.avatarUrl });
            queryClient.invalidateQueries({ queryKey: ['user'] });
            logger.auth.info('Avatar uploaded successfully', { userId: user?.id });
        },
        onError: (error: Error) => {
            logger.auth.error('Avatar upload failed', {
                userId: user?.id,
                error: error.message,
            });
        },
    });
}
