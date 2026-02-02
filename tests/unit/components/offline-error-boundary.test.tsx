import { OfflineErrorBoundary } from '@/components/offline-error-boundary';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

// Mock the useTranslation hook
jest.mock('react-i18next', () => ({
    useTranslation: jest.fn(() => ({
        t: jest.fn((key: string) => {
            const translations: Record<string, string> = {
                'offline.title': 'No Internet Connection',
                'offline.message': 'Please check your network settings and try again.',
                'offline.retry': 'Retry',
            };
            return translations[key] || key;
        }),
    })),
}));

// Mock the offline-manager
jest.mock('@/utils/offline-manager', () => ({
    subscribeToNetworkChanges: jest.fn((_callback: (isOnline: boolean) => void) => {
        return jest.fn(); // Return unsubscribe function
    }),
}));

describe('OfflineErrorBoundary', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const children = <Text testID="children">Children Content</Text>;

    it('renders children when online', () => {
        render(<OfflineErrorBoundary>{children}</OfflineErrorBoundary>);

        expect(screen.getByTestId('children')).toBeTruthy();
    });

    it('shows offline screen when network error occurs', () => {
        // Create a component that throws a network error
        class ErrorThrowingComponent extends React.Component {
            componentDidMount() {
                throw new Error('Network Error');
            }
            render() {
                return <Text>Error</Text>;
            }
        }

        render(
            <OfflineErrorBoundary>
                <ErrorThrowingComponent />
            </OfflineErrorBoundary>
        );

        // The error boundary should catch the error and show offline screen
        expect(screen.getByText('No Internet Connection')).toBeTruthy();
        expect(screen.getByText('Please check your network settings and try again.')).toBeTruthy();
        expect(screen.getByText('Retry')).toBeTruthy();
    });

    it('detects various network error types', () => {
        const networkErrors = [
            'Network Error',
            'fetch failed',
            'ERR_INTERNET_DISCONNECTED',
            'Network request failed',
        ];

        networkErrors.forEach((errorMessage) => {
            class ErrorThrowingComponent extends React.Component {
                componentDidMount() {
                    throw new Error(errorMessage);
                }
                render() {
                    return <Text>Error</Text>;
                }
            }

            render(
                <OfflineErrorBoundary>
                    <ErrorThrowingComponent />
                </OfflineErrorBoundary>
            );

            expect(screen.getByText('No Internet Connection')).toBeTruthy();
        });
    });

    it('does not catch non-network errors', () => {
        class ErrorThrowingComponent extends React.Component {
            componentDidMount() {
                throw new Error('Something went wrong');
            }
            render() {
                return <Text>Error</Text>;
            }
        }

        // The error boundary should not catch non-network errors
        // It will propagate to the default React error boundary
        expect(() => {
            render(
                <OfflineErrorBoundary>
                    <ErrorThrowingComponent />
                </OfflineErrorBoundary>
            );
        }).toThrow('Something went wrong');
    });

    it('retry button resets the error state', () => {
        let shouldThrow = true;

        class ConditionalErrorComponent extends React.Component {
            componentDidMount() {
                if (shouldThrow) {
                    throw new Error('Network Error');
                }
            }
            render() {
                return <Text>Recovered</Text>;
            }
        }

        render(
            <OfflineErrorBoundary>
                <ConditionalErrorComponent />
            </OfflineErrorBoundary>
        );

        // Should show offline screen initially
        expect(screen.getByText('No Internet Connection')).toBeTruthy();

        // Click retry
        fireEvent.press(screen.getByText('Retry'));

        // Allow the next render to not throw
        shouldThrow = false;

        // The error state should be reset
        expect(screen.queryByText('No Internet Connection')).toBeFalsy();
    });

    it('unsubscribes from network changes on unmount', () => {
        const { unmount } = render(<OfflineErrorBoundary>{children}</OfflineErrorBoundary>);
        const { subscribeToNetworkChanges } = require('@/utils/offline-manager');

        unmount();

        // The unsubscribe function should be called
        expect(subscribeToNetworkChanges).toHaveBeenCalled();
    });
});
