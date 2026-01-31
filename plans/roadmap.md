# 📌 Project Roadmap – React Native Reanimated Expo Router App

Bu roadmap, projeyi **expert seviyeye** taşımak için planlanmış sprintleri ve odak alanlarını içerir.  
Test entegrasyonu, çoklu dil (i18n) ve tema desteği tamamlandıktan sonra aşağıdaki adımlar izlenecek.

---

## ✅ Tamamlananlar
- Jest + React Native Testing Library entegrasyonu
- Snapshot testler
- Detox E2E testleri
- Coverage raporları
- Çoklu dil (i18n) desteği
- Dynamic theme (light/dark + custom themes)

---

## 🏃 Sprint Planı

### Sprint 6 – Güvenlik & Veri Yönetimi
- Secure storage (`expo-secure-store`, `react-native-keychain`)
- Biometric authentication (FaceID/TouchID)
- JWT refresh flow + OAuth2 entegrasyonu
- Acceptance Criteria: Kullanıcı verileri güvenli şekilde saklanmalı, login flow testleri geçmeli.

---

### Sprint 7 – Mimari & State Management
- Feature-based folder structure (DDD yaklaşımı)
- Zustand/Jotai + React Query entegrasyonu
- Service layer (API çağrılarını UI’dan ayırma)
- Error boundaries + fallback UI
- Acceptance Criteria: State yönetimi global ve maintainable olmalı, API çağrıları UI’dan bağımsız çalışmalı.

---

### Sprint 8 – CI/CD + Coverage Thresholds
- GitHub Actions pipeline (Jest + Detox otomatik çalıştırma)
- EAS Build entegrasyonu
- Coverage threshold (%80 minimum)
- Acceptance Criteria: PR merge için testler otomatik çalışmalı, coverage %80+ olmalı.

---

### Sprint 9 – Server-Driven UI & Feature Flagging
- Backend’den JSON/GraphQL ile UI tanımlama
- Feature flagging (LaunchDarkly veya custom çözüm)
- Acceptance Criteria: UI backend’den yönetilebilir olmalı, feature rollout kontrollü yapılmalı.

---

### Sprint 10 – Observability & Monitoring
- Sentry entegrasyonu (error tracking)
- OpenTelemetry ile performans ölçümü
- Acceptance Criteria: Crash ve performans metrikleri dashboard’da görünmeli.

---

## 📈 2026 Trendleri ile Uyum
- Yeni Mimari (Fabric + TurboModules + JSI)
- AI-assisted development (linting, test generation)
- Cross-platform expansion (Web, Desktop, TV)
- Offline-first apps (local DB + sync mekanizması)
- Accessibility-first testing

---

## 📊 Özet Tablosu

| Sprint | Odak Alanı              | Deliverables                          | Acceptance Criteria |
|--------|-------------------------|---------------------------------------|---------------------|
| 6      | Güvenlik & Veri         | Secure storage, biometric auth         | Güvenli login flow  |
| 7      | Mimari & State          | Zustand/Jotai, service layer           | Maintainable state  |
| 8      | CI/CD + Coverage        | GitHub Actions, EAS Build              | Coverage %80+       |
| 9      | Server-Driven UI        | Backend-driven UI, feature flags       | Rollout kontrolü    |
| 10     | Observability           | Sentry, OpenTelemetry                  | Crash/perf metrics  |

---
