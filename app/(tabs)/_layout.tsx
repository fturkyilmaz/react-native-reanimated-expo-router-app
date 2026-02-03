import { useTheme } from '@/hooks/use-theme';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();

  return (
    <NativeTabs
      iconColor={{
        default: isDarkMode ? '#666666' : '#787878',
        selected: '#E50914',
      }}
      backgroundColor={isDarkMode ? 'rgba(20,20,20,0.95)' : 'rgba(255,255,255,0.95)'}
      blurEffect={isDarkMode ? 'systemMaterialDark' : 'systemMaterial'}
      labelStyle={{
        color: theme.text,
      }}
      tintColor={theme.primary}
    >
      {/* Ana Sayfa / Home */}
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>{t('home.discover')}</Label>
      </NativeTabs.Trigger>

      {/* Keşfet / Discover */}
      <NativeTabs.Trigger name="discover">
        <Icon sf={{ default: 'sparkles', selected: 'sparkles' }} />
        <Label>Keşfet</Label>
      </NativeTabs.Trigger>

      {/* İzleme Listesi / Watchlist */}
      <NativeTabs.Trigger name="watchlist">
        <Icon sf={{ default: 'bookmark', selected: 'bookmark.fill' }} />
        <Label>{t('watchlist.title')}</Label>
      </NativeTabs.Trigger>

      {/* Favoriler / Favorites */}
      <NativeTabs.Trigger name="favorites">
        <Icon sf={{ default: 'heart', selected: 'heart.fill' }} />
        <Label>{t('favorites.title')}</Label>
      </NativeTabs.Trigger>

      {/* Ayarlar / Settings */}
      <NativeTabs.Trigger name="settings" options={{}}>
        <Icon sf={{ default: 'gear', selected: 'gearshape.fill' }} />
        <Label>{t('settings.title')}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
