/**
 * Edit Profile Screen
 * 
 * Allows users to edit their profile information using react-hook-form.
 * 
 * Usage:
 * - Accessed from Settings screen via "Edit Profile" button
 * - Uses useUpdateProfile mutation hook for form submission
 * - Shows validation errors inline
 * - Handles unsaved changes with confirmation dialog
 */

import { useUpdateProfile } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { logger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import {
    KeyboardAwareScrollView,
    KeyboardToolbar,
} from 'react-native-keyboard-controller';
import { z } from 'zod';

// Validation schema
const profileSchema = z.object({
    name: z.string().min(2, 'editProfile.nameRequired'),
    email: z.string().email('editProfile.emailInvalid'),
    phone: z.string().optional(),
    bio: z.string().max(200, 'editProfile.bioMaxLength').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditProfileScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const { mutate: updateProfile, isPending, isError, error } = useUpdateProfile();

    const [hasChanges, setHasChanges] = useState(false);

    // Refs for input focus management
    const emailInputRef = useRef<TextInput>(null);
    const phoneInputRef = useRef<TextInput>(null);
    const bioInputRef = useRef<TextInput>(null);

    // Initialize form with user data
    const {
        control,
        handleSubmit,
        formState: { errors, isDirty },
        reset,
        watch,
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            bio: user?.bio || '',
        },
    });

    // Watch form values for changes
    const formValues = watch();

    useEffect(() => {
        setHasChanges(isDirty);
    }, [isDirty]);

    const handleSave = (data: ProfileFormData) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        updateProfile(data, {
            onSuccess: () => {
                logger.auth.info('Profile updated successfully', { userId: user?.id });
                Alert.alert(
                    t('common.success'),
                    t('editProfile.success'),
                    [{ text: t('common.ok'), onPress: () => router.back() }]
                );
            },
            onError: (err) => {
                logger.auth.error('Profile update failed', { error: err.message });
                Alert.alert(t('common.error'), t('editProfile.updateError'));
            },
        });
    };

    const handleCancel = () => {
        if (hasChanges) {
            Alert.alert(
                t('editProfile.discardTitle'),
                t('editProfile.discardMessage'),
                [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                        text: t('editProfile.discard'),
                        style: 'destructive',
                        onPress: () => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        },
                    },
                ]
            );
        } else {
            router.back();
        }
    };

    const handleAvatarPress = () => {
        logger.info('Avatar change requested');
        Alert.alert(t('editProfile.changeAvatar'), t('editProfile.avatarOptions'));
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: t('editProfile.title'),
                    headerTitleStyle: { color: theme.text, fontWeight: '600' },
                    headerStyle: { backgroundColor: theme.card },
                    headerTintColor: theme.text,
                    headerShadowVisible: false,
                    headerLeft: () => (
                        <Pressable onPress={handleCancel} hitSlop={8}>
                            <Text style={[styles.cancelButton, { color: theme.textSecondary }]}>
                                {t('common.cancel')}
                            </Text>
                        </Pressable>
                    ),
                    headerRight: () =>
                        isPending ? (
                            <ActivityIndicator color={theme.primary} />
                        ) : (
                            <Pressable
                                onPress={handleSubmit(handleSave)}
                                hitSlop={8}
                                disabled={!hasChanges && !isDirty}
                            >
                                <Text
                                    style={[
                                        styles.saveButton,
                                        {
                                            color:
                                                hasChanges || isDirty
                                                    ? theme.primary
                                                    : theme.textMuted,
                                        },
                                    ]}
                                >
                                    {t('common.save')}
                                </Text>
                            </Pressable>
                        ),
                }}
            />

            <KeyboardAwareScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bottomOffset={100}
            >
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{
                                uri: user?.avatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=E50914&color=fff&size=128`,
                            }}
                            style={styles.avatar}
                        />
                        <Pressable
                            style={[styles.cameraButton, { backgroundColor: theme.primary }]}
                            onPress={handleAvatarPress}
                        >
                            <Ionicons name="camera" size={18} color="white" />
                        </Pressable>
                    </View>
                    <Pressable onPress={handleAvatarPress}>
                        <Text style={[styles.changeAvatarText, { color: theme.primary }]}>
                            {t('editProfile.changeAvatar')}
                        </Text>
                    </Pressable>
                </View>

                {/* Form Fields */}
                <View style={[styles.formSection, { backgroundColor: theme.card }]}>
                    {/* Name Field */}
                    <View style={styles.fieldContainer}>
                        <Text style={[styles.fieldLabel, { color: theme.text }]}>
                            {t('editProfile.name')}
                            <Text style={styles.required}> *</Text>
                        </Text>
                        <Controller
                            control={control}
                            name="name"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    style={[
                                        styles.textInput,
                                        {
                                            backgroundColor: theme.background,
                                            color: theme.text,
                                            borderColor: errors.name
                                                ? theme.error
                                                : theme.divider,
                                        },
                                    ]}
                                    placeholder={t('editProfile.namePlaceholder')}
                                    placeholderTextColor={theme.textMuted}
                                    value={value}
                                    onChangeText={(text) => {
                                        onChange(text);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                    onBlur={onBlur}
                                    autoCapitalize="words"
                                    returnKeyType="next"
                                    onSubmitEditing={() => emailInputRef.current?.focus()}
                                    blurOnSubmit={false}
                                    maxLength={50}
                                    accessibilityLabel={t('editProfile.name')}
                                    accessibilityHint={t('editProfile.nameHint')}
                                />
                            )}
                        />
                        {errors.name && (
                            <Text style={[styles.errorText, { color: theme.error }]}>
                                {t(errors.name.message || 'common.error')}
                            </Text>
                        )}
                    </View>

                    {/* Email Field */}
                    <View style={styles.fieldContainer}>
                        <Text style={[styles.fieldLabel, { color: theme.text }]}>
                            {t('editProfile.email')}
                            <Text style={styles.required}> *</Text>
                        </Text>
                        <Controller
                            control={control}
                            name="email"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    ref={emailInputRef}
                                    style={[
                                        styles.textInput,
                                        {
                                            backgroundColor: theme.background,
                                            color: theme.text,
                                            borderColor: errors.email
                                                ? theme.error
                                                : theme.divider,
                                        },
                                    ]}
                                    placeholder={t('editProfile.emailPlaceholder')}
                                    placeholderTextColor={theme.textMuted}
                                    value={value}
                                    onChangeText={(text) => {
                                        onChange(text);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                    onBlur={onBlur}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                    onSubmitEditing={() => phoneInputRef.current?.focus()}
                                    blurOnSubmit={false}
                                    maxLength={100}
                                    accessibilityLabel={t('editProfile.email')}
                                    accessibilityHint={t('editProfile.emailHint')}
                                />
                            )}
                        />
                        {errors.email && (
                            <Text style={[styles.errorText, { color: theme.error }]}>
                                {t(errors.email.message || 'common.error')}
                            </Text>
                        )}
                    </View>

                    {/* Phone Field */}
                    <View style={styles.fieldContainer}>
                        <Text style={[styles.fieldLabel, { color: theme.text }]}>
                            {t('editProfile.phone')}
                        </Text>
                        <Controller
                            control={control}
                            name="phone"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    ref={phoneInputRef}
                                    style={[
                                        styles.textInput,
                                        {
                                            backgroundColor: theme.background,
                                            color: theme.text,
                                            borderColor: theme.divider,
                                        },
                                    ]}
                                    placeholder={t('editProfile.phonePlaceholder')}
                                    placeholderTextColor={theme.textMuted}
                                    value={value}
                                    onChangeText={(text) => {
                                        onChange(text);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                    onBlur={onBlur}
                                    keyboardType="phone-pad"
                                    returnKeyType="next"
                                    onSubmitEditing={() => bioInputRef.current?.focus()}
                                    blurOnSubmit={false}
                                    maxLength={20}
                                    accessibilityLabel={t('editProfile.phone')}
                                />
                            )}
                        />
                    </View>

                    {/* Bio Field */}
                    <View style={styles.fieldContainer}>
                        <Text style={[styles.fieldLabel, { color: theme.text }]}>
                            {t('editProfile.bio')}
                        </Text>
                        <Controller
                            control={control}
                            name="bio"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    ref={bioInputRef}
                                    style={[
                                        styles.bioInput,
                                        {
                                            backgroundColor: theme.background,
                                            color: theme.text,
                                            borderColor: theme.divider,
                                        },
                                    ]}
                                    placeholder={t('editProfile.bioPlaceholder')}
                                    placeholderTextColor={theme.textMuted}
                                    value={value}
                                    onChangeText={(text) => {
                                        onChange(text);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                    onBlur={onBlur}
                                    multiline
                                    textAlignVertical="top"
                                    returnKeyType="done"
                                    maxLength={200}
                                    accessibilityLabel={t('editProfile.bio')}
                                />
                            )}
                        />
                        <Text style={[styles.charCount, { color: theme.textMuted }]}>
                            {formValues.bio?.length || 0}/200
                        </Text>
                    </View>
                </View>

                {/* Error Message */}
                {isError && (
                    <View style={[styles.errorBanner, { backgroundColor: theme.errorLight }]}>
                        <Ionicons name="alert-circle" size={20} color={theme.error} />
                        <Text style={[styles.errorBannerText, { color: theme.error }]}>
                            {t('editProfile.updateError')}
                        </Text>
                    </View>
                )}

                {/* Save Button (Mobile fallback) */}
                <Pressable
                    style={[
                        styles.saveButtonLarge,
                        {
                            backgroundColor:
                                hasChanges || isDirty ? theme.primary : theme.textMuted,
                        },
                    ]}
                    onPress={handleSubmit(handleSave)}
                    disabled={(!hasChanges && !isDirty) || isPending}
                >
                    {isPending ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.saveButtonLargeText}>
                            {t('editProfile.saveChanges')}
                        </Text>
                    )}
                </Pressable>
            </KeyboardAwareScrollView>

            {/* Keyboard Toolbar for navigation between inputs */}
            <KeyboardToolbar />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    cancelButton: {
        fontSize: 16,
        fontWeight: '500',
    },
    saveButton: {
        fontSize: 16,
        fontWeight: '600',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    changeAvatarText: {
        fontSize: 14,
        fontWeight: '600',
    },
    formSection: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    fieldContainer: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    required: {
        color: '#CF6679',
    },
    textInput: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    bioInput: {
        height: 100,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    charCount: {
        fontSize: 12,
        textAlign: 'right',
        marginTop: 4,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    errorBannerText: {
        marginLeft: 8,
        fontSize: 14,
        flex: 1,
    },
    saveButtonLarge: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonLargeText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
