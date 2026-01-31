# CineSearch Test Documentation

Bu doküman CineSearch uygulamasının test yapısını ve kullanımını açıklar.

## Test Türleri

### 1. Unit Tests (`tests/unit/`)

Bireysel bileşenlerin, hook'ların, store'ların ve servislerin izole testleri.

#### Components (`tests/unit/components/`)

- [`movie-card.test.tsx`](unit/components/movie-card.test.tsx) - Film kartı bileşeni testleri
- [`skeleton.test.tsx`](unit/components/skeleton.test.tsx) - Skeleton loading bileşeni testleri
- [`error-boundary.test.tsx`](unit/components/error-boundary.test.tsx) - Error boundary bileşeni testleri
- [`auth-transition.test.tsx`](unit/components/auth-transition.test.tsx) - Auth geçiş animasyonu testleri

#### Hooks (`tests/unit/hooks/`)

- [`useMovies.test.ts`](unit/hooks/useMovies.test.ts) - Film listesi hook testleri
- [`useFavorites.test.tsx`](unit/hooks/useFavorites.test.tsx) - Favoriler hook testleri
- [`useSearch.test.ts`](unit/hooks/useSearch.test.ts) - Arama hook testleri
- [`useTheme.test.ts`](unit/hooks/useTheme.test.ts) - Tema hook testleri
- [`useAuth.test.tsx`](unit/hooks/useAuth.test.tsx) - Auth hook testleri

#### Stores (`tests/unit/store/`)

- [`authStore.test.ts`](unit/store/authStore.test.ts) - Auth store testleri
- [`themeStore.test.ts`](unit/store/themeStore.test.ts) - Tema store testleri

#### Services (`tests/unit/services/`)

- [`tmdb.test.ts`](unit/services/tmdb.test.ts) - TMDB API servis testleri

#### Schemas (`tests/unit/schemas/`)

- [`auth.test.ts`](unit/schemas/auth.test.ts) - Auth schema validasyon testleri
- [`movie.test.ts`](unit/schemas/movie.test.ts) - Movie schema validasyon testleri

### 2. Integration Tests (`tests/integration/`)

Birden fazla bileşenin birlikte çalışmasının testleri.

#### Screens (`tests/integration/screens/`)

- [`login.test.tsx`](integration/screens/login.test.tsx) - Login ekranı entegrasyon testleri
- [`register.test.tsx`](integration/screens/register.test.tsx) - Register ekranı entegrasyon testleri
- [`home.test.tsx`](integration/screens/home.test.tsx) - Ana sayfa entegrasyon testleri
- [`favorites.test.tsx`](integration/screens/favorites.test.tsx) - Favoriler ekranı entegrasyon testleri
- [`settings.test.tsx`](integration/screens/settings.test.tsx) - Ayarlar ekranı entegrasyon testleri
- [`movie-detail.test.tsx`](integration/screens/movie-detail.test.tsx) - Film detay ekranı entegrasyon testleri

### 3. Snapshot Tests (`tests/snapshot/`)

UI bileşenlerinin görsel snapshot testleri.

#### Components (`tests/snapshot/components/`)

- [`movie-card.snapshot.test.tsx`](snapshot/components/movie-card.snapshot.test.tsx) - Film kartı snapshot testleri
- [`skeleton.snapshot.test.tsx`](snapshot/components/skeleton.snapshot.test.tsx) - Skeleton snapshot testleri
- [`error-boundary.snapshot.test.tsx`](snapshot/components/error-boundary.snapshot.test.tsx) - Error boundary snapshot testleri

### 4. E2E Tests (`e2e/`)

Detox ile gerçek cihaz/simülatör üzerinde uçtan uca testler.

- [`auth.test.ts`](auth.test.ts) - Auth akışı E2E testleri
- [`movies.test.ts`](movies.test.ts) - Film akışı E2E testleri
- [`settings.test.ts`](settings.test.ts) - Ayarlar akışı E2E testleri

## Komutlar

