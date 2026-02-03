import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Language = 'tr' | 'en';

interface LanguageOption {
    code: Language;
    name: string;
    nativeName: string;
    flag: string;
}

const languages: LanguageOption[] = [
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
];

export default function LanguageSheet() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { theme, isDarkMode } = useTheme();
    const currentLanguage = i18n.language as Language;

    // Selected language state (starts with current language)
    const [selectedLanguage, setSelectedLanguage] = useState<Language>(currentLanguage);
    const [isConfirming, setIsConfirming] = useState(false);

    const handleConfirm = async () => {
        if (isConfirming || selectedLanguage === currentLanguage) {
            router.dismiss();
            return;
        }

        setIsConfirming(true);
        try {
            await i18n.changeLanguage(selectedLanguage);
            router.dismiss();
        } catch (error) {
            console.error('Failed to change language:', error);
        } finally {
            setIsConfirming(false);
        }
    };

    const handleLanguageSelect = (langCode: Language) => {
        setSelectedLanguage(langCode);
    };

    // Dynamic styles based on theme
    const dynamicStyles = useMemo(() => {
        const cardShadow = isDarkMode
            ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
            }
            : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 3,
            };

        return {
            backdrop: {
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
            },
            sheetContainer: {
                backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f8f8',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                ...cardShadow,
            },
            headerIcon: {
                backgroundColor: isDarkMode ? 'rgba(229, 9, 20, 0.15)' : 'rgba(229, 9, 20, 0.1)',
            },
            languageCard: {
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            },
            languageCardSelected: {
                backgroundColor: isDarkMode ? 'rgba(229, 9, 20, 0.12)' : 'rgba(229, 9, 20, 0.08)',
                borderColor: isDarkMode ? 'rgba(229, 9, 20, 0.25)' : 'rgba(229, 9, 20, 0.15)',
            },
            confirmButton: {
                backgroundColor: theme.primary,
            },
        };
    }, [isDarkMode, theme.primary]);

    const hasChanges = selectedLanguage !== currentLanguage;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Stack.Screen
                options={{
                    title: t('settings.language'),
                    sheetGrabberVisible: true,
                    sheetAllowedDetents: [0.4, 0.5],
                    sheetElevation: 12,
                    sheetCornerRadius: 24,
                    contentStyle: { backgroundColor: 'transparent' },
                    headerStyle: {
                        backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f8f8',
                    },
                    headerShadowVisible: false,
                    headerTintColor: theme.text,
                    headerLeft: () => (
                        <Pressable
                            onPress={() => router.dismiss()}
                            style={styles.headerButton}
                            accessibilityLabel={t('common.cancel')}
                        >
                            <Ionicons
                                name="close"
                                size={22}
                                color={theme.text}
                            />
                        </Pressable>
                    ),
                }}
            />

            {/* Backdrop */}
            <Pressable
                style={[styles.backdrop, dynamicStyles.backdrop]}
                onPress={() => router.dismiss()}
            />

            {/* Sheet Container */}
            <View style={[styles.sheetContainer, dynamicStyles.sheetContainer]}>
                {/* Header Section */}
                <View style={styles.headerSection}>
                    {/* Title */}
                    < Text style={[styles.headerTitle, { color: theme.text }]}>
                        {t('settings.language')}
                    </Text>

                    {/* Subtitle */}
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                        {t('language.selectLanguage')}
                    </Text>
                </View>

                {/* Language Cards */}
                <View style={styles.languageList}>
                    {languages.map((lang) => {
                        const isSelected = selectedLanguage === lang.code;

                        return (
                            <Pressable
                                key={lang.code}
                                style={({ pressed }) => [
                                    styles.languageCard,
                                    isSelected ? dynamicStyles.languageCardSelected : dynamicStyles.languageCard,
                                    pressed && styles.languageCardPressed,
                                ]}
                                onPress={() => handleLanguageSelect(lang.code)}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: isSelected }}
                                accessibilityLabel={`${lang.nativeName} - ${lang.name}`}
                            >
                                {/* Flag & Info */}
                                <View style={styles.languageLeft}>
                                    <Text style={styles.flag}>{lang.flag}</Text>
                                    <View style={styles.languageInfo}>
                                        <Text style={[styles.languageName, { color: theme.text }]}>
                                            {lang.nativeName}
                                        </Text>
                                        <Text style={[styles.languageDescription, { color: theme.textSecondary }]}>
                                            {lang.name}
                                        </Text>
                                    </View>
                                </View>

                                {/* Selection Indicator */}
                                <View style={styles.languageRight}>
                                    {isSelected ? (
                                        <View style={[styles.selectedIndicator, { backgroundColor: theme.primary }]}>
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                        </View>
                                    ) : (
                                        <View style={[styles.unselectedIndicator, {
                                            borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
                                        }]} />
                                    )}
                                </View>
                            </Pressable>
                        );
                    })}
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonSection}>
                    {/* Confirm Button */}
                    <Pressable
                        style={[
                            styles.confirmButton,
                            dynamicStyles.confirmButton,
                            (!hasChanges || isConfirming) && styles.buttonDisabled,
                        ]}
                        onPress={handleConfirm}
                        disabled={!hasChanges || isConfirming}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.confirm')}
                    >
                        <Text style={styles.confirmText}>
                            {isConfirming ? t('common.loading') : t('common.confirm')}
                        </Text>
                    </Pressable>
                </View>

                {/* Bottom Safe Area */}
                <View style={styles.bottomSafeArea} />
            </View>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    headerButton: {
        padding: 8,
        marginLeft: 8,
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    sheetContainer: {
        width: '100%',
        maxHeight: '62%',
        paddingTop: 8,
    },
    headerSection: {
        alignItems: 'center',
        paddingTop: 20,
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    headerIconWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 15,
        opacity: 0.7,
        textAlign: 'center',
    },
    languageList: {
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    languageCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 18,
        borderRadius: 16,
        borderWidth: 1,
    },
    languageCardPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.985 }],
    },
    languageLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    flag: {
        fontSize: 30,
        marginRight: 14,
    },
    languageInfo: {
        flex: 1,
    },
    languageName: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 3,
        letterSpacing: -0.2,
    },
    languageDescription: {
        fontSize: 13,
        opacity: 0.6,
    },
    languageRight: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedIndicator: {
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unselectedIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
    },
    buttonSection: {
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 16,
        gap: 10,
    },
    confirmButton: {
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    confirmText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    bottomSafeArea: {
        height: 8,
    },
});
