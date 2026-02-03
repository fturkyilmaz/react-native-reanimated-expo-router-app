import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RegisterFormData, registerSchema } from '@/schemas/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export default function RegisterScreen() {
    const { register, isLoading } = useAuth();
    const { t } = useTranslation();
    const { theme, isDarkMode } = useTheme();

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            await register(data.email, data.password, data.name);
        } catch (error) {
            console.error('Register error:', error);
        }
    };

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
                        <Ionicons name="person-add" size={40} color={theme.primary} />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>{t('auth.register')}</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('auth.discoverMovies')}</Text>
                </View>

                {/* Form */}
                <View style={[styles.form, { gap: 12 }]}>
                    {/* Name */}
                    <Controller
                        control={control}
                        name="name"
                        render={({ field: { onChange, value } }) => (
                            <View style={[
                                styles.inputContainer,
                                {
                                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#FAFAFA',
                                    borderColor: errors.name ? theme.primary : (isDarkMode ? 'rgba(255,255,255,0.1)' : '#E0E0E0'),
                                }
                            ]}>
                                <Ionicons name="person-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }, errors.name && { borderColor: theme.primary }]}
                                    placeholder={t('auth.name')}
                                    placeholderTextColor={theme.textSecondary}
                                    value={value}
                                    onChangeText={onChange}
                                    autoCapitalize="words"
                                    editable={!isLoading}
                                />
                            </View>
                        )}
                    />
                    {errors.name && <Text style={[styles.errorText, { color: theme.primary }]}>{errors.name.message}</Text>}

                    {/* Email */}
                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, value } }) => (
                            <View style={[
                                styles.inputContainer,
                                {
                                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#FAFAFA',
                                    borderColor: errors.email ? theme.primary : (isDarkMode ? 'rgba(255,255,255,0.1)' : '#E0E0E0'),
                                }
                            ]}>
                                <Ionicons name="mail-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }, errors.email && { borderColor: theme.primary }]}
                                    placeholder={t('auth.email')}
                                    placeholderTextColor={theme.textSecondary}
                                    value={value}
                                    onChangeText={onChange}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                />
                            </View>
                        )}
                    />
                    {errors.email && <Text style={[styles.errorText, { color: theme.primary }]}>{errors.email.message}</Text>}

                    {/* Password */}
                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, value } }) => (
                            <View style={[
                                styles.inputContainer,
                                {
                                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#FAFAFA',
                                    borderColor: errors.password ? theme.primary : (isDarkMode ? 'rgba(255,255,255,0.1)' : '#E0E0E0'),
                                }
                            ]}>
                                <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }, errors.password && { borderColor: theme.primary }]}
                                    placeholder={t('auth.password')}
                                    placeholderTextColor={theme.textSecondary}
                                    value={value}
                                    onChangeText={onChange}
                                    secureTextEntry
                                    editable={!isLoading}
                                />
                            </View>
                        )}
                    />
                    {errors.password && <Text style={[styles.errorText, { color: theme.primary }]}>{errors.password.message}</Text>}

                    {/* Confirm Password */}
                    <Controller
                        control={control}
                        name="confirmPassword"
                        render={({ field: { onChange, value } }) => (
                            <View style={[
                                styles.inputContainer,
                                {
                                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#FAFAFA',
                                    borderColor: errors.confirmPassword ? theme.primary : (isDarkMode ? 'rgba(255,255,255,0.1)' : '#E0E0E0'),
                                }
                            ]}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }, errors.confirmPassword && { borderColor: theme.primary }]}
                                    placeholder={t('auth.confirmPassword')}
                                    placeholderTextColor={theme.textSecondary}
                                    value={value}
                                    onChangeText={onChange}
                                    secureTextEntry
                                    editable={!isLoading}
                                />
                            </View>
                        )}
                    />
                    {errors.confirmPassword && <Text style={[styles.errorText, { color: theme.primary }]}>{errors.confirmPassword.message}</Text>}

                    {/* Register Button */}
                    <Pressable
                        style={[styles.button, { backgroundColor: theme.primary }, isLoading && styles.buttonDisabled]}
                        onPress={handleSubmit(onSubmit)}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>{t('auth.register')}</Text>
                                <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
                            </>
                        )}
                    </Pressable>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={[styles.dividerLine, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E0E0E0' }]} />
                        <Text style={[styles.dividerText, { color: theme.textSecondary }]}>{t('common.or')}</Text>
                        <View style={[styles.dividerLine, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E0E0E0' }]} />
                    </View>

                    {/* Social Register */}
                    <View style={styles.socialContainer}>
                        <Pressable style={[styles.socialButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F5F5F5' }]}>
                            <Ionicons name="logo-google" size={24} color="#DB4437" />
                        </Pressable>
                        <Pressable style={[styles.socialButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F5F5F5' }]}>
                            <Ionicons name="logo-apple" size={24} color={isDarkMode ? '#fff' : '#000'} />
                        </Pressable>
                        <Pressable style={[styles.socialButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F5F5F5' }]}>
                            <Ionicons name="logo-facebook" size={24} color="#4267B2" />
                        </Pressable>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>{t('auth.hasAccount')} </Text>
                    <Link href="/(auth)/login" asChild>
                        <Pressable>
                            <Text style={[styles.footerLink, { color: theme.primary }]}>{t('auth.login')}</Text>
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
        marginBottom: 8,
        marginLeft: 4,
    },
    button: {
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
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
    buttonIcon: {
        marginLeft: 8,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    socialButton: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
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
});
