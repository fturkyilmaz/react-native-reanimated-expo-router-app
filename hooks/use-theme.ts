import { Colors, ThemeColors } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export function useTheme() {
  const { isDarkMode, toggleTheme, setDarkMode } = useThemeStore();

  const theme: ThemeColors = isDarkMode ? Colors.dark : Colors.light;

  return {
    isDarkMode,
    theme,
    toggleTheme,
    setDarkMode,
    colors: theme,
  };
}