import LoginScreen from '@/app/(auth)/login';
import { useAuthStore } from '@/store/authStore';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

// Mock the auth store
jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    replace: mockReplace,
  })),
  Link: jest.fn(({ children }) => children),
}));

describe('LoginScreen Integration', () => {
  const mockLogin = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    });
  });

  it('renders login form correctly', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    expect(getByPlaceholderText('E-posta')).toBeTruthy();
    expect(getByPlaceholderText('Şifre')).toBeTruthy();
    expect(getByText('Giriş Yap')).toBeTruthy();
  });

  it('shows validation error for invalid email', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('E-posta');
    const passwordInput = getByPlaceholderText('Şifre');
    const submitButton = getByText('Giriş Yap');

    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.changeText(passwordInput, '123456');
    fireEvent.press(submitButton);

    const errorMessage = await findByText('Geçerli bir e-posta adresi giriniz');
    expect(errorMessage).toBeTruthy();
  });

  it('shows validation error for short password', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('E-posta');
    const passwordInput = getByPlaceholderText('Şifre');
    const submitButton = getByText('Giriş Yap');

    fireEvent.changeText(emailInput, 'test@test.com');
    fireEvent.changeText(passwordInput, '123');
    fireEvent.press(submitButton);

    const errorMessage = await findByText('Şifre en az 6 karakter olmalı');
    expect(errorMessage).toBeTruthy();
  });

  it('calls login with correct credentials', async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('E-posta');
    const passwordInput = getByPlaceholderText('Şifre');
    const submitButton = getByText('Giriş Yap');

    fireEvent.changeText(emailInput, 'test@test.com');
    fireEvent.changeText(passwordInput, '123456');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', '123456');
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('displays error message from store', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: 'Geçersiz e-posta veya şifre',
      clearError: mockClearError,
    });

    const { getByText } = render(<LoginScreen />);

    expect(getByText('Geçersiz e-posta veya şifre')).toBeTruthy();
  });

  it('clears error when typing in email field', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: 'Some error',
      clearError: mockClearError,
    });

    const { getByPlaceholderText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('E-posta');
    fireEvent.changeText(emailInput, 'new@email.com');

    expect(mockClearError).toHaveBeenCalled();
  });

  it('clears error when typing in password field', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: 'Some error',
      clearError: mockClearError,
    });

    const { getByPlaceholderText } = render(<LoginScreen />);

    const passwordInput = getByPlaceholderText('Şifre');
    fireEvent.changeText(passwordInput, 'newpassword');

    expect(mockClearError).toHaveBeenCalled();
  });

  it('shows loading state during login', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null,
      clearError: mockClearError,
    });

    const { getByTestId } = render(<LoginScreen />);

    // ActivityIndicator should be present
    expect(getByTestId('activity-indicator')).toBeTruthy();
  });

  it('disables inputs during loading', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null,
      clearError: mockClearError,
    });

    const { getByPlaceholderText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('E-posta');
    expect(emailInput.props.editable).toBe(false);
  });

  it('has default values in form fields', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('E-posta');
    const passwordInput = getByPlaceholderText('Şifre');

    expect(emailInput.props.value).toBe('test@test.com');
    expect(passwordInput.props.value).toBe('123456');
  });
});
