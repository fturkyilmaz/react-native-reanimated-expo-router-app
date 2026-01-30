import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 dakika
            cacheTime: 1000 * 60 * 30, // 30 dakika
            retry: 2,
            refetchOnWindowFocus: false,
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