import { useTheme } from '@/hooks/use-theme';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { LoginFormData, loginSchema } from '@/schemas/auth';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function LoginScreen() {
    const router = useRouter();
    const { login, isLoading, error, clearError, isBiometricEnabled, enableBiometric } = useAuthStore();
    const { t } = useTranslation();
    const { isAvailable, isEnrolled, biometricType, authenticate, getBiometricTypeName, checkBiometricSupport } = useBiometricAuth();
    const { theme, isDarkMode } = useTheme();
    const [showBiometricButton, setShowBiometricButton] = useState(true);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: 'test@test.com',
            password: '123456',
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            clearError();
            await login(data.email, data.password);

            if (isAvailable && isEnrolled && !isBiometricEnabled) {
                showBiometricEnablePrompt();
            } else {
                router.replace('/(tabs)');
            }
        } catch (error) { }
    };

    const handleBiometricLogin = async () => {
        const result = await authenticate(
            t('biometric.promptTitle'),
            t('common.cancel')
        );

        if (result.success) {
            try {
                clearError();
                await login('test@test.com', '123456');
                router.replace('/(tabs)');
            } catch (error) { }
        }
    };

    const showBiometricEnablePrompt = () => {
        Alert.alert(
            t('biometric.enablePromptTitle'),
            t('biometric.enablePromptMessage', { type: getBiometricTypeName(biometricType) }),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                    onPress: () => router.replace('/(tabs)'),
                },
                {
                    text: t('biometric.enable'),
                    onPress: async () => {
                        try {
                            await enableBiometric(biometricType);
                            router.replace('/(tabs)');
                        } catch (error) {
                            router.replace('/(tabs)');
                        }
                    },
                },
            ]
        );
    };

    useEffect(() => {
        checkBiometricSupport().then((support) => {
            setShowBiometricButton(support.isAvailable && support.isEnrolled);
        });
    }, [checkBiometricSupport]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={[styles.scrollContent, { padding: 24, gap: 24 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(229, 9, 20, 0.15)' : '#FFF3F3' }]}>
                        <Ionicons name="film" size={40} color={theme.primary} />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>{t('auth.welcomeBack')}</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('auth.discoverMovies')}</Text>
                </View>

                {/* Form */}
                <View style={[styles.form, { gap: 16 }]}>
                    {error && (
                        <View style={[styles.globalErrorContainer, { backgroundColor: isDarkMode ? 'rgba(229, 9, 20, 0.15)' : '#FFF3F3' }]}>
                            <Ionicons name="alert-circle" size={20} color={theme.primary} />
                            <Text style={[styles.globalErrorText, { color: theme.primary }]}>{error}</Text>
                        </View>
                    )}

                    {/* Email Input */}
                    <View style={styles.inputWrapper}>
                        <View style={[
                            styles.inputContainer,
                            {
                                borderColor: errors.email ? theme.primary : (isDarkMode ? 'rgba(255,255,255,0.1)' : '#E0E0E0'),
                                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#FAFAFA',
                            },
                            errors.email && { backgroundColor: isDarkMode ? 'rgba(229, 9, 20, 0.1)' : '#FFF3F3' }
                        ]}>
                            <Ionicons name="mail-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        placeholder={t('auth.email')}
                                        placeholderTextColor={theme.textSecondary}
                                        value={value}
                                        onChangeText={(text) => {
                                            onChange(text);
                                            if (error) clearError();
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        editable={!isLoading}
                                    />
                                )}
                            />
                        </View>
                        {errors.email && (
                            <Text style={[styles.errorText, { color: theme.primary }]}>{errors.email.message}</Text>
                        )}
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputWrapper}>
                        <View style={[
                            styles.inputContainer,
                            {
                                borderColor: errors.password ? theme.primary : (isDarkMode ? 'rgba(255,255,255,0.1)' : '#E0E0E0'),
                                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#FAFAFA',
                            },
                            errors.password && { backgroundColor: isDarkMode ? 'rgba(229, 9, 20, 0.1)' : '#FFF3F3' }
                        ]}>
                            <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                            <Controller
                                control={control}
                                name="password"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        placeholder={t('auth.password')}
                                        placeholderTextColor={theme.textSecondary}
                                        secureTextEntry
                                        value={value}
                                        onChangeText={(text) => {
                                            onChange(text);
                                            if (error) clearError();
                                        }}
                                        editable={!isLoading}
                                    />
                                )}
                            />
                        </View>
                        {errors.password && (
                            <Text style={[styles.errorText, { color: theme.primary }]}>{errors.password.message}</Text>
                        )}
                    </View>

                    <Pressable
                        style={styles.forgotPassword}
                        onPress={() => router.push('/(auth)/forgot-password')}
                    >
                        <Text style={[styles.forgotPasswordText, { color: theme.textSecondary }]}>{t('auth.forgotPassword')}</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.button, { backgroundColor: theme.primary }, isLoading && styles.buttonDisabled]}
                        onPress={handleSubmit(onSubmit)}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>{t('auth.login')}</Text>
                        )}
                    </Pressable>

                    {/* Biometric Login Button */}
                    {showBiometricButton && (
                        <Pressable
                            style={styles.biometricButton}
                            onPress={handleBiometricLogin}
                            disabled={isLoading}
                        >
                            <Ionicons
                                name={biometricType === 'faceID' ? 'scan-outline' : 'finger-print-outline'}
                                size={24}
                                color={theme.primary}
                            />
                            <Text style={[styles.biometricButtonText, { color: theme.primary }]}>
                                {t('biometric.loginWith', { type: getBiometricTypeName(biometricType) })}
                            </Text>
                        </Pressable>
                    )}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>{t('auth.noAccount')} </Text>
                    <Link href="/(auth)/register" asChild>
                        <Pressable>
                            <Text style={[styles.footerLink, { color: theme.primary }]}>{t('auth.register')}</Text>
                        </Pressable>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
    },
    form: {
        width: '100%',
    },
    globalErrorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    globalErrorText: {
        fontSize: 14,
        fontWeight: '500',
    },
    inputWrapper: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
        fontWeight: '500',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
    },
    forgotPasswordText: {
        fontSize: 14,
    },
    button: {
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    footerText: {
        fontSize: 14,
    },
    footerLink: {
        fontSize: 14,
        fontWeight: '600',
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    biometricButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
