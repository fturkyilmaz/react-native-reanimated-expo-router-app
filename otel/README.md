# OpenTelemetry Entegrasyonu

Bu modül, CineSearch React Native uygulaması için OpenTelemetry entegrasyonu sağlar.

## Özellikler

- **API Tracing**: TMDB API çağrılarının otomatik izlenmesi
- **Hata Logging**: Global hata yakalama ve exception logging
- **Performans Metrikleri**: Ekran yükleme süreleri ve render performansı
- **Kullanıcı Etkileşimleri**: Kullanıcı aksiyonlarının izlenmesi
- **OTLP Export**: OTLP Collector'a trace gönderimi

## Kurulum

### 1. Çevresel Değişkenler

`.env` dosyasına aşağıdaki değişkenleri ekleyin:

```bash
# OpenTelemetry
EXPO_PUBLIC_OTLP_ENDPOINT=http://localhost:4318/v1/traces
EXPO_PUBLIC_OTEL_SERVICE_NAME=cinesearch-mobile
EXPO_PUBLIC_OTEL_SAMPLING_RATE=1.0
```

### 2. Bağımlılıklar

Paketler `package.json`'a eklenmiştir. Yüklemek için:

```bash
npm install
# veya
yarn install
```

## Kullanım

### Temel Kullanım

OpenTelemetry SDK uygulama başlatıldığında otomatik olarak başlar:

```tsx
// app/_layout.tsx
import { OpenTelemetryProvider } from '@/otel/provider';

export default function RootLayout() {
  return (
    <OpenTelemetryProvider>
      {/* Uygulama içeriği */}
    </OpenTelemetryProvider>
  );
}
```

### API Tracing

TMDB servisi otomatik olarak trace edilir. Manuel tracing için:

```typescript
import { withTracing } from '@/otel/instrumentation/fetch';

const data = await withTracing(
  () => fetch('https://api.example.com/data'),
  {
    spanName: 'api.data.fetch',
    endpoint: '/data',
    attributes: {
      'api.service': 'custom-api'
    }
  }
);
```

### useTrace Hook

Kullanıcı etkileşimlerini trace etmek için:

```tsx
import { useTrace } from '@/otel/hooks';

function MovieCard({ movie }: { movie: Movie }) {
  const { startUserAction, endSpan, recordError } = useTrace();

  const handlePress = async () => {
    const span = startUserAction('tap', 'MovieCard', {
      'movie.id': movie.id,
      'movie.title': movie.title
    });

    try {
      await navigation.navigate('MovieDetail', { id: movie.id });
      endSpan(span);
    } catch (error) {
      recordError(span, error);
    }
  };

  return (
    <Pressable onPress={handlePress}>
      {/* Card içeriği */}
    </Pressable>
  );
}
```

### usePerformance Hook

Performans ölçümü için:

```tsx
import { usePerformance } from '@/otel/hooks';

function MovieDetailScreen({ route }: Props) {
  const { measureScreenLoad, measureAsync } = usePerformance();

  useEffect(() => {
    const endMeasurement = measureScreenLoad('MovieDetail');

    loadMovieData().then(() => {
      endMeasurement();
    });
  }, []);

  const handleRefresh = async () => {
    await measureAsync('refresh_data', async () => {
      await refreshMovieData();
    });
  };

  // ...
}
```

### Hata Logging

Manuel hata kaydı için:

```typescript
import { logApiError, logUIError, logLogicError } from '@/otel/instrumentation/errors';

// API hatası
try {
  await fetchData();
} catch (error) {
  logApiError(error, '/api/endpoint', 'GET');
}

// UI hatası
try {
  renderComponent();
} catch (error) {
  logUIError(error, 'MovieCard', 'render');
}

// Logic hatası
try {
  processData();
} catch (error) {
  logLogicError(error, 'data_processing');
}
```

### Span Utilities

Düşük seviyeli span yönetimi:

