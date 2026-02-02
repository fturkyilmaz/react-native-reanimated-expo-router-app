import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

// Initialize React Query's online manager with NetInfo
// This ensures React Query knows when the device is offline
onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
        setOnline(!!state.isConnected);
    });
});

// Export utility functions for components to use
export const isOnline = (): boolean => {
    return onlineManager.isOnline();
};

export const subscribeToNetworkChanges = (callback: (isOnline: boolean) => void) => {
    return NetInfo.addEventListener((state) => {
        callback(!!state.isConnected);
    });
};

// Get detailed network info
export const getNetworkInfo = async () => {
    return await NetInfo.fetch();
};

export { NetInfo };
