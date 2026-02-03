# CineSearch Infrastructure Guide

> Bu doküman hem AI agent'lar hem de geliştiriciler için proje altyapısını anlamak ve geliştirme yaparken dikkat edilmesi gereken noktaları açıklar.

## 📁 Proje Yapısı

```
CineSearch/
├── app/                    # Expo Router sayfa yapısı
│   ├── (auth)/            # Kimlik doğrulama ekranları
│   ├── (movies)/          # Film detay ekranları
│   ├── (settings)/        # Ayarlar ekranları
│   ├── (tabs)/            # Ana tab navigasyonu
│   └── _layout.tsx        # Root layout
├── src/                   # Kaynak kodlar
│   ├── analytics/         # Analytics adaptörleri
│   ├── auth/              # Sosyal giriş servisleri
│   ├── components/        # Paylaşılan bileşenler
│   ├── config/            # Uygulama konfigürasyonları
│   ├── constants/         # Sabit değerler
│   ├── core/              # Çekirdek servisler ve tipler
│   ├── deep-linking/      # Deep link yapılandırması
│   ├── features/          # Feature-based modüller
│   ├── hooks/             # Custom React hooks
│   ├── i18n/              # Çoklu dil desteği
│   ├── notifications/     # Push notification servisleri
│   ├── otel/              # OpenTelemetry entegrasyonu
│   ├── providers/         # React context providers
│   ├── schemas/           # Zod validation şemaları
│   ├── security/          # Güvenlik servisleri
│   ├── sentry/            # Hata izleme
│   ├── services/          # API servisleri
│   ├── store/             # Zustand state yönetimi
│   └── ui/                # UI bileşen kütüphanesi
├── tests/                 # Test dosyaları
│   ├── unit/              # Unit testler
│   ├── integration/       # Entegrasyon testleri
│   └── snapshot/          # Snapshot testleri
├── e2e/                   # Detox E2E testleri
└── docs/                  # Dokümantasyon
```

## 🔧 Temel Teknolojiler

| Teknoloji | Versiyon | Kullanım Alanı |
|-----------|----------|----------------|
| React Native | 0.81+ | Mobil uygulama framework |
| Expo | SDK 53+ | Geliştirme platformu |
| Expo Router | 6.x | Dosya tabanlı navigasyon |
| TypeScript | 5.x | Tip güvenliği |
| Zustand | 5.x | State yönetimi |
| TanStack Query | 5.x | Server state yönetimi |
| react-hook-form | 7.x | Form yönetimi |
| Zod | 3.x | Şema validasyonu |
| i18next | 24.x | Çoklu dil desteği |

## ⚠️ Kritik Kurallar

### 1. Import Path Alias Kullanımı

```typescript
// ✅ Doğru
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/ui/components/Button/Button';

// ❌ Yanlış
import { useTheme } from '../../../hooks/use-theme';
```

**Konfigürasyon:** `tsconfig.json` içinde `@/*` alias'ı `src/*` dizinine işaret eder.

### 2. Expo Router Navigasyon Yapısı

```
app/
├── (group)/           # Route grupları (URL'de görünmez)
│   ├── _layout.tsx    # Grup layout'u
│   └── page.tsx       # Sayfa bileşeni
├── [param].tsx        # Dinamik route
└── index.tsx          # Ana sayfa
```

**Önemli:**
- Her route grubunun bir `_layout.tsx` dosyası olmalı
- Dinamik parametreler `[param]` formatında
- `(group)` parantezli klasörler URL'de görünmez

### 3. State Yönetimi Stratejisi

| State Tipi | Çözüm | Örnek |
|------------|-------|-------|
| UI State | React useState | Modal açık/kapalı |
| Global State | Zustand | Tema, kullanıcı bilgisi |
| Server State | TanStack Query | API verileri |
| Form State | react-hook-form | Form değerleri |

### 4. Form Geliştirme Standartları

```typescript
// Form şeması (src/schemas/)
const schema = z.object({
  name: z.string().min(2, 'validation.nameRequired'),
  email: z.string().email('validation.emailInvalid'),
});

// Form hook kullanımı
const { control, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
  defaultValues: { name: '', email: '' },
});
```

**Kurallar:**
- Tüm formlar `react-hook-form` ile yönetilmeli
- Validasyon mesajları i18n key'leri olmalı
- Şemalar `src/schemas/` altında tanımlanmalı

### 5. Çoklu Dil Desteği (i18n)

```typescript
// Çeviri dosyaları: src/i18n/locales/{lang}.json
{
  "editProfile": {
    "title": "Edit Profile",
    "nameRequired": "Name is required"
  }
}

// Kullanım
const { t } = useTranslation();
t('editProfile.title');
```

