import React, { createContext, ReactElement, useContext, useEffect, useRef } from 'react';

import { initializeOpenTelemetry, OtelConfig, shutdownOpenTelemetry } from './index';
import { initializeErrorHandlers } from './instrumentation/errors';

/**
 * OpenTelemetry Context
 */
interface OpenTelemetryContextValue {
    isInitialized: boolean;
}

const OpenTelemetryContext = createContext<OpenTelemetryContextValue>({
    isInitialized: false,
});

/**
 * OpenTelemetry Provider Props
 */
interface OpenTelemetryProviderProps {
    children: React.ReactNode;
    config?: Partial<OtelConfig>;
    /** Error handler'ları otomatik başlat */
    enableErrorHandlers?: boolean;
}

/**
 * OpenTelemetry Provider
 * 
 * @example
 * ```tsx
 * export default function RootLayout() {
 *   return (
 *     <OpenTelemetryProvider>
 *       <App />
 *     </OpenTelemetryProvider>
 *   );
 * }
 * ```
 */
export function OpenTelemetryProvider({
    children,
    config,
    enableErrorHandlers = true,
}: OpenTelemetryProviderProps): ReactElement {
    const isInitializedRef = useRef(false);
    const cleanupErrorHandlersRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (isInitializedRef.current) {
            return;
        }

        // OpenTelemetry SDK'yı başlat
        initializeOpenTelemetry(config);
        isInitializedRef.current = true;

        // Error handler'ları başlat
        if (enableErrorHandlers) {
            cleanupErrorHandlersRef.current = initializeErrorHandlers();
        }

        // Cleanup
        return () => {
            if (cleanupErrorHandlersRef.current) {
                cleanupErrorHandlersRef.current();
            }
            shutdownOpenTelemetry();
            isInitializedRef.current = false;
        };
    }, [config, enableErrorHandlers]);

    return (
        <OpenTelemetryContext.Provider value={{ isInitialized: isInitializedRef.current }}>
            {children}
        </OpenTelemetryContext.Provider>
    );
}

/**
 * OpenTelemetry context'ini kullan
 */
export function useOpenTelemetry(): OpenTelemetryContextValue {
    return useContext(OpenTelemetryContext);
}
