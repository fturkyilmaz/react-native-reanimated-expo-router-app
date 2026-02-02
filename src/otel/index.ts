import { trace, Tracer } from '@opentelemetry/api';

import {
    createInstrumentations,
    createTraceProvider,
    defaultConfig,
    getConfig,
    OtelConfig,
    updateConfig,
} from './config';

/**
 * OpenTelemetry SDK durumu
 */
interface OtelSDKState {
    isInitialized: boolean;
    tracer: Tracer | null;
}

const state: OtelSDKState = {
    isInitialized: false,
    tracer: null,
};

/**
 * OpenTelemetry SDK'yı başlat
 */
export function initializeOpenTelemetry(config?: Partial<OtelConfig>): void {
    if (state.isInitialized) {
        console.warn('[OpenTelemetry] SDK already initialized');
        return;
    }

    try {
        // Yapılandırmayı güncelle
        if (config) {
            updateConfig(config);
        }

        const currentConfig = getConfig();
        console.log('[OpenTelemetry] Initializing with config:', {
            serviceName: currentConfig.serviceName,
            environment: currentConfig.environment,
            samplingRate: currentConfig.samplingRate,
        });

        // Trace Provider oluştur ve kaydet
        const provider = createTraceProvider(currentConfig);
        provider.register();

        // Instrumentasyonları başlat (React Native'de FetchInstrumentation sorunlu)
        // Sadece production'da ve web ortamında etkinleştir
        if (typeof window !== 'undefined' && window.performance && window.performance.clearResourceTimings) {
            const instrumentations = createInstrumentations();
            instrumentations.forEach((instrumentation) => {
                instrumentation.enable();
            });
        } else {
            console.log('[OpenTelemetry] Fetch instrumentation skipped (not supported in this environment)');
        }

        // Global tracer'ı al
        state.tracer = trace.getTracer(currentConfig.serviceName, currentConfig.serviceVersion);
        state.isInitialized = true;

        console.log('[OpenTelemetry] SDK initialized successfully');
    } catch (error) {
        console.error('[OpenTelemetry] Failed to initialize SDK:', error);
    }
}

/**
 * Global tracer'ı al
 */
export function getTracer(): Tracer {
    if (!state.tracer) {
        throw new Error('[OpenTelemetry] SDK not initialized. Call initializeOpenTelemetry() first.');
    }
    return state.tracer;
}

/**
 * SDK'nın başlatılıp başlatılmadığını kontrol et
 */
export function isInitialized(): boolean {
    return state.isInitialized;
}

/**
 * SDK'yı kapat
 */
export function shutdownOpenTelemetry(): void {
    if (!state.isInitialized) {
        return;
    }

    // Instrumentasyonları devre dışı bırak
    const instrumentations = createInstrumentations();
    instrumentations.forEach((instrumentation) => {
        instrumentation.disable();
    });

    state.isInitialized = false;
    state.tracer = null;

    console.log('[OpenTelemetry] SDK shutdown');
}

// Re-export config utilities
export { defaultConfig, getConfig, updateConfig };
export type { OtelConfig };

// Re-export from config for advanced usage
export { createInstrumentations, createOtlpExporter, createResource, createTraceProvider } from './config';

