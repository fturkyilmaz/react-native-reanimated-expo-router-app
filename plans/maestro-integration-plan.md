# CineSearch Maestro Testing Integration Plan (v2)

## Executive Summary

Bu plan, Maestro'nun Detox ile birlikte E2E test framework olarak entegrasyonunu ve CI/CD sürecine dahil edilmesini kapsar. Maestro hızlı kurulum, YAML tabanlı syntax ve derlenmiş uygulamalar üzerinde doğrudan çalışma avantajı sunar.

---

## 1. Proje Analizi

### Mevcut Test Durumu

| Aspect | Mevcut Uygulama |
|--------|-----------------|
| **E2E Framework** | Detox (JavaScript/TypeScript) |
| **Test Konumu** | `e2e/` dizini |
| **Test Dosyaları** | `auth.test.ts`, `movies.test.ts`, `settings.test.ts` |
| **Package.json Scripts** | `test:e2e:ios`, `test:e2e:android` |
| **App Identifier** | `host.exp.Exponent` (Expo Go) / `com.cinesearch` (Release) |

### App Configuration (app.json)

```json
{
  "expo": {
    "name": "CineSearch",
    "slug": "CineSearch",
    "scheme": "cinesearch"
  }
}
```

### Maestro AppId Stratejisi

| Environment | AppId | Notes |
|-------------|-------|-------|
| **Expo Go** | `host.exp.Exponent` | Development testing |
| **Development Build** | `com.cinesearch` | Requires dev build |
| **Release** | `com.cinesearch` | Production build |

---

## 2. Maestro Kurulumu

### Ön Gereksinimler

```bash
# macOS (via Homebrew)
brew install maestro

# Verify installation
maestro --version

# Android için ANDROID_HOME ayarlandığından emin ol
# iOS için Xcode command line tools yüklü olmalı
```

### Doğrulama Adımları

```bash
# Maestro çalışıyor mu kontrol et
maestro doctor

# Şunları göstermeli:
# - Maestro: ✓ Installed
# - Android: ✓ Configured (ANDROID_HOME set ise)
# - iOS: ✓ Configured (Xcode yüklü ise)
```

---

## 3. Kritik İyileştirmeler

### 3.1 Dinamik Deep Link Yönetimi

Expo projelerinde Maestro ile uygulama başlatırken sadece `launchApp` kullanmak yerine, belirli ekranlara doğrudan atlamak (Deep Linking) test süresini %40 oranında kısaltır.

**config.yaml içine env bazlı scheme yapısı:**

```yaml
appId: ${APP_ID}
name: CineSearch E2E Tests

env:
  APP_ID: "host.exp.Exponent"  # Expo Go için varsayılan
  # CI'da override edilebilir: export APP_ID="com.cinesearch"

# Deep Link örnekleri:
# - openLink: "cinesearch://movie/550"  # Detay sayfasına direkt gitmek
# - openLink: "cinesearch://discover"    # Keşfet sayfasına gitmek
# - openLink: "cinesearch://favorites"   # Favoriler sayfasına gitmek
```

**setup.yaml - Auth token injection simülasyonu:**

```yaml
appId: ${APP_ID}
name: Setup - Skip Login with Deep Link
---
# Login ekranını atla, direkt ana sayfaya git
- openLink: "cinesearch://discover"

# Alternatif: Login yap ve session kaydet
- launchApp
- tapOn: "email-input"
- inputText: "test@test.com"
- tapOn: "password-input"
- inputText: "123456"
- tapOn: "Giriş Yap"
- waitForAnimationToEnd
- assertVisible: "Popüler"

# Session'ı koru - sonraki testler için
- saveState:
    key: "session"
    value: "authenticated"
```

### 3.2 Maestro Studio & State Injection

Maestro'nun `clearState` komutu uygulamayı sıfırlar ancak giriş yapma zorunluluğu her seferinde zaman kaybettirir.

**Auth Token Injection Flow:**

```yaml
# maestro/flows/setup/auth-flow.yaml
appId: ${APP_ID}
name: Setup - Authenticated State
---
- launchApp

# Eğer login ekranındaysa login yap
- extendedWaitUntil:
    timeout: 5000
    visible:
      - "email-input"
    then:
      - tapOn: "email-input"
      - inputText: "test@test.com"
      - tapOn: "password-input"
      - inputText: "123456"
      - tapOn: "Giriş Yap"
      - waitForAnimationToEnd

# Ana sayfaya git (deep link ile hızlandırma)
- openLink: "cinesearch://discover"
- waitForAnimationToEnd
- assertVisible: "movies-flatlist"
```

### 3.3 Çoklu Dil (i18n) Test Stratejisi

CineSearch projesi `react-i18next` kullanıyor ve `t('auth.login')` gibi çeviriler mevcut. Maestro YAML dosyalarında "Giriş Yap" diye hard-coded metin aratırsan, cihaz dili İngilizce olduğunda test patlar.

**Kurallar:**

1. **Her zaman testID kullan** - Metin bazlı kontrollerden kaçın
2. **Regex desteği kullan** - Metin bazlı kaçınılmaz ise
3. **i18n key'lerini testID olarak kullan** - Tutarlılık için

**Örnek - testID öncelikli yaklaşım:**

```yaml
# Doğru - testID kullanarak
- tapOn:
    id: "email-input"
- inputText: "test@test.com"

# Kötü - dile bağlı metin kullanmak
- tapOn: "Giriş Yap"  # Türkçe-only!

# Alternatif - Regex ile (dile bağlı değil)
- tapOn:
    regex: ".*Giriş.*|.*Login.*|.*Sign In.*"
```

