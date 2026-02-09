import { ErrorBoundary } from '@/components/error-boundary';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Updates from 'expo-updates';
import React from 'react';
import { Text, View } from 'react-native';

// Mock @/otel/instrumentation/errors
jest.mock('@/otel/instrumentation/errors', () => ({
  handleErrorBoundaryError: jest.fn(),
}));

// Mock @/sentry
jest.mock('@/sentry', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setContext: jest.fn(),
}));

// Mock component that throws error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return (
    <View>
      <Text>Normal content</Text>
    </View>
  );
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for expected errors
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Test content</Text>
      </ErrorBoundary>
    );

    expect(getByText('Test content')).toBeTruthy();
  });

  it('renders error UI when child throws error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Bir şeyler ters gitti')).toBeTruthy();
    expect(getByText('Test error')).toBeTruthy();
    expect(getByText('Tekrar Dene')).toBeTruthy();
  });

  it('calls reloadAsync when restart button is pressed', async () => {
    const mockReloadAsync = jest.fn();
    (Updates.reloadAsync as jest.Mock).mockImplementation(mockReloadAsync);

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const restartButton = getByText('Tekrar Dene');
    fireEvent.press(restartButton);

    await waitFor(() => {
      expect(mockReloadAsync).toHaveBeenCalled();
    });
  });

  it('handles reloadAsync error gracefully', async () => {
    const mockReloadAsync = jest.fn().mockRejectedValue(new Error('Reload failed'));
    (Updates.reloadAsync as jest.Mock).mockImplementation(mockReloadAsync);

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const restartButton = getByText('Tekrar Dene');
    fireEvent.press(restartButton);

    await waitFor(() => {
      expect(mockReloadAsync).toHaveBeenCalled();
    });
  });

  it('logs error to console when error occurs', () => {
    const consoleSpy = jest.spyOn(console, 'error');

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('displays error emoji', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('💥')).toBeTruthy();
  });
});
