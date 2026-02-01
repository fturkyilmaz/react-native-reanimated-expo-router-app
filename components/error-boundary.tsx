import { handleErrorBoundaryError } from '@/otel/instrumentation/errors';
import { captureException } from '@/sentry';
import * as Updates from 'expo-updates';
import { Component, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('App crash:', error, errorInfo);

        // OpenTelemetry'ye gönder
        handleErrorBoundaryError(error, errorInfo, {
            'error.component': 'ErrorBoundary',
            'error.screen': 'unknown',
        });

        // Sentry'ye gönder
        captureException(error, {
            extra: {
                componentStack: errorInfo.componentStack,
            },
            tags: {
                'error.source': 'error_boundary',
                'error.component': 'ErrorBoundary',
            },
        });
    }

    handleRestart = async () => {
        try {
            await Updates.reloadAsync();
        } catch (e) {
            this.setState({ hasError: false, error: null });
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.emoji}>💥</Text>
                    <Text style={styles.title}>Bir şeyler ters gitti</Text>
                    <Text style={styles.message}>{this.state.error?.message}</Text>
                    <Pressable style={styles.button} onPress={this.handleRestart}>
                        <Text style={styles.buttonText}>Tekrar Dene</Text>
                    </Pressable>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff'
    },
    emoji: { fontSize: 50, marginBottom: 16 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    message: { color: '#666', marginBottom: 20, textAlign: 'center' },
    button: { backgroundColor: '#E50914', padding: 16, borderRadius: 8 },
    buttonText: { color: 'white', fontWeight: '600' }
});