**React Native'de testID ekleme:**

```tsx
// app/(auth)/login.tsx
<Controller
  control={control}
  render={({ field: { onChange, onBlur, value } }) => (
    <TextInput
      testID="email-input"  // Her zaman ekle
      onBlur={onBlur}
      onChangeText={onChange}
      value={value}
      placeholder={t('auth.emailPlaceholder')}
    />
  )}
/>

<Pressable
  testID="login-button"  // Text yerine testID
  onPress={handleSubmit(onSubmit)}
>
  <Text>{t('auth.login')}</Text>
</Pressable>
```

### 3.4 Network Flakiness (Ağ Dalgalanması) Yönetimi

Film verileri TMDB'den geldiği için API gecikmeleri testleri "flaky" (istikrarsız) yapabilir.

**Retry mekanizması ekle:**

```yaml
# maestro/flows/movies/discover.yaml
appId: ${APP_ID}
name: Movie Discovery with Retry
---
- runFlow: ../setup/auth-flow.yaml  # Login akışını çağır

# API gecikmesi için retry ile movie card bekle
- repeat:
    times: 3
    timeout: 10000
    commands:
      - scroll
      - scroll
    whileElementNotVisible: "movie-card-0"

# Pull-to-refresh retry
- swipe:
    direction: DOWN
    start: 50%, 20%
    end: 50%, 80%
- repeat:
    times: 2
    commands:
      - scroll
    timeout: 5000
    whileElementNotVisible: "movie-card-0"

# Network timeout için extendedWaitUntil
- extendedWaitUntil:
    timeout: 15000
    visible:
      - "movies-flatlist"
```

### 3.5 Görsel Regresyon (Visual Testing)

Maestro'nun en güçlü yanlarından biri ekran görüntüsü alabilmesidir.

**Screenshot adımları:**

```yaml
# maestro/flows/movies/movie-detail.yaml
appId: ${APP_ID}
name: Movie Detail with Visual Testing
---
- runFlow: ../setup/auth-flow.yaml

# İlk movie'e tıkla
- tapOn: "movie-card-0"

# Movie detail ekranının screenshot'ını al
- takeScreenshot:
    name: "movie-detail-initial"
    path: ".maestro/screenshots/movie-detail.png"

# Scroll down ve başka screenshot
- scroll
- takeScreenshot:
    name: "movie-detail-scrolled"
    path: ".maestro/screenshots/movie-detail-scrolled.png"

# Video player açıldığında screenshot
- tapOn: "video-player"
- takeScreenshot:
    name: "video-player"
    path: ".maestro/screenshots/video-player.png"
```

**CI'da artifact olarak saklama:**

```yaml
# GitHub Actions workflow'da
- name: Upload Maestro Screenshots
  uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: maestro-screenshots
    path: .maestro/screenshots/
```

---

## 4. Component Accessibility Analizi

### Mevcut testID'ler (Detox testlerinden)

| Component | testID | Location |
|-----------|--------|----------|
| Email Input | `email-input` | Login, Register screens |
| Password Input | `password-input` | Login, Register screens |
| Confirm Password | `confirm-password-input` | Register screen |
| Name Input | `name-input` | Register screen |
| Movie List | `movies-flatlist` | Discover screen |
| Movie Card | `movie-card-0`, `movie-card-1` | Discover screen |
| Tab: Home | `tab-home` | Tab bar |
| Tab: Favorites | `tab-favorites` | Tab bar |
| Tab: Settings | `tab-settings` | Tab bar |
| Tab: Watchlist | `tab-watchlist` | Tab bar |
| Favorite Button | `favorite-button` | Movie detail |
| Remove Favorite | `remove-favorite-0` | Favorites screen |

### Eklenmesi Gereken testID'ler

| Component | Suggested testID | Priority |
|-----------|------------------|----------|
| Search Input | `search-input` | High |
| Search Results | `search-results` | High |
| Tab: Discover | `tab-discover` | High |
| Movie Title | `movie-title-0` | Medium |
| Movie Rating | `movie-rating-0` | Medium |
| Back Button | `back-button` | Medium |
| Settings Screen | `settings-screen` | Low |
| Logout Button | `logout-button` | High |
| Watchlist Button | `watchlist-button` | Medium |

---

## 5. Maestro Akış Dosyaları Yapısı

```
maestro/
├── config.yaml                    # Global yapılandırma
├── maestro.yaml                  # Maestro CI yapılandırması
├── maestro-ci.yaml               # Cloud CI yapılandırması
├── flows/
│   ├── setup/
│   │   ├── auth-flow.yaml        # Login ve auth state
│   │   └── clear-state.yaml     # State temizleme
│   ├── auth/
│   │   ├── login.yaml           # Login testleri
│   │   └── register.yaml        # Register testleri
│   ├── movies/
│   │   ├── discover.yaml        # Film keşif testleri
│   │   ├── movie-detail.yaml    # Film detay testleri
│   │   └── search.yaml          # Arama testleri
│   ├── favorites/
│   │   ├── add-favorite.yaml    # Favori ekleme
│   │   └── remove-favorite.yaml # Favori kaldırma
│   ├── watchlist/
│   │   ├── add-watchlist.yaml   # Watchlist ekleme
│   │   └── remove-watchlist.yaml# Watchlist kaldırma
│   └── tabs/
│       ├── navigation.yaml       # Tab navigasyon testleri
│       └── settings.yaml        # Ayarlar sayfası testleri
├── data/
│   ├── test-data.yaml           # Test verileri (legacy)
│   └── .env.test               # Environment variables (önerilen)
└── scripts/
    ├── setup-android.sh         # Android emulator başlatma
    ├── setup-ios.sh             # iOS simulator başlatma
    └── check-app-id.js          # AppId kontrol scripti
```

