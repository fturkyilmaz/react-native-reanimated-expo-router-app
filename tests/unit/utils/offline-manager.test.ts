
// We need to mock the onlineManager before importing offline-manager
jest.mock('@tanstack/react-query', () => ({
    onlineManager: {
        setEventListener: jest.fn((callback) => {
            // Simulate the callback being called
            return jest.fn();
        }),
        isOnline: jest.fn(() => true),
    },
}));

describe('offline-manager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize online manager with NetInfo event listener', () => {
        // Import the module to trigger the initialization
        jest.resetModules();
        require('@/utils/offline-manager');

        const { onlineManager: mockedOnlineManager } = require('@tanstack/react-query');
        const { NetInfo: mockedNetInfo } = require('@react-native-community/netinfo');

        expect(mockedOnlineManager.setEventListener).toHaveBeenCalled();
    });

    it('should provide isOnline utility function', () => {
        jest.resetModules();
        const { isOnline } = require('@/utils/offline-manager');

        // The mock returns true by default
        expect(isOnline()).toBe(true);
    });

    it('should provide subscribeToNetworkChanges function', () => {
        jest.resetModules();
        const { subscribeToNetworkChanges } = require('@/utils/offline-manager');

        expect(typeof subscribeToNetworkChanges).toBe('function');
    });

    it('should provide getNetworkInfo function', () => {
        jest.resetModules();
        const { getNetworkInfo } = require('@/utils/offline-manager');

        expect(typeof getNetworkInfo).toBe('function');
    });
});