### Tüm Testleri Çalıştır

```bash
npm test
```

### Unit Testleri

```bash
npm run test:unit
```

### Integration Testleri

```bash
npm run test:integration
```

### Snapshot Testleri

```bash
npm run test:snapshot
```

### Coverage Raporu

```bash
npm run test:coverage
```

### Watch Modu

```bash
npm run test:watch
```

### E2E Testleri (iOS)

```bash
# Build
npm run detox:build:ios

# Test
npm run test:e2e:ios
```

### E2E Testleri (Android)

```bash
# Build
npm run detox:build:android

# Test
npm run test:e2e:android
```

## Mock'lar

### Mock Veriler (`tests/__mocks__/mockData.ts`)

Testlerde kullanılan mock veriler:

- `mockMovies` - Örnek film verileri
- `mockMovieDetails` - Örnek film detay verileri
- `mockUser` - Örnek kullanıcı verisi
- `mockTheme` - Örnek tema renkleri
- `mockApiResponse` - Örnek API yanıtları

### Test Utilities (`tests/__mocks__/test-utils.tsx`)

Test için yardımcı fonksiyonlar:

- `render` - Provider'larla sarmalanmış render fonksiyonu
- `waitForAsync` - Asenkron işlemler için bekleme fonksiyonu
- `mockFetchResponse` - Fetch mock yanıt oluşturucu
- `mockFetchError` - Fetch mock hata oluşturucu

## Test Setup (`tests/setup.ts`)

Tüm testler için ortak mock'lar ve konfigürasyon:

- React Native Reanimated mock
- Expo Router mock
- Expo Secure Store mock
- Async Storage mock
- React i18next mock
- Zustand mock
- Global fetch mock

## Detox Konfigürasyonu (`.detoxrc.js`)

Detox E2E test konfigürasyonu:

- iOS simülatör yapılandırması
- Android emülatör yapılandırması
- Debug ve release build ayarları

## En İyi Uygulamalar

1. **Test İzolasyonu**: Her test bağımsız olmalı ve diğer testlerden etkilenmemeli
2. **Mock Kullanımı**: Dış bağımlılıklar mock'lanmalı
3. **Açıklayıcı İsimler**: Test isimleri ne test edildiğini açıkça belirtmeli
4. **Arrange-Act-Assert**: Testler bu yapıya uygun yazılmalı
5. **Coverage**: Kritik path'ler için yüksek coverage hedeflenmeli

## Hata Ayıklama

### Test Hataları

```bash
# Detaylı hata mesajları
npm test -- --verbose

# Belirli bir test dosyası
npm test -- movie-card.test.tsx

# Belirli bir test
npm test -- -t "should render correctly"
```

### E2E Hataları

1. **Test İzolasyonu**: Her test bağımsız olmalı ve diğer testlerden etkilenmemeli
2. **Mock Kullanımı**: Dış bağımlılıklar mock'lanmalı
3. **Açıklayıcı İsimler**: Test isimleri ne test edildiğini açıkça belirtmeli
4. **Arrange-Act-Assert**: Testler bu yapıya uygun yazılmalı
5. **Coverage**: Kritik path'ler için yüksek coverage hedeflenmeli

## Hata Ayıklama

### Test Hataları

```bash
# Detaylı hata mesajları
npm test -- --verbose

# Belirli bir test dosyası
npm test -- movie-card.test.tsx

# Belirli bir test
npm test -- -t "should render correctly"
```

### E2E Hataları

```bash
# Detaylı loglar
npm run test:e2e:ios -- --loglevel verbose

# Tekrar çalıştırma
npm run test:e2e:ios -- --reuse
```

## CI/CD Entegrasyonu

GitHub Actions veya benzeri bir CI/CD aracında:

```yaml
- name: Run Unit Tests
  run: npm run test:unit

- name: Run Integration Tests
  run: npm run test:integration

- name: Run E2E Tests (iOS)
  run: |
    npm run detox:build:ios
    npm run test:e2e:ios
```