---

## 6. Maestro Yapılandırma Dosyaları

### 6.1 Ana Config (config.yaml)

```yaml
appId: ${APP_ID}
name: CineSearch E2E Tests

# Varsayılan timeout
timeout: 10000

# Recording ayarları
recordActions: false
recordSlowActions: false

# Screenshot ayarları
takeScreenshotOnFailure: true

# Flow ayarları
continuousFlows:
  - name: smoke
    files:
      - flows/auth/login.yaml
      - flows/movies/discover.yaml

  - name: full
    files:
      - flows/auth/login.yaml
      - flows/auth/register.yaml
      - flows/movies/discover.yaml
      - flows/movies/search.yaml
      - flows/movies/movie-detail.yaml
      - flows/favorites/add-favorite.yaml
      - flows/favorites/remove-favorite.yaml
      - flows/watchlist/add-watchlist.yaml
      - flows/watchlist/remove-watchlist.yaml
      - flows/tabs/navigation.yaml
      - flows/tabs/settings.yaml

# Android ayarları
android:
  device:
    orientation: PORTRAIT
    model: "Pixel_6"

# iOS ayarları
ios:
  device:
    orientation: PORTRAIT
    type: "iPhone 15"
```

### 6.2 CI Yapılandırması (.maestro-ci.yaml)

```yaml
appId: ${APP_ID}
name: CineSearch CI Configuration

# CI'da daha uzun timeout
timeout: 20000

# Artifacts
artifacts:
  - path: .maestro/reports/**
  - path: .maestro/screenshots/**
  - path: .maestro/logs/**

# Reporting
report:
  format: junit
  output: .maestro/reports/junit-report.xml
  includeLabels: true
```

### 6.3 Environment Variables (.env.test)

```env
# Test Credentials
TEST_EMAIL=test@test.com
TEST_PASSWORD=123456
TEST_NAME=Test User

# App Configuration
APP_ID=host.exp.Exponent
MAESTRO_TIMEOUT=10000

# API Configuration (opsiyonel)
TMDB_API_KEY=test_api_key
```

---

## 7. Akış Örnekleri

### 7.1 Login Akışı (login.yaml)

```yaml
appId: ${APP_ID}
name: Login Flow Tests
env:
  EMAIL: ${TEST_EMAIL}
  PASSWORD: ${TEST_PASSWORD}
---
- launchApp
- assertVisible: "email-input"

# Test 1: Invalid email validation
- tapOn: "email-input"
- inputText: "invalid-email"
- tapOn: "password-input"
- inputText: "123456"
- tapOn: "login-button"
- assertVisible: "Geçerli bir e-posta adresi giriniz"

# Test 2: Short password validation
- tapOn: "email-input"
- clearText
- inputText: ${EMAIL}
- tapOn: "password-input"
- clearText
- inputText: "123"
- tapOn: "login-button"
- assertVisible: "Şifre en az 6 karakter olmalı"

# Test 3: Successful login
- tapOn: "email-input"
- clearText
- inputText: ${EMAIL}
- tapOn: "password-input"
- clearText
- inputText: ${PASSWORD}
- tapOn: "login-button"
- waitForAnimationToEnd
- assertVisible: "movies-flatlist"
```

### 7.2 Movie Discovery Akışı (discover.yaml)

```yaml
appId: ${APP_ID}
name: Movie Discovery Flow Tests
---
- runFlow: ../setup/auth-flow.yaml

# Test: Film listesini görüntüle
- assertVisible: "movies-flatlist"
- assertVisible: "movie-card-0"

# Test: Filmlerde scroll et (retry ile)
- repeat:
    times: 3
    commands:
      - scroll
    timeout: 5000
    whileElementNotVisible: "movie-card-3"

# Test: Pull to refresh
- swipe:
    direction: DOWN
    start: 50%, 20%
    end: 50%, 80%
- takeScreenshot:
    name: "after-refresh"
    path: ".maestro/screenshots/refresh.png"

# Test: Film detayına git
- tapOn: "movie-card-0"
- assertVisible: "movie-detail-screen"
- assertVisible: "favorite-button"
```

### 7.3 Search Akışı (search.yaml)

```yaml
appId: ${APP_ID}
name: Search Flow Tests
---
- runFlow: ../setup/auth-flow.yaml

# Test: Search input'a tıkla
- tapOn: "search-input"
- inputText: "Inception"

# Test: Sonuçları bekle (API gecikmesi için retry)
- repeat:
    times: 3
    timeout: 10000
    commands:
      - waitForAnimationToEnd
    whileElementNotVisible: "search-results"

# Test: İlk sonuca tıkla
- tapOn: "search-results"
- assertVisible: "movie-detail-screen"
```

### 7.4 Favorites Akışı (add-favorite.yaml)