**Kurallar:**
- Tüm kullanıcıya görünen metinler i18n üzerinden
- Her yeni özellik için hem `en.json` hem `tr.json` güncellenmeli
- Nested key yapısı: `feature.subFeature.key`

### 6. API Entegrasyonu

```typescript
// src/services/tmdb.ts
export const tmdbApi = {
  getMovies: async (page: number) => {
    const response = await fetch(`${API_URL}/movies?page=${page}`);
    return response.json();
  },
};

// Hook kullanımı (src/hooks/)
export function useMovies(page: number) {
  return useQuery({
    queryKey: ['movies', page],
    queryFn: () => tmdbApi.getMovies(page),
  });
}
```

### 7. Tema ve Stil Yönetimi

```typescript
// Tema hook'u kullanımı
const { theme } = useTheme();

// Stil tanımı
const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.background,
    color: theme.text,
  },
});
```

**Tema Değişkenleri:**
- `theme.background` - Arka plan rengi
- `theme.card` - Kart arka planı
- `theme.text` - Ana metin rengi
- `theme.textSecondary` - İkincil metin
- `theme.primary` - Ana vurgu rengi
- `theme.error` - Hata rengi

### 8. Test Yazım Standartları

```typescript
// tests/unit/screens/example.test.tsx
describe('ExampleScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { getByText } = render(<ExampleScreen />);
    expect(getByText('Expected Text')).toBeTruthy();
  });
});
```

**Test Dosya Yapısı:**
- Unit testler: `tests/unit/`
- Entegrasyon testleri: `tests/integration/`
- E2E testler: `e2e/`

### 9. Güvenlik Kuralları

```typescript
// Hassas veri saklama
import { secureStorage } from '@/security/secure-storage';
await secureStorage.setItem('token', authToken);

// Asla yapılmaması gerekenler:
// ❌ AsyncStorage'da token saklama
// ❌ Console.log ile hassas veri yazdırma
// ❌ Hardcoded API key'ler
```

### 10. Performans Optimizasyonları

```typescript
// Memo kullanımı
const MemoizedComponent = React.memo(({ data }) => {
  return <View>{/* ... */}</View>;
});

// useCallback kullanımı
const handlePress = useCallback(() => {
  // handler logic
}, [dependencies]);

// FlatList optimizasyonu
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
/>
```

## 📋 Geliştirme Checklist

### Yeni Ekran Eklerken

- [ ] Route dosyası oluştur (`app/(group)/screen-name.tsx`)
- [ ] Layout dosyasını güncelle (gerekirse)
- [ ] i18n çevirilerini ekle (en.json, tr.json)
- [ ] Tema renklerini kullan
- [ ] Accessibility label'ları ekle
- [ ] Unit test yaz
- [ ] TypeScript tiplerini tanımla

### Yeni Hook Eklerken

- [ ] `src/hooks/` altında dosya oluştur
- [ ] JSDoc dokümantasyonu ekle
- [ ] Unit test yaz
- [ ] Export'u index.ts'e ekle (varsa)

### API Endpoint Eklerken

- [ ] `src/services/` altında fonksiyon ekle
- [ ] TanStack Query hook'u oluştur
- [ ] Error handling ekle
- [ ] Loading state'i yönet
- [ ] Offline desteği düşün

## 🚀 Komutlar

```bash
# Geliştirme
npm start                 # Expo dev server
npm run ios              # iOS simulator
npm run android          # Android emulator

# Test
npm test                 # Unit testleri çalıştır
npm run test:coverage    # Coverage raporu
npm run e2e:ios          # E2E testleri (iOS)

# Build
eas build --platform ios
eas build --platform android

# Lint
npm run lint             # ESLint kontrolü
npm run lint:fix         # Otomatik düzeltme
```

## 🔍 Debugging

### React Native Debugger
```bash
# Metro bundler logları
npx react-native log-ios
npx react-native log-android
```

### Network İstekleri
- Flipper kullanarak network trafiğini izle
- `src/otel/` OpenTelemetry ile trace'leri takip et

### State Debugging
- Zustand DevTools ile store'u incele
- React Query DevTools ile cache durumunu kontrol et

## 📚 Ek Kaynaklar

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [react-hook-form Docs](https://react-hook-form.com/)

---

> **Not:** Bu doküman proje geliştikçe güncellenmelidir. Yeni pattern'ler veya kurallar eklendiğinde bu dosyayı güncellemeyi unutmayın.
