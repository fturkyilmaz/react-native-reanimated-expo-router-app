import { subscribeToNetworkChanges } from '@/utils/offline-manager';
import { Component, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
    children: ReactNode;
}

interface State {
    isOffline: boolean;
}

export class OfflineErrorBoundary extends Component<Props, State> {
    state: State = { isOffline: false };

    componentDidMount() {
        // Subscribe to network changes
        this.unsubscribe = subscribeToNetworkChanges((isOnline) => {
            if (isOnline) {
                // When back online, reset the error state
                this.setState({ isOffline: false });
            }
        });
    }

    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    // Static method to trigger offline state from outside
    static getDerivedStateFromError(error: Error): State {
        // Check if error is network-related
        const isNetworkError =
            error.message.includes('Network Error') ||
            error.message.includes('fetch failed') ||
            error.message.includes('ERR_INTERNET_DISCONNECTED') ||
            error.message.includes('Network request failed');

        if (isNetworkError) {
            return { isOffline: true };
        }
        return { isOffline: false };
    }

    private unsubscribe?: () => void;

    handleRetry = () => {
        this.setState({ isOffline: false });
        // Trigger a re-render to retry the operation
        this.forceUpdate();
    };

    render() {
        const { t } = useTranslation();

        if (this.state.isOffline) {
            return (
                <View style={styles.container}>
                    <Text style={styles.icon}>📡</Text>
                    <Text style={styles.title}>{t('offline.title')}</Text>
                    <Text style={styles.message}>{t('offline.message')}</Text>
                    <Pressable
                        style={styles.button}
                        onPress={this.handleRetry}
                    >
                        <Text style={styles.buttonText}>{t('offline.retry')}</Text>
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
        backgroundColor: '#fff',
    },
    icon: {
        fontSize: 64,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    button: {
        backgroundColor: '#E50914',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