```yaml
appId: ${APP_ID}
name: Add to Favorites Flow Tests
---
- runFlow: ../setup/auth-flow.yaml

# Test: Film detayına git
- tapOn: "movie-card-0"
- assertVisible: "movie-detail-screen"

# Test: Favori butonuna tıkla
- tapOn: "favorite-button"
- takeScreenshot:
    name: "after-favorite"
    path: ".maestro/screenshots/favorite-added.png"

# Test: Favorites tab'a git
- tapOn: "tab-favorites"
- assertVisible: "favorite-movie-0"
```

---

## 8. State Reset Stratejisi

### 8.1 Clear State Flow

```yaml
# maestro/flows/setup/clear-state.yaml
appId: ${APP_ID}
name: Clear App State
---
# Uygulama state'ini temizle
- clearState

# Yeniden başlat
- launchApp

# Login ekranına git
- extendedWaitUntil:
    timeout: 5000
    visible:
      - "email-input"
    then:
      - assertVisible: "Tekrar Hoşgeldiniz"
```

### 8.2 Logout Flow

```yaml
# maestro/flows/tabs/settings.yaml
appId: ${APP_ID}
name: Settings and Logout Flow Tests
---
- runFlow: ../setup/auth-flow.yaml

# Settings tab'ine git
- tapOn: "tab-settings"
- assertVisible: "settings-screen"

# Logout yap
- tapOn: "logout-button"
- assertVisible: "login-button"
```

---

## 9. Error Handling Örnekleri

### 9.1 Validation Error Assertions

```yaml
# Login validation errors
- tapOn: "login-button"
- assertVisible: "Geçerli bir e-posta adresi giriniz"

# Password validation
- inputText: "123"
- assertVisible: "Şifre en az 6 karakter olmalı"

# Registration validation
- inputText: "A"  # Short name
- assertVisible: "İsim en az 2 karakter olmalı"
```

### 9.2 Network Error Handling

```yaml
# API timeout handling
- scroll
- repeat:
    times: 2
    timeout: 15000
    commands:
      - scroll
    whileElementNotVisible: "movie-card-0"
- assertVisible: "movie-card-0"
```

---

## 10. CI/CD Entegrasyonu

### 10.1 GitHub Actions Workflow

```yaml
# .github/workflows/maestro-tests.yml
name: Maestro Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  maestro-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Maestro
        run: brew install maestro
      
      - name: Install iOS Simulator
        run: |
          xcodebuild -downloadPlatform -platform iOS Simulator
          xcrun simctl list devices available
      
      - name: Build Expo App
        run: |
          npm ci
          npx expo export --platform ios
      
      - name: Start Expo Server
        run: npx expo start --ios --no-interactive &
        timeout-minutes: 5
      
      - name: Run Maestro Tests
        env:
          APP_ID: host.exp.Exponent
          TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
        run: |
          sleep 30  # Wait for Expo server
          maestro test maestro/config.yaml --platform ios
      
      - name: Upload Test Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: maestro-report-ios
          path: .maestro/reports/

      - name: Upload Screenshots
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: maestro-screenshots-ios
          path: .maestro/screenshots/

  maestro-android:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Android
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 34
          arch: x86_64
          device: pixel_6
          script: echo "Emulator started"
      
      - name: Install Maestro
        run: brew install maestro
      
      - name: Build and Install Expo App
        run: |
          npm ci
          npx expo export --platform android
          adb install app.apk
      
      - name: Run Maestro Tests
        env:
          APP_ID: host.exp.Exponent
          TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
        run: maestro test maestro/config.yaml --platform android
      
      - name: Upload Test Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: maestro-report-android
          path: .maestro/reports/
```

### 10.2 Parallel Execution

```yaml
# CI'da test gruplarını paralel çalıştır
jobs:
  maestro-auth:
    runs-on: macos-latest
    steps:
      - run: maestro test maestro/flows/auth/
  
  maestro-movies:
    runs-on: macos-latest
    steps:
      - run: maestro test maestro/flows/movies/
  
  maestro-favorites:
    runs-on: macos-latest
    steps:
      - run: maestro test maestro/flows/favorites/
  
  maestro-tabs:
    runs-on: macos-latest
    steps:
      - run: maestro test maestro/flows/tabs/
```

---

## 11. Coverage Raporlama

### Maestro Test Coverage

```yaml
# config.yaml'da coverage ayarları
coverage:
  enabled: true
  reports:
    - format: junit
      output: .maestro/reports/coverage/junit.xml
    - format: html
      output: .maestro/reports/coverage/html/index.html

# CI'da coverage artifact
- name: Upload Coverage Report
  uses: actions/upload-artifact@v4
  with:
    name: maestro-coverage
    path: .maestro/reports/coverage/
```

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **CI entegrasyonu** | Her push/PR'da otomatik çalışma | GitHub Actions |
| **Coverage** | %80 user flow coverage | Flow coverage |
| **Flakiness** | < %5 | CI failure analysis |
| **Execution time** | < 5 dakika (smoke) | Pipeline duration |
| **Parallel execution** | Tüm suite < 10 dakika | Parallel jobs |

---

## 12. Device Farm / Cloud Testing

### Maestro Cloud Entegrasyonu

```bash
# Maestro Cloud'da test çalıştır
maestro cloud test maestro/config.yaml \
  --projectId cine-search-project \
  --devices "iPhone 15,iPhone 14,Pixel 6,Pixel 7"

# Sonuçları al
maestro cloud report --projectId cine-search-project
```

### Opsiyonel Entegrasyonlar

