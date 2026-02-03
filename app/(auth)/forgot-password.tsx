import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

const schema = z.object({
    email: z.string().min(1, 'E-posta adresi giriniz').email('Geçerli bir e-posta adresi giriniz'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { theme, isDarkMode } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { email: '' },
    });

    const emailValue = watch('email');

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsSuccess(true);
        }, 1500);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Back Button */}
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <View style={[styles.backCircle, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#f8f9fa' }]}>
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </View>
                    </Pressable>

                    {/* Header Illustration */}
                    <View style={styles.illustrationContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? 'rgba(229, 9, 20, 0.15)' : '#FFF3F3' }]}>
                            <Ionicons name="lock-open-outline" size={48} color={theme.primary} />
                        </View>
                        <View style={[styles.lockBadge, { backgroundColor: theme.primary }]}>
                            <Ionicons name="mail" size={20} color="white" />
                        </View>
                    </View>

                    {/* Title Section */}
                    <View style={styles.titleContainer}>
                        <Text style={[styles.title, { color: theme.text }]}>{t('auth.forgotPassword')}</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            {isSuccess
                                ? t('auth.resetEmailSent')
                                : t('auth.forgotPasswordMessage')}
                        </Text>
                    </View>

                    {!isSuccess ? (
                        // Form Section
                        <View style={styles.formContainer}>
                            {/* Email Input */}
                            <View style={styles.inputWrapper}>
                                <Text style={[styles.label, { color: theme.text }]}>{t('auth.email')}</Text>
                                <Controller
                                    control={control}
                                    name="email"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <View
                                            style={[
                                                styles.inputContainer,
                                                {
                                                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8f9fa',
                                                    borderColor: errors.email ? theme.primary : 'transparent',
                                                }
                                            ]}
                                        >
                                            <Ionicons
                                                name="mail-outline"
                                                size={20}
                                                color={errors.email ? theme.primary : theme.textSecondary}
                                                style={styles.inputIcon}
                                            />
                                            <TextInput
                                                style={[styles.input, { color: theme.text }]}
                                                placeholder={t('auth.email')}
                                                placeholderTextColor={theme.textSecondary}
                                                value={value}
                                                onBlur={onBlur}
                                                onChangeText={onChange}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                editable={!isLoading}
                                            />
                                            {value.length > 0 && !errors.email && (
                                                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                                            )}
                                        </View>
                                    )}
                                />
                                {errors.email ? (
                                    <Text style={[styles.errorText, { color: theme.primary }]}>{errors.email.message}</Text>
                                ) : (
                                    <Text style={[styles.hintText, { color: theme.textSecondary }]}>{t('auth.enterRegisteredEmail')}</Text>
                                )}
                            </View>

                            {/* Reset Button */}
                            <Pressable
                                style={[
                                    styles.resetButton,
                                    { backgroundColor: theme.primary },
                                    isLoading && styles.buttonDisabled,
                                    !emailValue && { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#ccc' },
                                ]}
                                onPress={handleSubmit(onSubmit)}
                                disabled={isLoading || !emailValue}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Text style={styles.buttonText}>{t('auth.sendResetLink')}</Text>
                                        <Ionicons
                                            name="arrow-forward"
                                            size={20}
                                            color="white"
                                            style={styles.buttonIcon}
                                        />
                                    </>
                                )}
                            </Pressable>
                        </View>
                    ) : (
                        // Success Section
                        <View style={styles.successContainer}>
                            <View style={styles.successIcon}>
                                <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
                            </View>
                            <Text style={[styles.successEmail, { color: theme.text }]}>{emailValue}</Text>
                            <Text style={[styles.successText, { color: theme.textSecondary }]}>
                                {t('auth.checkInbox')}
                            </Text>
                            <Pressable
                                style={[styles.backToLoginButton, { backgroundColor: theme.text }]}
                                onPress={() => router.replace('/(auth)/login')}
                            >
                                <Text style={styles.backToLoginText}>{t('auth.backToLogin')}</Text>
                            </Pressable>

                            {/* Resend Option */}
                            <Pressable
                                style={styles.resendButton}
                                onPress={() => {
                                    setIsSuccess(false);
                                    reset();
                                }}
                            >
                                <Text style={[styles.resendText, { color: theme.primary }]}>{t('auth.tryDifferentEmail')}</Text>
                            </Pressable>
                        </View>
                    )}

                    {/* Help Section */}
                    {!isSuccess && (
                        <View style={[styles.helpContainer, { borderTopColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }]}>
                            <Text style={[styles.helpText, { color: theme.textSecondary }]}>{t('auth.needHelp')}</Text>
                            <Pressable onPress={() => router.push('/(auth)/login')}>
                                <Text style={[styles.helpLink, { color: theme.primary }]}>{t('auth.login')}</Text>
                            </Pressable>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 20 : 40,
    },
    backButton: {
        marginBottom: 32,
    },
    backCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    illustrationContainer: {
        alignSelf: 'center',
        marginBottom: 32,
        position: 'relative',
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lockBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'transparent',
    },
    titleContainer: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    formContainer: {
        width: '100%',
    },
    inputWrapper: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        paddingLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 2,
    },
    inputError: {
        backgroundColor: '#FFF3F3',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    errorText: {
        fontSize: 13,
        marginTop: 8,
        marginLeft: 4,
        fontWeight: '500',
    },
    hintText: {
        fontSize: 13,
        marginTop: 8,
        marginLeft: 4,
    },
    resetButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonInactive: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    buttonIcon: {
        marginLeft: 8,
    },
    successContainer: {
        alignItems: 'center',
        paddingTop: 20,
    },
    successIcon: {
        marginBottom: 24,
    },
    successEmail: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        paddingHorizontal: 20,
        textAlign: 'center',
    },
    successText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    backToLoginButton: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 16,
    },
    backToLoginText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    resendButton: {
        padding: 12,
    },
    resendText: {
        fontSize: 14,
        fontWeight: '600',
    },
    helpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
        paddingTop: 32,
        borderTopWidth: 1,
    },
    helpText: {
        fontSize: 14,
        marginRight: 4,
    },
    helpLink: {
        fontSize: 14,
        fontWeight: '600',
    },
});
