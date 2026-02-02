import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// React Query online manager is initialized in utils/offline-manager.ts
// using NetInfo for offline detection

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 dakika
            gcTime: 1000 * 60 * 30, // 30 dakika (cacheTime yerine gcTime)
            retry: 2,
            refetchOnWindowFocus: false,
            // Network mode: 'offlineFirst' will return cached data when offline
            networkMode: 'offlineFirst',
        },
        mutations: {
            retry: 1,
            networkMode: 'offlineFirst',
        },
    },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <>
                {children}
                {/* <ReactQueryDevtools initialIsOpen={false} /> */}
            </>
        </QueryClientProvider>
    );
}