| Service | Entegrasyon | Kullanım |
|---------|-------------|----------|
| **Maestro Cloud** | Native | Cross-device testing |
| **AWS Device Farm** | CLI | Enterprise testing |
| **BrowserStack** | App Automate | Cross-platform |
| **Sauce Labs** | Real Device Cloud | Enterprise |

---

## 13. Script'ler

### 13.1 Android Setup Script

```bash
#!/bin/bash
# maestro/scripts/setup-android.sh

echo "🚀 Android Maestro Setup"

# Emulator başlat
echo "📱 Android Emulator başlatılıyor..."
$ANDROID_HOME/emulator/emulator -avd Pixel_6 -no-audio -no-window &
EMULATOR_PID=$!

# Emulator hazır olana bekle
echo "⏳ Emulator hazır olana kadar bekleniyor..."
until adb shell getprop sys.boot_completed | grep -q "1"; do
  sleep 5
done

echo "✅ Emulator hazır!"

# Expo Go veya dev build kur
echo "📦 App yükleniyor..."
adb install app.apk

echo "🎉 Setup tamamlandı!"
```

### 13.2 iOS Setup Script

```bash
#!/bin/bash
# maestro/scripts/setup-ios.sh

echo "🚀 iOS Maestro Setup"

# Simulator listele
echo "📱 Mevcut simulatorler:"
xcrun simctl list devices available

# Simulator başlat
echo "🚀 Simulator başlatılıyor..."
SIMULATOR_ID=$(xcrun simctl list devices available | grep "iPhone 15" | head -1 | grep -oE '[A-F0-9-]{36}')
xcrun simctl boot $SIMULATOR_ID 2>/dev/null || echo "Zaten açık"

# Expo app yükle (Expo Go veya dev build)
echo "📦 App yükleniyor..."
xcrun simctl install booted app.app

echo "🎉 Setup tamamlandı!"
```

### 13.3 AppId Kontrol Scripti

```javascript
// maestro/scripts/check-app-id.js

const { execSync } = require('child_process');

function checkAppId() {
  const platform = process.argv[2] || 'ios';
  
  if (platform === 'ios') {
    const simulators = execSync('xcrun simctl list devices available').toString();
    if (simulators.includes('iPhone')) {
      console.log('✅ iOS simulator found');
      console.log('📱 Using AppId: host.exp.Exponent (Expo Go)');
    }
  } else if (platform === 'android') {
    const devices = execSync('adb devices').toString();
    if (devices.includes('emulator')) {
      console.log('✅ Android emulator found');
      console.log('📱 Using AppId: host.exp.Exponent (Expo Go)');
    }
  }
}

checkAppId();
```

---

## 14. Documentation Update

### docs/testing.md - Maestro Section

```markdown
## Maestro E2E Testing

### Overview

Maestro is a mobile UI testing framework that provides a fast and reliable way to write E2E tests for React Native apps.

### Installation

```bash
# macOS
brew install maestro

# Verify
maestro --version
```

### Directory Structure

```
maestro/
├── config.yaml           # Global configuration
├── maestro.yaml         # CI configuration
├── flows/               # Test flow files
│   ├── auth/           # Authentication tests
│   ├── movies/         # Movie-related tests
│   ├── favorites/      # Favorites tests
│   ├── watchlist/     # Watchlist tests
│   └── tabs/          # Navigation tests
├── data/               # Test data
└── scripts/            # Setup scripts
```

### Running Tests

```bash
# All tests
yarn test:maestro

# iOS
yarn test:maestro:ios

# Android
yarn test:maestro:android

# Specific flow
yarn test:maestro:auth
yarn test:maestro:movies

# Open Studio
yarn maestro:studio
```

### CI/CD Integration

Maestro tests run automatically on GitHub Actions:

```yaml
# .github/workflows/maestro-tests.yml
name: Maestro Tests
on: [push, pull_request]
jobs:
  maestro:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Maestro
        run: brew install maestro
      - name: Run Tests
        run: maestro test maestro/config.yaml
      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: maestro-report
          path: .maestro/reports/
```

### Best Practices

1. **Use testIDs**: Always prefer `testID` over text selectors
2. **Handle i18n**: Use `testID` to avoid language-specific failures
3. **Retry mechanisms**: Add retries for network-dependent tests
4. **Screenshots**: Take screenshots for debugging in CI
5. **State management**: Use `clearState` for clean test runs
6. **Deep linking**: Use `openLink` to skip login flows

### Environment Variables

Create `.env.test` for test credentials:

```env
TEST_EMAIL=test@test.com
TEST_PASSWORD=123456
APP_ID=host.exp.Exponent
```

### Resources

- [Maestro Documentation](https://docs.maestro.dev)
- [Maestro GitHub](https://github.com/mobile-dev-inc/maestro)
- [Maestro Cloud](https://cloud.maestro.dev)
```

---

## 15. Uygulama Yol Haritası

### Phase 1: Foundation (Hafta 1)

| Task | Description | Effort |
|------|-------------|--------|
| Install Maestro | Set up Maestro CLI | 1 hour |
| Create directory structure | Create `maestro/` folder | 30 min |
| Create base config | Create `config.yaml`, `maestro.yaml` | 30 min |
| Add testID to auth components | Add `testID` to login/register screens | 2 hours |
| Create setup flow | Create `auth-flow.yaml` | 1 hour |

### Phase 2: Authentication Flows (Hafta 2)