```typescript
import {
  createSpan,
  endSpan,
  endSpanWithError,
  addEvent,
  createApiSpan,
  createUserActionSpan
} from '@/otel/utils';

// Manuel span oluşturma
const span = createSpan({
  name: 'custom.operation',
  attributes: { 'custom.key': 'value' }
});

// Event ekleme
addEvent(span, 'operation.step1', { 'step.detail': 'info' });

// Span'ı bitirme
endSpan(span);

// Hata ile bitirme
endSpanWithError(span, new Error('Something went wrong'));
```

## Yapılandırma

### SDK Yapılandırması

```typescript
import { initializeOpenTelemetry, updateConfig } from '@/otel';

// Başlatma
initializeOpenTelemetry({
  serviceName: 'my-app',
  serviceVersion: '1.0.0',
  otlpEndpoint: 'http://collector:4318/v1/traces',
  samplingRate: 0.5, // %50 sampling
  environment: 'production',
  enableConsoleExporter: true,
  enableOtlpExporter: true
});

// Runtime yapılandırma güncelleme
updateConfig({
  samplingRate: 0.1
});
```

## OTLP Collector Yapılandırması

### Docker Compose

```yaml
version: '3.8'
services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    ports:
      - "4318:4318"   # OTLP HTTP
      - "4317:4317"   # OTLP gRPC
      - "55679:55679" # zpages
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
    command: ["--config=/etc/otel-collector-config.yaml"]

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686" # UI
      - "14250:14250"
```

### Collector Config

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024

exporters:
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true
  logging:
    loglevel: debug

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [jaeger, logging]
```

## Attribute Referansı

### HTTP Attributes

| Attribute | Açıklama |
|-----------|----------|
| `http.method` | HTTP metodu (GET, POST, vb.) |
| `http.url` | Tam URL |
| `http.status_code` | Yanıt durum kodu |
| `http.response_content_length` | Yanıt boyutu |

### API Attributes

| Attribute | Açıklama |
|-----------|----------|
| `api.endpoint` | API endpoint'i |
| `api.method` | API metodu |
| `api.service` | Servis adı |
| `api.operation` | İşlem adı |

### User Action Attributes

| Attribute | Açıklama |
|-----------|----------|
| `user.action.type` | Eylem tipi (tap, swipe, vb.) |
| `ui.component.name` | Bileşen adı |
| `ui.component.id` | Bileşen ID |
| `screen.name` | Ekran adı |

### Error Attributes

| Attribute | Açıklama |
|-----------|----------|
| `exception.type` | Hata tipi |
| `exception.message` | Hata mesajı |
| `exception.stacktrace` | Stack trace |
| `error.source` | Hata kaynağı |
| `error.handled` | İşlenip işlenmediği |

### Performance Attributes

| Attribute | Açıklama |
|-----------|----------|
| `screen.load.duration_ms` | Ekran yükleme süresi |
| `screen.load.type` | Yükleme tipi |
| `component.render.duration_ms` | Render süresi |
| `api.duration_ms` | API çağrı süresi |

## Troubleshooting

### SDK Başlamıyor

```typescript
import { isInitialized } from '@/otel';

if (!isInitialized()) {
  console.error('OpenTelemetry SDK başlatılamadı');
}
```

### Trace'ler Görünmüyor

1. OTLP endpoint doğruluğunu kontrol edin
2. Sampling rate'in 0 olmadığından emin olun
3. Console exporter'ın aktif olduğunu kontrol edin (development)
4. Network bağlantısını kontrol edin

### Performans Sorunları

- Sampling rate'i düşürün: `samplingRate: 0.1`
- Batch processor ayarlarını optimize edin
- Gereksiz attribute'ları kaldırın

## Kaynaklar

- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/instrumentation/js/)
- [OTLP Specification](https://opentelemetry.io/docs/specs/otlp/)
- [Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/)
