# OpenTelemetry Test ve Monitoring Rehberi

Bu rehber, OpenTelemetry entegrasyonunun nasıl test edileceğini ve izleneceğini açıklar.

## İçindekiler

1. [Hızlı Başlangıç](#hızlı-başlangıç)
2. [Backend Kurulumu](#backend-kurulumu)
3. [Test Yöntemleri](#test-yöntemleri)
4. [Monitoring Araçları](#monitoring-araçları)
5. [Sorun Giderme](#sorun-giderme)

## Hızlı Başlangıç

### 1. Bağımlılıkları Yükle

```bash
npm install
```

### 2. OTLP Collector ve Jaeger Başlat

```bash
# Terminal 1: Docker servislerini başlat
docker-compose -f docker-compose.otel.yml up -d

# Servislerin hazır olmasını bekle (10-15 saniye)
docker-compose -f docker-compose.otel.yml ps
```

### 3. Uygulamayı Başlat

```bash
# Terminal 2: Expo uygulamasını başlat
npm start
# veya
npx expo start
```

### 4. Jaeger UI'ı Aç

Tarayıcıda: http://localhost:16686

## Backend Kurulumu

### Docker Servisleri

`docker-compose.otel.yml` şu servisleri başlatır:

| Servis | Port | Açıklama |
|--------|------|----------|
| OTLP Collector | 4318 (HTTP), 4317 (gRPC) | Trace toplama |
| Jaeger | 16686 | Trace görselleştirme |
| Zipkin | 9411 | Alternatif trace UI |
| Prometheus | 9090 | Metrik toplama |

### Servisleri Yönetme

```bash
# Başlat
docker-compose -f docker-compose.otel.yml up -d

# Durdur
docker-compose -f docker-compose.otel.yml down

# Logları görüntüle
docker-compose -f docker-compose.otel.yml logs -f otel-collector

# Yeniden başlat
docker-compose -f docker-compose.otel.yml restart
```

## Test Yöntemleri

### 1. Test Paneli Kullanımı

`otel/testing.tsx` içinde hazır test paneli bulunur:

```tsx
// app/(tabs)/settings.tsx veya yeni bir test ekranı oluştur
import { OtelTestPanel } from '@/otel/testing';

export default function TestScreen() {
  return <OtelTestPanel />;
}
```

Test panelinde şunları yapabilirsiniz:
- SDK durum kontrolü
- Span oluşturma testleri
- API tracing testleri
- Performans ölçüm testleri
- Hata logging testleri

### 2. Console Logları ile Test

Development modunda tüm trace'ler console'a yazılır:

```javascript
// Console çıktısı örneği
{
  traceId: 'abc123...',
  parentId: undefined,
  name: 'tmdb.getPopularMovies',
  id: 'def456...',
  kind: 0,
  timestamp: 1234567890,
  duration: 245.5,
  attributes: {
    'http.method': 'GET',
    'http.url': 'https://api.themoviedb.org/3/movie/popular',
    'http.status_code': 200,
    'api.operation': 'getPopularMovies'
  },
  status: { code: 0 }
}
```

### 3. Manuel Test Kodu

```tsx
import { useTrace, usePerformance } from '@/otel/hooks';
import { logApiError } from '@/otel/instrumentation/errors';

function TestComponent() {
  const { startSpan, endSpan, startUserAction } = useTrace();
  const { measureScreenLoad } = usePerformance();

  const runTest = async () => {
    // 1. SDK kontrolü
    console.log('SDK Initialized:', isInitialized());

    // 2. Span testi
    const span = startSpan('test.manual', { 'test.id': '123' });
    await new Promise(r => setTimeout(r, 100));
    endSpan(span);

    // 3. Kullanıcı eylemi testi
    const actionSpan = startUserAction('button_press', 'TestButton');
    endSpan(actionSpan);

    // 4. Performans testi
    const endMeasurement = measureScreenLoad('TestScreen');
    await new Promise(r => setTimeout(r, 500));
    endMeasurement();

    // 5. Hata testi
    logApiError(new Error('Test error'), '/test', 'GET');
  };

  return <Button title="Run Test" onPress={runTest} />;
}
```

## Monitoring Araçları

### 1. Jaeger UI

URL: http://localhost:16686

#### Temel Kullanım:

1. **Service Seçimi**: Dropdown'dan `cinesearch-mobile` seç
2. **Operation Seçimi**: İzlenecek işlem (örn: `tmdb.getPopularMovies`)
3. **Tag Filtreleme**: `error=true` ile sadece hatalı trace'leri göster
4. **Zaman Aralığı**: Son 1 saat, son 15 dakika vb.

#### Görünümler:

- **Search**: Trace listesi ve arama
- **Trace**: Detaylı trace görünümü (timeline)
- **Dependencies**: Servis bağımlılık grafiği
- **System Architecture**: Sistem mimarisi

### 2. Zipkin UI (Alternatif)

URL: http://localhost:9411

Daha basit bir arayüz sunar, dependency grafiği için kullanışlıdır.

### 3. OTLP Collector zpages

URL: http://localhost:55679

Collector iç yapısını debug etmek için kullanılır:
- `/debug/tracez` - Trace istatistikleri
- `/debug/rpcz` - RPC istatistikleri

### 4. Prometheus

URL: http://localhost:9090

Metrik sorguları için:
```promql
# Toplam span sayısı
otelcol_exporter_sent_spans

# Hata oranı
rate(otelcol_exporter_send_failed_spans[5m])
```

## Trace Anatomisi

### Başarılı API Çağrısı

```
Trace: tmdb.getPopularMovies
├── Span: HTTP GET (245ms)
│   ├── Attributes:
│   │   ├── http.method: GET
│   │   ├── http.url: https://api.themoviedb.org/3/movie/popular
│   │   ├── http.status_code: 200
│   │   └── api.operation: getPopularMovies
│   └── Events:
│       └── request_sent (timestamp)
└── Status: OK
```

### Hatalı API Çağrısı

```
Trace: tmdb.getMovieDetails
├── Span: HTTP GET (120ms)
│   ├── Attributes:
│   │   ├── http.method: GET
│   │   ├── http.status_code: 404
│   │   └── error.message: Movie not found
│   ├── Events:
│   │   └── exception (Error: HTTP Error: 404)
│   └── Status: ERROR
└── Tags:
    ├── error: true
    └── http.status_code: 404
```

## Sorun Giderme

### 1. Trace'ler Jaeger'da Görünmüyor

**Kontrol Listesi:**

```bash
# 1. Docker servisleri çalışıyor mu?
docker-compose -f docker-compose.otel.yml ps

# 2. Collector loglarında hata var mı?
docker-compose -f docker-compose.otel.yml logs otel-collector

# 3. Uygulama console'unda trace çıktısı var mı?
# Console'da şuna benzer çıktı görmelisiniz:
# [OpenTelemetry] SDK initialized successfully
```

**Sık Karşılaşılan Sorunlar:**

| Sorun | Çözüm |
|-------|-------|
| `SDK not initialized` | `app/_layout.tsx`'te `OpenTelemetryProvider` kontrolü |
| `Network error` | OTLP endpoint URL'sini kontrol et |
| `CORS error` | Collector config'de `cors.allowed_origins: ["*"]` |
| `No spans in Jaeger` | Sampling rate'in 0 olmadığından emin ol |

### 2. Development vs Production

**Development:**
- Console exporter aktif
- Tüm trace'ler console'a yazılır
- OTLP exporter devre dışı

**Production:**
- OTLP exporter aktif
- Console exporter devre dışı
- Sampling rate düşürülebilir

### 3. Performans Sorunları

Eğer SDK uygulamayı yavaşlatıyorsa:

```typescript
// Sampling rate'i düşür
updateConfig({
  samplingRate: 0.1  // %10 sampling
});

// Veya sadece hataları logla
updateConfig({
  samplingRate: 0,
  enableConsoleExporter: false
});
```

### 4. Debug Modu

Daha detaylı log için:

```typescript
import { initializeOpenTelemetry } from '@/otel';

initializeOpenTelemetry({
  enableConsoleExporter: true,
  enableOtlpExporter: true,  // Her ikisi de aktif
});
```

## Metrikler ve Alerting

### Önemli Metrikler

| Metrik | İdeal Değer | Alert Eşiği |
|--------|-------------|-------------|
| API Yanıt Süresi | < 500ms | > 2000ms |
| Hata Oranı | < 1% | > 5% |
| Ekran Yükleme | < 1s | > 3s |
| Trace Export | < 5s | > 30s |

### Jaeger'da Sorgu Örnekleri

```
# Sadece hatalı trace'ler
error=true

# Belirli bir endpoint
http.url="https://api.themoviedb.org/3/movie/popular"

# Yavaş istekler (1 saniyeden uzun)
duration>=1000000

# Belirli bir kullanıcı (eğer user ID eklenmişse)
user.id="12345"
```

## Best Practices

1. **Development**: Her zaman console exporter'ı aktif tutun
2. **Production**: Sampling rate'i %1-10 arası tutun
3. **PII**: Kullanıcı bilgilerini asla loglamayın
4. **Span Adları**: Anlamlı ve tutarlı isimler kullanın
5. **Attribute'lar**: Gerekli minimum bilgiyi ekleyin

## Kaynaklar

- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [OpenTelemetry Troubleshooting](https://opentelemetry.io/docs/concepts/sdk-configuration/general/)
- [OTLP Specification](https://opentelemetry.io/docs/specs/otlp/)
