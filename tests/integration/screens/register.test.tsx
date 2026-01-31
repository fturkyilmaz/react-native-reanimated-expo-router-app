import RegisterScreen from '@/app/(auth)/register';
import { useAuth } from '@/hooks/useAuth';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

// Mock the auth hook
jest.mock('@/hooks/useAuth');

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    replace: mockReplace,
  })),
  Link: jest.fn(({ children }) => children),
}));

describe('RegisterScreen Integration', () => {
  const mockRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: false,
    });
  });

  it('renders registration form correctly', () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    expect(getByPlaceholderText('Ad Soyad')).toBeTruthy();
    expect(getByPlaceholderText('E-posta adresi')).toBeTruthy();
    expect(getByPlaceholderText('Şifre')).toBeTruthy();
    expect(getByPlaceholderText('Şifreyi Onayla')).toBeTruthy();
    expect(getByText('Kayıt Ol')).toBeTruthy();
  });

  it('shows validation error for short name', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<RegisterScreen />);

    const nameInput = getByPlaceholderText('Ad Soyad');
    const emailInput = getByPlaceholderText('E-posta adresi');
    const passwordInput = getByPlaceholderText('Şifre');
    const confirmPasswordInput = getByPlaceholderText('Şifreyi Onayla');
    const submitButton = getByText('Kayıt Ol');

    fireEvent.changeText(nameInput, 'A');
    fireEvent.changeText(emailInput, 'test@test.com');
    fireEvent.changeText(passwordInput, 'Password1');
    fireEvent.changeText(confirmPasswordInput, 'Password1');
    fireEvent.press(submitButton);

    const errorMessage = await findByText('İsim en az 2 karakter olmalı');
    expect(errorMessage).toBeTruthy();
  });

  it('shows validation error for invalid email', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<RegisterScreen />);

    const nameInput = getByPlaceholderText('Ad Soyad');
    const emailInput = getByPlaceholderText('E-posta adresi');
    const passwordInput = getByPlaceholderText('Şifre');
    const confirmPasswordInput = getByPlaceholderText('Şifreyi Onayla');
    const submitButton = getByText('Kayıt Ol');

    fireEvent.changeText(nameInput, 'John Doe');
    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.changeText(passwordInput, 'Password1');
    fireEvent.changeText(confirmPasswordInput, 'Password1');
    fireEvent.press(submitButton);

    const errorMessage = await findByText('Geçerli bir e-posta adresi giriniz');
    expect(errorMessage).toBeTruthy();
  });

  it('shows validation error for password without uppercase', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<RegisterScreen />);

    const nameInput = getByPlaceholderText('Ad Soyad');
    const emailInput = getByPlaceholderText('E-posta adresi');
    const passwordInput = getByPlaceholderText('Şifre');
    const confirmPasswordInput = getByPlaceholderText('Şifreyi Onayla');
    const submitButton = getByText('Kayıt Ol');

    fireEvent.changeText(nameInput, 'John Doe');
    fireEvent.changeText(emailInput, 'test@test.com');
    fireEvent.changeText(passwordInput, 'password1');
    fireEvent.changeText(confirmPasswordInput, 'password1');
    fireEvent.press(submitButton);

    const errorMessage = await findByText('Şifrede en az bir büyük harf olmalı');
    expect(errorMessage).toBeTruthy();
  });

  it('shows validation error for password without number', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<RegisterScreen />);

    const nameInput = getByPlaceholderText('Ad Soyad');
    const emailInput = getByPlaceholderText('E-posta adresi');
    const passwordInput = getByPlaceholderText('Şifre');
    const confirmPasswordInput = getByPlaceholderText('Şifreyi Onayla');
    const submitButton = getByText('Kayıt Ol');

    fireEvent.changeText(nameInput, 'John Doe');
    fireEvent.changeText(emailInput, 'test@test.com');
    fireEvent.changeText(passwordInput, 'Password');
    fireEvent.changeText(confirmPasswordInput, 'Password');
    fireEvent.press(submitButton);

    const errorMessage = await findByText('Şifrede en az bir rakam olmalı');
    expect(errorMessage).toBeTruthy();
  });

  it('shows validation error when passwords do not match', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<RegisterScreen />);

    const nameInput = getByPlaceholderText('Ad Soyad');
    const emailInput = getByPlaceholderText('E-posta adresi');
    const passwordInput = getByPlaceholderText('Şifre');
    const confirmPasswordInput = getByPlaceholderText('Şifreyi Onayla');
    const submitButton = getByText('Kayıt Ol');

    fireEvent.changeText(nameInput, 'John Doe');
    fireEvent.changeText(emailInput, 'test@test.com');
    fireEvent.changeText(passwordInput, 'Password1');
    fireEvent.changeText(confirmPasswordInput, 'Password2');
    fireEvent.press(submitButton);

    const errorMessage = await findByText('Şifreler eşleşmiyor');
    expect(errorMessage).toBeTruthy();
  });

  it('calls register with correct data', async () => {
    mockRegister.mockResolvedValueOnce(undefined);

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    const nameInput = getByPlaceholderText('Ad Soyad');
    const emailInput = getByPlaceholderText('E-posta adresi');
    const passwordInput = getByPlaceholderText('Şifre');
    const confirmPasswordInput = getByPlaceholderText('Şifreyi Onayla');
    const submitButton = getByText('Kayıt Ol');

    fireEvent.changeText(nameInput, 'John Doe');
    fireEvent.changeText(emailInput, 'john@example.com');
    fireEvent.changeText(passwordInput, 'Password1');
    fireEvent.changeText(confirmPasswordInput, 'Password1');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('john@example.com', 'Password1', 'John Doe');
    });
  });

  it('shows loading state during registration', () => {
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: true,
    });

    const { getByTestId } = render(<RegisterScreen />);

    expect(getByTestId('activity-indicator')).toBeTruthy();
  });

  it('disables inputs during loading', () => {
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: true,
    });

    const { getByPlaceholderText } = render(<RegisterScreen />);

    const nameInput = getByPlaceholderText('Ad Soyad');
    expect(nameInput.props.editable).toBe(false);
  });

  it('handles registration error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockRegister.mockRejectedValueOnce(new Error('Registration failed'));

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    const nameInput = getByPlaceholderText('Ad Soyad');
    const emailInput = getByPlaceholderText('E-posta adresi');
    const passwordInput = getByPlaceholderText('Şifre');
    const confirmPasswordInput = getByPlaceholderText('Şifreyi Onayla');
    const submitButton = getByText('Kayıt Ol');

    fireEvent.changeText(nameInput, 'John Doe');
    fireEvent.changeText(emailInput, 'john@example.com');
    fireEvent.changeText(passwordInput, 'Password1');
    fireEvent.changeText(confirmPasswordInput, 'Password1');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});
