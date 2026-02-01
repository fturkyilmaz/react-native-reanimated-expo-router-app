import type { Span } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Instrumentation } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { Resource } from '@opentelemetry/resources';
import {
    BatchSpanProcessor,
    ConsoleSpanExporter,
    SimpleSpanProcessor,
    TracerConfig,
} from '@opentelemetry/sdk-trace-base';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import {
    SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
    SEMRESATTRS_DEVICE_ID,
    SEMRESATTRS_DEVICE_MODEL_NAME,
    SEMRESATTRS_OS_TYPE,
    SEMRESATTRS_OS_VERSION,
    SEMRESATTRS_SERVICE_NAME,
    SEMRESATTRS_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * OpenTelemetry yapılandırma arayüzü
 */
export interface OtelConfig {
    /** Servis adı */
    serviceName: string;
    /** Servis versiyonu */
    serviceVersion: string;
    /** OTLP endpoint URL */
    otlpEndpoint: string;
    /** Sampling oranı (0.0 - 1.0) */
    samplingRate: number;
    /** Çalışma ortamı */
    environment: 'development' | 'production';
    /** Console'a log yazdırma (development için) */
    enableConsoleExporter: boolean;
    /** OTLP Exporter'ı etkinleştir */
    enableOtlpExporter: boolean;
}

/**
 * Varsayılan yapılandırma
 */
export const defaultConfig: OtelConfig = {
    serviceName: process.env.EXPO_PUBLIC_OTEL_SERVICE_NAME || 'cinesearch-mobile',
    serviceVersion: Constants.expoConfig?.version || '1.0.0',
    otlpEndpoint: process.env.EXPO_PUBLIC_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    samplingRate: parseFloat(process.env.EXPO_PUBLIC_OTEL_SAMPLING_RATE || '1.0'),
    environment: __DEV__ ? 'development' : 'production',
    enableConsoleExporter: __DEV__,
    enableOtlpExporter: !__DEV__,
};

/**
 * Cihaz bilgilerini al
 */
function getDeviceInfo(): {
    deviceId: string;
    deviceModel: string;
    osType: string;
    osVersion: string;
} {
    const deviceId = Constants.sessionId || 'unknown-device';

    const iosConstants = Platform.constants as { systemName?: string } | undefined;
    const androidConstants = Platform.constants as { Brand?: string; Model?: string } | undefined;

    return {
        deviceId,
        deviceModel: Platform.select({
            ios: iosConstants?.systemName || 'iOS Device',
            android: `${androidConstants?.Brand || 'Unknown'} ${androidConstants?.Model || 'Device'}`,
            default: 'unknown',
        }) || 'unknown',
        osType: Platform.OS,
        osVersion: Platform.Version?.toString() || 'unknown',
    };
}

/**
 * OpenTelemetry Resource oluştur
 */
export function createResource(config: Partial<OtelConfig> = {}): Resource {
    const mergedConfig = { ...defaultConfig, ...config };
    const deviceInfo = getDeviceInfo();

    return new Resource({
        [SEMRESATTRS_SERVICE_NAME]: mergedConfig.serviceName,
        [SEMRESATTRS_SERVICE_VERSION]: mergedConfig.serviceVersion,
        [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: mergedConfig.environment,
        [SEMRESATTRS_DEVICE_ID]: deviceInfo.deviceId,
        [SEMRESATTRS_DEVICE_MODEL_NAME]: deviceInfo.deviceModel,
        [SEMRESATTRS_OS_TYPE]: deviceInfo.osType,
        [SEMRESATTRS_OS_VERSION]: deviceInfo.osVersion,
        'app.name': Constants.expoConfig?.name,
        'app.version': Constants.expoConfig?.version,
        'app.slug': Constants.expoConfig?.slug,
    });
}

/**
 * OTLP Trace Exporter oluştur
 */
export function createOtlpExporter(config: Partial<OtelConfig> = {}): OTLPTraceExporter {
    const mergedConfig = { ...defaultConfig, ...config };

    return new OTLPTraceExporter({
        url: mergedConfig.otlpEndpoint,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

/**
 * Trace Provider oluştur
 */
export function createTraceProvider(
    config: Partial<OtelConfig> = {}
): WebTracerProvider {
    const mergedConfig = { ...defaultConfig, ...config };
    const resource = createResource(mergedConfig);

    const providerConfig: TracerConfig = {
        resource,
        sampler: {
            shouldSample: () => {
                const shouldSample = Math.random() < mergedConfig.samplingRate;
                return {
                    decision: shouldSample ? 1 : 0,
                    attributes: {},
                };
            },
            toString: () => `ProbabilitySampler(${mergedConfig.samplingRate})`,
        },
    };

    const provider = new WebTracerProvider(providerConfig);

    // Console Exporter (Development)
    if (mergedConfig.enableConsoleExporter) {
        provider.addSpanProcessor(
            new SimpleSpanProcessor(new ConsoleSpanExporter())
        );
    }

    // OTLP Exporter (Production)
    if (mergedConfig.enableOtlpExporter) {
        provider.addSpanProcessor(
            new BatchSpanProcessor(createOtlpExporter(mergedConfig), {
                maxQueueSize: 2048,
                maxExportBatchSize: 512,
                scheduledDelayMillis: 5000,
                exportTimeoutMillis: 30000,
            })
        );
    }

    return provider;
}

/**
 * Instrumentasyonları oluştur
 */
export function createInstrumentations(): Instrumentation[] {
    const instrumentations: Instrumentation[] = [];

    // Fetch Instrumentation
    instrumentations.push(
        new FetchInstrumentation({
            propagateTraceHeaderCorsUrls: [/.*/],
            clearTimingResources: true,
            applyCustomAttributesOnSpan: (span: Span, request: unknown, result: unknown) => {
                // API Key'i maskele
                let url: string;
                if (typeof request === 'string') {
                    url = request;
                } else if (request && typeof request === 'object' && 'url' in request) {
                    url = String((request as { url: unknown }).url);
                } else {
                    url = '';
                }

                if (url.includes('api_key=')) {
                    const maskedUrl = url.replace(/api_key=[^&]+/, 'api_key=***');
                    span.setAttribute('http.url.masked', maskedUrl);
                }

                // Response boyutu
                if (result && typeof result === 'object' && 'headers' in result) {
                    const response = result as Response;
                    const contentLength = response.headers.get('content-length');
                    span.setAttribute('http.response_content_length', contentLength ? parseInt(contentLength, 10) : 0);
                }
            },
        })
    );

    return instrumentations;
}

/**
 * Yapılandırma nesnesini al
 */
export function getConfig(): OtelConfig {
    return { ...defaultConfig };
}

/**
 * Yapılandırmayı güncelle
 */
export function updateConfig(newConfig: Partial<OtelConfig>): void {
    Object.assign(defaultConfig, newConfig);
}