| Task | Description | Effort |
|------|-------------|--------|
| Create login flow | Write `login.yaml` | 2 hours |
| Create register flow | Write `register.yaml` | 2 hours |
| Add i18n handling | Add regex patterns for multi-language | 1 hour |
| Test on iOS | Verify iOS compatibility | 1 hour |
| Test on Android | Verify Android compatibility | 1 hour |

### Phase 3: Core Features (Hafta 3)

| Task | Description | Effort |
|------|-------------|--------|
| Add movie testIDs | Add testIDs to movie components | 2 hours |
| Create discover flow | Write `discover.yaml` | 2 hours |
| Create search flow | Write `search.yaml` | 2 hours |
| Create movie detail flow | Write `movie-detail.yaml` | 2 hours |
| Add retry mechanisms | Add network retry logic | 1 hour |

### Phase 4: User Features (Hafta 4)

| Task | Description | Effort |
|------|-------------|--------|
| Add favorites testIDs | Add testIDs to favorites | 2 hours |
| Create favorites flows | Write `add-favorite.yaml`, `remove-favorite.yaml` | 2 hours |
| Create watchlist flows | Write watchlist tests | 2 hours |
| Create navigation flow | Write `navigation.yaml` | 1 hour |
| Create settings flow | Write `settings.yaml` | 1 hour |

### Phase 5: Documentation & CI (Hafta 5)

| Task | Description | Effort |
|------|-------------|--------|
| Update docs | Update `docs/testing.md` | 2 hours |
| Add npm scripts | Add Maestro scripts to `package.json` | 30 min |
| Create CI workflow | Add GitHub Actions workflow | 2 hours |
| Create setup scripts | Add `setup-android.sh`, `setup-ios.sh` | 1 hour |
| Final testing | Full test suite verification | 2 hours |

---

## 16. Hızlı Başlangıç Kontrol Listesi

