import { ErrorBoundary } from '@/components/error-boundary';
import React from 'react';
import { Text, View } from 'react-native';
import renderer from 'react-test-renderer';

describe('ErrorBoundary Snapshot', () => {
  it('renders children when there is no error', () => {
    const tree = renderer
      .create(
        <ErrorBoundary>
          <View>
            <Text>Test Content</Text>
          </View>
        </ErrorBoundary>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders error UI when there is an error', () => {
    // Create a component that throws an error
    const ThrowError = () => {
      throw new Error('Test error message');
    };

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const tree = renderer
      .create(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )
      .toJSON();

    expect(tree).toMatchSnapshot();

    consoleSpy.mockRestore();
  });

  it('renders error UI with different error messages', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const errors = [
      'Network error',
      'Something went wrong',
      'Failed to fetch data',
    ];

    errors.forEach((errorMessage) => {
      const ThrowError = () => {
        throw new Error(errorMessage);
      };

      const tree = renderer
        .create(
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        )
        .toJSON();

      expect(tree).toBeTruthy();
    });

    consoleSpy.mockRestore();
  });
});
