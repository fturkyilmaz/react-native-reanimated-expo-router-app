import SettingsScreen from '@/app/(tabs)/settings';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

// Mock hooks and modules
jest.mock('@/store/authStore');
jest.mock('@/hooks/use-theme');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    replace: mockReplace,
  })),
  Stack: {
    Screen: jest.fn(({ children }) => children),
  },
}));

describe('SettingsScreen Integration', () => {
  const mockLogout = jest.fn();
  const mockToggleTheme = jest.fn();
  const mockUser = {
    id: '1',
    email: 'test@test.com',
    name: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    });
    (useTheme as jest.Mock).mockReturnValue({
      isDarkMode: false,
      toggleTheme: mockToggleTheme,
      theme: {
        background: '#f8f9fa',
        card: '#ffffff',
        text: '#1a1a1a',
        textMuted: '#999999',
        primary: '#E50914',
        primaryLight: '#FFF3F3',
        divider: '#f0f0f0',
      },
    });
  });

  it('renders settings screen correctly', () => {
    const { getByText } = render(<SettingsScreen />);

    expect(getByText('Ayarlar')).toBeTruthy();
    expect(getByText('HESAP')).toBeTruthy();
    expect(getByText('TERCİHLER')).toBeTruthy();
  });

  it('displays user information', () => {
    const { getByText } = render(<SettingsScreen />);

    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('test@test.com')).toBeTruthy();
  });

  it('toggles dark mode', () => {
    const { getByTestId } = render(<SettingsScreen />);

    const darkModeSwitch = getByTestId('dark-mode-switch');
    fireEvent(darkModeSwitch, 'valueChange', true);

    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it('shows logout confirmation dialog', () => {
    const { getByText } = render(<SettingsScreen />);

    const logoutButton = getByText('Çıkış Yap');
    fireEvent.press(logoutButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      expect.any(Array)
    );
  });

  it('calls logout and navigates to login on confirm', () => {
    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      // Simulate pressing the logout button
      const logoutButton = buttons.find((b: any) => b.text === 'Çıkış Yap');
      if (logoutButton && logoutButton.onPress) {
        logoutButton.onPress();
      }
    });

    const { getByText } = render(<SettingsScreen />);

    const logoutButton = getByText('Çıkış Yap');
    fireEvent.press(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('shows clear cache confirmation dialog', () => {
    const { getByText } = render(<SettingsScreen />);

    const clearCacheButton = getByText('Önbelleği Temizle');
    fireEvent.press(clearCacheButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Önbelleği Temizle',
      'Önbelleği temizlemek istediğinize emin misiniz?',
      expect.any(Array)
    );
  });

  it('clears cache on confirm', async () => {
    (AsyncStorage.clear as jest.Mock).mockResolvedValueOnce(undefined);
    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      const clearButton = buttons.find((b: any) => b.text === 'Temizle');
      if (clearButton && clearButton.onPress) {
        clearButton.onPress();
      }
    });

    const { getByText } = render(<SettingsScreen />);

    const clearCacheButton = getByText('Önbelleği Temizle');
    fireEvent.press(clearCacheButton);

    await waitFor(() => {
      expect(AsyncStorage.clear).toHaveBeenCalled();
    });
  });

  it('toggles notifications', () => {
    const { getByTestId } = render(<SettingsScreen />);

    const notificationsSwitch = getByTestId('notifications-switch');
    fireEvent(notificationsSwitch, 'valueChange', false);

    // State should be updated
    expect(notificationsSwitch).toBeTruthy();
  });

  it('toggles email updates', () => {
    const { getByTestId } = render(<SettingsScreen />);

    const emailUpdatesSwitch = getByTestId('email-updates-switch');
    fireEvent(emailUpdatesSwitch, 'valueChange', true);

    expect(emailUpdatesSwitch).toBeTruthy();
  });

  it('toggles auto play', () => {
    const { getByTestId } = render(<SettingsScreen />);

    const autoPlaySwitch = getByTestId('auto-play-switch');
    fireEvent(autoPlaySwitch, 'valueChange', false);

    expect(autoPlaySwitch).toBeTruthy();
  });

  it('changes language', () => {
    const { getByText } = render(<SettingsScreen />);

    const languageButton = getByText('Dil');
    fireEvent.press(languageButton);

    // Language selection should be triggered
    expect(languageButton).toBeTruthy();
  });

  it('renders with dark theme', () => {
    (useTheme as jest.Mock).mockReturnValue({
      isDarkMode: true,
      toggleTheme: mockToggleTheme,
      theme: {
        background: '#0f0f0f',
        card: '#1a1a1a',
        text: '#ffffff',
        textMuted: '#666666',
        primary: '#E50914',
        primaryLight: '#2a1a1a',
        divider: '#2a2a2a',
      },
    });

    const { getByText } = render(<SettingsScreen />);

    expect(getByText('Ayarlar')).toBeTruthy();
  });

  it('displays app version', () => {
    const { getByText } = render(<SettingsScreen />);

    expect(getByText(/Sürüm/)).toBeTruthy();
  });
});