- [ ] Maestro CLI kuruldu (`brew install maestro`)
- [ ] `maestro/` dizin yapısı oluşturuldu
- [ ] `config.yaml` yapılandırması tamamlandı
- [ ] Auth bileşenlerine `testID` eklendi
- [ ] `login.yaml` akışı yazıldı ve test edildi
- [ ] `auth-flow.yaml` setup akışı oluşturuldu
- [ ] i18n handling eklendi (regex pattern'ler)
- [ ] `docs/testing.md` güncellendi
- [ ] GitHub Actions workflow eklendi
- [ ] `.env.test` oluşturuldu
- [ ] Setup scriptleri yazıldı
- [ ] Smoke test suite'i başarıyla geçiyor

---

## 17. Maestro vs Detox Karşılaştırması

| Aspect | Maestro | Detox |
|--------|---------|-------|
| **Language** | YAML | TypeScript/JavaScript |
| **Setup** | Simple (CLI only) | Complex (build required) |
| **Execution Speed** | Fast | Slower |
| **Flakiness** | Lower | Higher |
| **Cross-platform** | Single test | Separate tests needed |
| **Learning Curve** | Low | Medium |
| **Recording** | Built-in | Not built-in |
| **CI Integration** | Easy | Moderate |
| **Deep Linking** | Native support | Requires configuration |
| **Visual Testing** | Built-in screenshots | External tools needed |

### Öneri

**Her iki framework'ü de kullan:**
- **Maestro**: Smoke tests, hızlı validasyon, cross-platform coverage
- **Detox**: Komplex senaryolar, deep integration tests, performance testing

---

## 18. Riskler ve Çözümler

| Risk | Impact | Mitigation |
|------|--------|------------|
| **i18n test failures** | High | Her zaman `testID` kullan, regex ile destekle |
| **Network flakiness** | Medium | Retry mekanizması ekle, timeout'ları artır |
| **Expo Go limitations** | Medium | Development build kullan |
| **iOS nested elements** | Medium | Nested component'lere `accessible={true}` ekle |
| **CI timeout** | Low | Parallel execution kullan |
| **Test data isolation** | Medium | `clearState` kullan, environment variables ile yönet |

---

## 19. Ek Test Senaryoları ve İyileştirmeler

### 19.1 Keyboard Handling (Kritik - Android)

Android'de klavyenin açık kalması `tapOn` komutlarını engelleyebilir. Her input sonrası klavyeyi kapatmak gerekir.

```yaml
# maestro/flows/auth/login-keyboard.yaml
appId: ${APP_ID}
name: Login with Keyboard Handling
---
- launchApp

# Email input - keyboard kapatma ile
- tapOn: "email-input"
- inputText: "test@test.com"

# Keyboard'ı kapat (Android)
- pressKey: "back"

# Password input
- tapOn: "password-input"
- inputText: "123456"

# Keyboard'ı kapat
- pressKey: "back"

- tapOn: "login-button"
```

**Keyboard Kapatma Alternatifleri:**

```yaml
# 1. Back tuşu ile
- pressKey: "back"

# 2. Dışarı tıklama ile
- tapOn:
    point: 50%, 90%  # Ekranın alt kısmına tıkla

# 3. Scroll ile (input gizlenir)
- scroll
```

### 19.2 Accessibility Testing

```yaml
# maestro/flows/accessibility.yaml
appId: ${APP_ID}
name: Accessibility Tests
---
- launchApp
- runFlow: ../setup/auth-flow.yaml

# Test: VoiceOver/TalkBack elementleri erişilebilir mi?
- assertVisible: "email-input"
- assertVisible: "password-input"

# Test: Touch target boyutları (min 44x44)
- assertVisible: "login-button"

# Test: Contrast (manuel kontrol gerekli)
- takeScreenshot:
    name: "accessibility-contrast-check"
    path: ".maestro/screenshots/accessibility.png"
```

### 19.3 Performance Testing

```yaml
# maestro/flows/performance.yaml
appId: ${APP_ID}
name: Performance Tests
---
- launchApp
- runFlow: ../setup/auth-flow.yaml

# Test: Login süresi
- measureTime:
    name: "login_performance"
    commands:
      - tapOn: "logout-button"
      - launchApp
      - tapOn: "email-input"
      - inputText: "test@test.com"
      - tapOn: "password-input"
      - inputText: "123456"
      - tapOn: "login-button"

# Threshold: 3 saniyeden az olmalı
- assertTimeLessThan: 3000  # 3 seconds

# Test: Scroll performansı
- assertVisible: "movies-flatlist"
- measureTime:
    name: "scroll_performance"
    commands:
      - scroll
      - scroll
      - scroll
```

### 19.4 Dark/Light Mode Testing

```yaml
# maestro/flows/theme.yaml
appId: ${APP_ID}
name: Theme Tests
---
- launchApp
- runFlow: ../setup/auth-flow.yaml

# Dark mode'a geç
- tapOn: "tab-settings"
- tapOn: "theme-toggle"
- waitForAnimationToEnd

# Screenshot al - dark mode
- takeScreenshot:
    name: "dark-mode-home"
    path: ".maestro/screenshots/dark-mode.png"

# Element görünürlüğünü kontrol et
- assertVisible: "movies-flatlist"

# Light mode'a geri dön
- tapOn: "theme-toggle"
```

### 19.5 Language Switching Tests

```yaml
# maestro/flows/language.yaml
appId: ${APP_ID}
name: Language Switching Tests
---
- launchApp

# Türkçe dilinde login
- assertVisible: "Giriş Yap"

# Settings'den dil değiştir
- tapOn: "tab-settings"
- tapOn: "language-dropdown"
- tapOn: "English"

# Uygulamayı yeniden başlat
- launchApp

# İngilizce metinleri kontrol et
- assertVisible: "Login"
- assertVisible: "Sign Up"
```

### 19.6 Offline Mode Testing

```yaml
# maestro/flows/offline.yaml
appId: ${APP_ID}
name: Offline Mode Tests
---
- launchApp
- runFlow: ../setup/auth-flow.yaml

# Offline modu simüle et
- disableCellular
- disableWifi

# Offline UI görünürlüğünü kontrol et
- assertVisible: "offline-banner"

# Film listesi cached mi?
- assertVisible: "movies-flatlist"

# Search offline çalışıyor mu?
- tapOn: "search-input"
- inputText: "Inception"
- assertVisible: "offline-search-message"

# Online'a geri dön
- enableCellular
- enableWifi
```

### 19.7 Biometric Authentication Testing

```yaml
# maestro/flows/biometric.yaml
appId: ${APP_ID}
name: Biometric Authentication Tests
---
- launchApp

# Biometric enabled mi kontrol et
- assertVisible: "biometric-button"

# Biometric butonuna tıkla
- tapOn: "biometric-button"

# Biometric dialog'u görünür mü?
- extendedWaitUntil:
    timeout: 5000
    visible:
      - "biometric-dialog"
    then:
      # Cancel ile kapat (biometric atlamak için)
      - tapOn: "biometric-cancel"
```

### 19.8 Screen Rotation/Orientation Testing

```yaml
# maestro/flows/orientation.yaml
appId: ${APP_ID}
name: Orientation Tests
---
- launchApp
- runFlow: ../setup/auth-flow.yaml

# Portrait modunu doğrula
- assertVisible: "movies-flatlist"

# Landscape'e çevir
- rotate: "LANDSCAPE"

# Landscape'de elementleri kontrol et
- assertVisible: "movies-flatlist"
- takeScreenshot:
    name: "landscape-mode"
    path: ".maestro/screenshots/landscape.png"

# Portrait'e geri çevir
- rotate: "PORTRAIT"
```

### 19.9 Deep Link Testing

```yaml
# maestro/flows/deep-links.yaml
appId: ${APP_ID}
name: Deep Link Tests
---
- launchApp

# Movie detail'e deep link ile git
- openLink: "cinesearch://movie/550"

# Movie detail ekranı açıldı mı?
- extendedWaitUntil:
    timeout: 5000
    visible:
      - "movie-detail-screen"
    then:
      - assertVisible: "movie-title"
      - assertVisible: "favorite-button"

# Discover sayfasına git
- openLink: "cinesearch://discover"
- assertVisible: "movies-flatlist"

# Favorites sayfasına git
- openLink: "cinesearch://favorites"
- assertVisible: "favorites-list"
```

### 19.10 Crash/Error Recovery Testing

```yaml
# maestro/flows/crash-recovery.yaml
appId: ${APP_ID}
name: Crash Recovery Tests
---
- launchApp

# Uygulama crash simülasyonu (gerçek crash değil, error handling)
- runFlow: ../setup/auth-flow.yaml

# Force close simülasyonu
- closeApp

# Yeniden başlat
- launchApp

# State korunmuş mu? (session devam ediyor mu?)
- extendedWaitUntil:
    timeout: 10000
    visible:
      - "movies-flatlist"  # Login ekranı değil, ana sayfa
```

### 19.11 Mock API Configuration (MSW Entegrasyonu)

Expo projesinde MSW (Mock Service Worker) kullanarak API mock'ları oluşturulabilir.

**`app/mock-server.js`:**

```javascript
// MSW mock server setup
import { setupWorker, rest } from 'msw/node';

const handlers = [
  rest.get('https://api.themoviedb.org/3/movie/popular', (req, res, ctx) => {
    return res(
      ctx.json({
        results: [
          { id: 550, title: 'Fight Club', overview: '...' },
        ]
      })
    );
  }),
];

export const worker = setupWorker(...handlers);
```

**Maestro akışı ile kullanım:**

```yaml
# maestro/flows/movies/mocked-discover.yaml
appId: ${APP_ID}
name: Mocked API Discover Tests
---
- launchApp
- runFlow: ../setup/auth-flow.yaml

# Mocked API'den dönen filmi kontrol et
- assertVisible: "movie-card-0"
- assertVisible: "Fight Club"  # Mock'tan dönen film

# Farklı mock verisi için
# MSW handler'ı değiştir ve test'i tekrarla
```

### 19.12 Test Data Setup & Cleanup

```yaml
# maestro/flows/setup/test-data-setup.yaml
appId: ${APP_ID}
name: Test Data Setup
---
- launchApp
- runFlow: ../setup/auth-flow.yaml

# Test için favori film ekle
- tapOn: "movie-card-0"
- tapOn: "favorite-button"

# Verilerin eklendiğini doğrula
- tapOn: "tab-favorites"
- assertVisible: "favorite-movie-0"

# Test sonrası cleanup
- tapOn: "remove-favorite-0"
- assertVisible: "Henüz Favori Yok"
```

---

## 20. Complete User Flow Coverage Matrix

| User Flow | testID Requirements | Maestro Flow | Priority |
|-----------|-------------------|--------------|----------|
| **Authentication** | | | |
| Login | `email-input`, `password-input`, `login-button` | `login.yaml` | High |
| Register | `name-input`, `email-input`, `password-input`, `confirm-password-input`, `register-button` | `register.yaml` | High |
| Logout | `tab-settings`, `logout-button` | `settings.yaml` | Medium |
| Biometric Login | `biometric-button` | `biometric.yaml` | Low |
| **Movies** | | | |
| Discover Movies | `movies-flatlist`, `movie-card-*` | `discover.yaml` | High |
| Movie Search | `search-input`, `search-results` | `search.yaml` | High |
| Movie Detail | `movie-detail-screen`, `favorite-button`, `video-player` | `movie-detail.yaml` | High |
| **User Features** | | | |
| Add to Favorites | `favorite-button`, `tab-favorites` | `add-favorite.yaml` | High |
| Remove from Favorites | `remove-favorite-*`, `tab-favorites` | `remove-favorite.yaml` | High |
| Add to Watchlist | `watchlist-button` | `add-watchlist.yaml` | Medium |
| Remove from Watchlist | `remove-watchlist-*` | `remove-watchlist.yaml` | Medium |
| **Navigation** | | | |
| Tab Navigation | `tab-discover`, `tab-favorites`, `tab-settings`, `tab-watchlist` | `navigation.yaml` | Medium |
| Deep Links | - | `deep-links.yaml` | Medium |
| **Settings** | | | |
| Theme Toggle | `theme-toggle` | `theme.yaml` | Low |
| Language Switch | `language-dropdown` | `language.yaml` | Low |
| **Edge Cases** | | | |
| Offline Mode | `offline-banner` | `offline.yaml` | Medium |
| Orientation Change | - | `orientation.yaml` | Low |
| Performance | - | `performance.yaml` | Low |
| Accessibility | - | `accessibility.yaml` | Low |

---

## 21. Son Kontrol: Eksik Olabilecek Öğeler

### ✅ Dahil Olanlar:

- [x] Maestro CLI kurulumu
- [x] YAML akış dosyaları
- [x] CI/CD entegrasyonu (GitHub Actions)
- [x] i18n handling (regex pattern'ler)
- [x] Network retry mekanizması
- [x] Screenshot/visual testing
- [x] Deep link testing
- [x] State management
- [x] Environment variables (`.env.test`)
- [x] Setup script'leri
- [x] Auth injection flows
- [x] Error handling examples
- [x] Parallel execution

### ⚠️ Manuel Kontrol Gerektirenler:

- [ ] Accessibility audit (manuel)
- [ ] Performance benchmark (manuel)
- [ ] Visual regression (manuel karşılaştırma)
- [ ] Real device testing (Manuel/Sauce Labs)

### 📋 Eklenmesi Gereken TestID'ler:

| Component | testID | Dosya | Priority |
|-----------|--------|-------|----------|
| Search Input | `search-input` | `discover.tsx` | High |
| Search Results | `search-results` | `discover.tsx` | High |
| Theme Toggle | `theme-toggle` | `settings.tsx` | Medium |
| Language Dropdown | `language-dropdown` | `settings.tsx` | Medium |
| Logout Button | `logout-button` | `settings.tsx` | High |
| Biometric Button | `biometric-button` | `login.tsx` | Low |
| Offline Banner | `offline-banner` | Global | Medium |
| Back Button | `back-button` | Global | Medium |
| Watchlist Button | `watchlist-button` | `movie-detail.tsx` | Medium |

---

*Document Version: 2.1*
*Last Updated: 2024*
*Added: Advanced test scenarios, keyboard handling, performance testing, accessibility, theme/language switching, offline mode, biometric testing, orientation testing, deep links, crash recovery, MSW integration, complete user flow coverage matrix*
