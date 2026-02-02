import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
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

    const handleLanguageSelect = async (langCode: Language) => {
        await i18n.changeLanguage(langCode);
        router.dismiss();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top', 'left', 'right']}>
            <Stack.Screen
                options={{
                    title: t('settings.language'),
                    presentation: 'formSheet',
                    sheetGrabberVisible: true,
                    sheetAllowedDetents: [0.4, 0.6],
                    sheetElevation: 8,
                    sheetCornerRadius: 28,
                    contentStyle: { backgroundColor: 'transparent' },
                    headerStyle: { backgroundColor: isDarkMode ? '#000000' : '#ffffff' },
                    headerShadowVisible: false,
                    headerTintColor: theme.text,
                }}
            />

            {/* Backdrop */}
            <Pressable
                style={styles.backdrop}
                onPress={() => router.dismiss()}
            />

            {/* Solid Background Sheet - Black for dark, White for light */}
            <View style={[styles.sheetContainer, {
                backgroundColor: isDarkMode ? '#000000' : '#ffffff',
            }]}>
                {/* Glass header accent */}
                <View style={[styles.glassHeaderAccent, {
                    backgroundColor: isDarkMode
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.03)',
                }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={[styles.iconWrapper, { backgroundColor: theme.primaryLight }]}>
                            <Ionicons name="language" size={22} color={theme.primary} />
                        </View>
                        <Text style={[styles.title, { color: theme.text }]}>{t('settings.language')}</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            {t('settings.language')} seçin
                        </Text>
                    </View>
                </View>

                {/* Language List */}
                <View style={styles.languageList}>
                    {languages.map((lang) => {
                        const isSelected = currentLanguage === lang.code;
                        return (
                            <Pressable
                                key={lang.code}
                                style={({ pressed }) => [
                                    styles.languageItem,
                                    {
                                        backgroundColor: isSelected
                                            ? theme.primaryLight
                                            : pressed
                                                ? isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                                                : 'transparent',
                                    },
                                ]}
                                onPress={() => handleLanguageSelect(lang.code)}
                            >
                                <View style={styles.languageLeft}>
                                    <Text style={styles.flag}>{lang.flag}</Text>
                                    <View style={styles.languageText}>
                                        <Text style={[styles.languageName, { color: theme.text }]}>
                                            {lang.nativeName}
                                        </Text>
                                        <Text style={[styles.languageSubtitle, { color: theme.textSecondary }]}>
                                            {lang.name}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.languageRight}>
                                    {isSelected ? (
                                        <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                                            <Ionicons name="checkmark" size={14} color="#fff" />
                                        </View>
                                    ) : (
                                        <View style={[styles.uncheckCircle, { borderColor: isDarkMode ? '#444' : '#ddd' }]} />
                                    )}
                                </View>
                            </Pressable>
                        );
                    })}
                </View>

                {/* Footer accent */}
                <View style={[styles.glassFooterAccent, {
                    backgroundColor: isDarkMode
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(0, 0, 0, 0.02)',
                }]}>
                    {/* Cancel Button */}
                    <Pressable
                        style={[styles.cancelButton, {
                            backgroundColor: isDarkMode
                                ? 'rgba(255,255,255,0.1)'
                                : 'rgba(0,0,0,0.05)'
                        }]}
                        onPress={() => router.dismiss()}
                    >
                        <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
                            {t('common.cancel')}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    sheetContainer: {
        width: '100%',
        maxHeight: '65%',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
        paddingBottom: 8,
    },
    glassHeaderAccent: {
        paddingTop: 20,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 28,
    },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        opacity: 0.7,
    },
    languageList: {
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    languageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
    },
    languageLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    flag: {
        fontSize: 28,
        marginRight: 14,
    },
    languageText: {
        flex: 1,
    },
    languageName: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 2,
    },
    languageSubtitle: {
        fontSize: 13,
        opacity: 0.6,
    },
    languageRight: {
        width: 26,
        height: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uncheckCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
    },
    glassFooterAccent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
    },
    cancelButton: {
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 16,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
