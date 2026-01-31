import { LoginFormData, loginSchema } from '@/schemas/auth';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen() {
    const router = useRouter();
    const { login, isLoading, error, clearError } = useAuthStore();
    const { t } = useTranslation();

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
            router.replace('/(tabs)');
        } catch (error) { }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="film" size={40} color="#E50914" />
                    </View>
                    <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
                    <Text style={styles.subtitle}>{t('auth.discoverMovies')}</Text>
                </View>

                <View style={styles.form}>
                    {error && (
                        <View style={styles.globalErrorContainer}>
                            <Ionicons name="alert-circle" size={20} color="#E50914" />
                            <Text style={styles.globalErrorText}>{error}</Text>
                        </View>
                    )}

                    {/* Email Input */}
                    <View style={styles.inputWrapper}>
                        <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t('auth.email')}
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
                            <Text style={styles.errorText}>{errors.email.message}</Text>
                        )}
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputWrapper}>
                        <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                            <Controller
                                control={control}
                                name="password"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t('auth.password')}
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
                            <Text style={styles.errorText}>{errors.password.message}</Text>
                        )}
                    </View>

                    <Pressable
                        style={styles.forgotPassword}
                        onPress={() => router.push('/(auth)/forgot-password')}
                    >
                        <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleSubmit(onSubmit)}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>{t('auth.login')}</Text>
                        )}
                    </Pressable>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>{t('auth.noAccount')} </Text>
                    <Link href="/(auth)/register" asChild>
                        <Pressable>
                            <Text style={styles.footerLink}>{t('auth.register')}</Text>
                        </Pressable>
                    </Link>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF3F3',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    form: {
        width: '100%',
    },
    globalErrorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3F3',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    globalErrorText: {
        color: '#E50914',
        fontSize: 14,
        fontWeight: '500',
    },
    inputWrapper: {
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        backgroundColor: '#FAFAFA',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1a1a1a',
    },
    inputError: {
        borderColor: '#E50914',
        backgroundColor: '#FFF3F3',
    },
    errorText: {
        color: '#E50914',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
        fontWeight: '500',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#666',
        fontSize: 14,
    },
    button: {
        backgroundColor: '#E50914',
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#E50914',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
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
        marginTop: 32,
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
    footerLink: {
        color: '#E50914',
        fontSize: 14,
        fontWeight: '600',
    },
});