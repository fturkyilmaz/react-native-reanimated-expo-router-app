import React, { ReactElement, useEffect, useRef } from 'react';

import { initializeSentry } from './index';

/**
 * Sentry Provider Props
 */
interface SentryProviderProps {
    children: React.ReactNode;
    dsn?: string;
}

/**
 * Sentry Provider
 * 
 * @example
 * ```tsx
 * export default function RootLayout() {
 *   return (
 *     <SentryProvider dsn={process.env.EXPO_PUBLIC_SENTRY_DSN}>
 *       <App />
 *     </SentryProvider>
 *   );
 * }
 * ```
 */
export function SentryProvider({
    children,
    dsn,
}: SentryProviderProps): ReactElement {
    const initializedRef = useRef(false);

    useEffect(() => {
        if (initializedRef.current) {
            return;
        }

        if (dsn) {
            initializeSentry({ dsn });
            initializedRef.current = true;
        }
    }, [dsn]);

    return <>{children}</>;
}
