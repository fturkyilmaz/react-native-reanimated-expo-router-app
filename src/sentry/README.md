# Sentry Entegrasyonu

Bu modül, CineSearch React Native uygulaması için Sentry hata izleme entegrasyonu sağlar.

## Özellikler

- **Crash Reporting**: Native ve JS crash'lerinin otomatik raporlanması
- **Error Tracking**: Hataların detaylı analizi ve context bilgisi
- **Breadcrumbs**: Kullanıcı aksiyonlarının ve olayların izlenmesi
- **Performance Monitoring**: Transaction ve span bazlı performans izleme
- **User Context**: Kullanıcı bilgilerinin hata raporlarına eklenmesi
- **Release Tracking**: Versiyon bazlı hata takibi

## Kurulum

### 1. Sentry DSN Alın

1. [Sentry.io](https://sentry.io) adresine gidin ve hesap oluşturun
2. Yeni bir proje oluşturun (React Native)
3. DSN anahtarınızı kopyalayın

### 2. Çevresel Değişkenleri Ayarlayın

`.env` dosyasına ekleyin:

```bash
# Sentry
EXPO_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### 3. Bağımlılıkları Yükleyin

```bash
npm install
```

## Kullanım

### Temel Kullanım

Sentry SDK uygulama başlatıldığında otomatik olarak başlar:

```tsx
// app/_layout.tsx
import { SentryProvider } from '@/sentry/provider';

export default function RootLayout() {
  return (
    <SentryProvider dsn={process.env.EXPO_PUBLIC_SENTRY_DSN}>
      {/* Uygulama içeriği */}
    </SentryProvider>
  );
}
```

### Hata Yakalama

#### Otomatik Hata Yakalama

Error Boundary ve TMDB servisi otomatik olarak Sentry'ye hata gönderir.

#### Manuel Hata Gönderme

```typescript
import { captureException } from '@/sentry';

try {
  await riskyOperation();
} catch (error) {
  captureException(error, {
    tags: { 
      component: 'MovieCard',
      operation: 'fetch_data'
    },
    extra: {
      movieId: 123,
      timestamp: Date.now()
    }
  });
}
```

### useSentry Hook

```tsx
import { useSentry } from '@/sentry/hooks';

function MovieCard({ movie }: { movie: Movie }) {
  const { captureError, logUserAction, setUserContext } = useSentry();

  const handlePress = async () => {
    // Kullanıcı aksiyonunu logla
    logUserAction('tap', 'MovieCard', { movieId: movie.id });

    try {
      await navigation.navigate('MovieDetail', { id: movie.id });
    } catch (error) {
      captureError(error as Error, {
        tags: { screen: 'MovieList' }
      });
    }
  };

  return (
    <Pressable onPress={handlePress}>
      {/* Card içeriği */}
    </Pressable>
  );
}
```

### Breadcrumb Ekleme

```typescript
import { addBreadcrumb, addApiBreadcrumb, addNavigationBreadcrumb } from '@/sentry';

// API çağrısı breadcrumb
addApiBreadcrumb('/movie/popular', 'GET', 200, 245);

// Navigation breadcrumb
addNavigationBreadcrumb('HomeScreen', 'MovieDetailScreen');

// User action breadcrumb
addUserActionBreadcrumb('button_press', 'LoginButton');

// Custom breadcrumb
addBreadcrumb({
  category: 'auth',
  message: 'User logged in',
  level: 'info',
  data: { userId: '123' }
});
```

### Kullanıcı Bilgisi Ayarlama

```typescript
import { setUser } from '@/sentry';

// Kullanıcı giriş yaptığında
setUser({
  id: user.id,
  email: user.email,
  username: user.name
});

// Kullanıcı çıkış yaptığında
setUser(null);
```

### Context ve Tag Ekleme

```typescript
import { setContext, setTag, setExtra } from '@/sentry';

// Context ekle
setContext('movie_info', {
  id: movie.id,
  title: movie.title,
  genre: movie.genre
});

// Tag ekle
setTag('screen', 'MovieDetail');
setTag('api_version', 'v3');

// Extra veri ekle
setExtra('request_id', 'abc-123');
setExtra('cache_hit', true);
```

### Mesaj Gönderme

```typescript
import { captureMessage } from '@/sentry';

// Bilgi mesajı
captureMessage('User completed onboarding', 'info');

// Uyarı mesajı
captureMessage('API rate limit approaching', 'warning');

// Hata mesajı (exception olmadan)
captureMessage('Invalid state detected', 'error');
```

## Sentry Dashboard Kullanımı

### Issues Sayfası

URL: `https://sentry.io/organizations/{org}/issues/`

- Hataları listeleyin
- Status'leri değiştirin (Unresolved, Resolved, Ignored)
- Assign edin
- Tag'lere göre filtreleyin

### Issue Detay

Bir hataya tıkladığınızda:

- **Stack Trace**: Hatanın oluştuğu satır
- **Breadcrumbs**: Hatadan önceki kullanıcı aksiyonları
- **Tags**: Otomatik ve manuel eklenen tag'ler
- **Context**: Eklenen context bilgileri
- **User**: Hata oluştuğundaki kullanıcı bilgisi
- **Device**: Cihaz bilgileri

### Performance Sayfası

URL: `https://sentry.io/organizations/{org}/performance/`

- Transaction'ları görüntüleyin
- Apdex score'ları inceleyin
- Slow transaction'ları bulun

### Releases Sayfası

URL: `https://sentry.io/organizations/{org}/releases/`

- Versiyon bazlı hata istatistikleri
- Release health (crash free users, sessions)
- Deploy tracking

## Alert Kurulumu

### Email Bildirimleri

1. Sentry Dashboard > Settings > Alerts
2. "Create Alert Rule"
3. Condition: "An issue is first seen" veya "An event occurs"
4. Action: "Send email to team"

### Slack Entegrasyonu

1. Settings > Integrations > Slack
2. Workspace bağlayın
3. Alert rule oluşturun:
   - Condition: `event.level:error`
   - Action: `Send Slack notification to #alerts`

### Discord Entegrasyonu

1. Settings > Integrations > Discord
2. Webhook URL ekleyin
3. Alert rule oluşturun

## Source Maps

Production hatalarında doğru stack trace için source map yükleyin:

```bash
# Expo ile
npx expo export

# Sentry CLI ile source map yükleme
npx @sentry/cli releases files {release} upload-sourcemaps ./dist
```

## Troubleshooting

### Hatalar Sentry'de Görünmüyor

**Kontrol Listesi:**

1. DSN doğru mu?
   ```typescript
   console.log(process.env.EXPO_PUBLIC_SENTRY_DSN);
   ```

2. SDK başlatıldı mı?
   ```typescript
   import { Sentry } from '@/sentry';
   console.log(Sentry.isInitialized());
   ```

3. Network bağlantısı var mı?

4. Sample rate 0 değil mi?
   ```typescript
   // Development'ta 1.0 olmalı
   sampleRate: 1.0
   ```

### Source Map Çalışmıyor

1. Release adı eşleşiyor mu?
   ```typescript
   release: 'cinesearch@1.0.0'
   ```

2. Source map doğru yüklendi mi?
   - Sentry Dashboard > Releases > {version} > Source Maps

### Native Crash'ler Raporlanmıyor

1. EAS Build kullanın:
   ```bash
   eas build --platform ios
   ```

2. Sentry plugin'i `app.json`'da yapılandırıldı mı?

## Best Practices

1. **Sensitive Data**: Kullanıcı şifreleri, token'ları asla loglamayın
2. **Breadcrumbs**: Önemli kullanıcı aksiyonlarını breadcrumb olarak ekleyin
3. **Context**: Hata ayıklamaya yardımcı olacak context bilgileri ekleyin
4. **Tags**: Filtreleme ve arama için anlamlı tag'ler kullanın
5. **User ID**: Her zaman user ID ekleyin (email değil)
6. **Release Tracking**: Her versiyon için release oluşturun

## Kaynaklar

- [Sentry React Native Docs](https://docs.sentry.io/platforms/react-native/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry Alert Rules](https://docs.sentry.io/product/alerts/alert-types/)
