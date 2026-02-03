/**
 * Error Boundary Component
 * Global error boundary with retry UI for graceful error handling
 */

import { COLORS, TYPOGRAPHY } from '@/core/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
    StyleSheet,
    Text,
    View
} from 'react-native';
import { Button } from '../Button/Button';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ReactNode | null;
}

interface ErrorBoundaryProps {
    /** Child components */
    children: ReactNode;
    /** Fallback component to show on error */
    fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
    /** Callback when error is caught */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    /** Whether to show error details in production */
    showDetails?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({
            error,
            errorInfo: errorInfo.componentStack,
        });

        // Log error to console in development
        if (__DEV__) {
            console.error('[ErrorBoundary] Caught error:', error);
            console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
        }

        // Call optional error callback
        this.props.onError?.(error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback
            if (this.props.fallback) {
                if (typeof this.props.fallback === 'function') {
                    return this.props.fallback(this.state.error!, this.handleReset);
                }
                return this.props.fallback;
            }

            // Default fallback UI
            return <ErrorFallback error={this.state.error} onRetry={this.handleReset} />;
        }

        return this.props.children;
    }
}

/**
 * Default error fallback component
 */
interface ErrorFallbackProps {
    error: Error | null;
    onRetry: () => void;
}

export function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name="alert-circle" size={64} color={COLORS.error} />
            </View>

            <Text style={styles.title}>Bir hata oluştu</Text>

            <Text style={styles.message}>
                {__DEV__
                    ? error?.message || 'Bilinmeyen bir hata'
                    : 'Bir sorun oluştu. Lütfen tekrar deneyin.'}
            </Text>

            {__DEV__ && error?.stack && (
                <View style={styles.debugContainer}>
                    <Text style={styles.debugLabel}>Error Stack:</Text>
                    <Text style={styles.debugText} numberOfLines={5}>
                        {error.stack}
                    </Text>
                </View>
            )}

            <View style={styles.buttonContainer}>
                <Button
                    title="Tekrar Dene"
                    onPress={onRetry}
                    variant="primary"
                    icon={<Ionicons name="refresh" size={18} color="#fff" />}
                />
            </View>
        </View>
    );
}

/**
 * Async error fallback with loading state
 */
export function AsyncErrorFallback({
    error,
    onRetry,
    isRetrying,
}: ErrorFallbackProps & { isRetrying?: boolean }) {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name="wifi-outline" size={64} color={COLORS.textSecondary} />
            </View>

            <Text style={styles.title}>Bağlantı Hatası</Text>

            <Text style={styles.message}>
                İnternet bağlantınızı kontrol edip tekrar deneyin.
            </Text>

            <View style={styles.buttonContainer}>
                <Button
                    title="Tekrar Dene"
                    onPress={onRetry}
                    variant="primary"
                    loading={isRetrying}
                />
            </View>
        </View>
    );
}

/**
 * Empty state fallback
 */
interface EmptyStateProps {
    title: string;
    message?: string;
    icon?: ReactNode;
    action?: {
        title: string;
        onPress: () => void;
    };
}

export function EmptyState({ title, message, icon, action }: EmptyStateProps) {
    return (
        <View style={styles.container}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}

            <Text style={styles.title}>{title}</Text>

            {message && <Text style={styles.message}>{message}</Text>}

            {action && (
                <View style={styles.buttonContainer}>
                    <Button title={action.title} onPress={action.onPress} variant="outline" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: COLORS.background,
    },
    iconContainer: {
        marginBottom: 16,
    },
    title: {
        ...TYPOGRAPHY.titleLarge,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        ...TYPOGRAPHY.bodyMedium,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 16,
        maxWidth: 300,
    },
    debugContainer: {
        width: '100%',
        padding: 12,
        backgroundColor: COLORS.backgroundTertiary,
        borderRadius: 8,
        marginBottom: 16,
    },
    debugLabel: {
        ...TYPOGRAPHY.labelMedium,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    debugText: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.textTertiary,
    },
    buttonContainer: {
        marginTop: 8,
    },
});

export default ErrorBoundary;
