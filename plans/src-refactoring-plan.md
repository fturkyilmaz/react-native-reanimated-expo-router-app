# CineSearch src/ Klasörüne Taşıma Planı

## Genel Bakış

Mevcut proje yapısındaki dosyaları `src/` klasörüne taşıyarak daha temiz ve organize bir yapı oluşturacağız.

## Önerilen Yapı

```
cinesearch/
├── app/                    # Route dosyaları (DEĞİŞMEZ)
├── src/                    # Yeni uygulama kodu klasörü
│   ├── components/         # Bileşenler
│   ├── hooks/              # Custom hooks
│   ├── services/           # API servisleri
│   ├── providers/          # Context providers
│   ├── store/              # State management
│   ├── security/           # Güvenlik modülleri
│   ├── deep-linking/       # Deep linking
│   ├── notifications/      # Bildirimler
│   ├── otel/               # OpenTelemetry
│   ├── sentry/             # Error tracking
│   ├── analytics/          # Analytics
│   ├── i18n/               # Internationalization
│   ├── constants/          # Sabitler
│   ├── config/             # Konfigürasyonlar
│   ├── schemas/            # Zod şemaları
│   └── utils/              # Yardımcı fonksiyonlar
├── assets/                 # Görseller, fontlar
├── tests/                  # E2E testler (root kalacak)
├── docs/                   # Dokümantasyon
├── app.json
├── tsconfig.json           # @/* alias güncellemesi gerekebilir
└── package.json
```

## Taşınacak Klasörler

| Mevcut Konum | Yeni Konum |
|--------------|------------|
| `components/` | `src/components/` |
| `hooks/` | `src/hooks/` |
| `services/` | `src/services/` |
| `providers/` | `src/providers/` |
| `store/` | `src/store/` |
| `security/` | `src/security/` |
| `deep-linking/` | `src/deep-linking/` |
| `notifications/` | `src/notifications/` |
| `otel/` | `src/otel/` |
| `sentry/` | `src/sentry/` |
| `analytics/` | `src/analytics/` |
| `i18n/` | `src/i18n/` |
| `constants/` | `src/constants/` |
| `config/` | `src/config/` |
| `schemas/` | `src/schemas/` |

## Kalacak Dosyalar (Root)

- `app/` - Expo Router route dosyaları
- `assets/` - Görseller, animasyonlar
- `tests/` - E2E testler ve setup
- `docs/` - Dokümantasyon
- `plans/` - Planlar
- Config dosyaları (`package.json`, `tsconfig.json`, vs.)

## tsconfig.json Güncelleme

Mevcut:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

Yeni:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Avantajları

1. ✅ Daha temiz root dizin
2. ✅ Daha iyi organizasyon
3. ✅ Kolay bulunabilirlik
4. ✅ Ölçeklenebilirlik
5. ✅ Test kodu yanına konabilir

## Riskler

1. ⚠️ Path alias güncellemesi gerekli
2. ⚠️ Import paths değişecek
3. ⚠️IDE refresh gerekebilir

## Tahmini Çaba

- Klasör taşıma: 5-10 dakika
- Path alias güncelleme: 2 dakika
- IDE refresh: 1 dakika
- **Toplam: ~15 dakika**

## Sonraki Adımlar

1. Onay al
2. Klasörleri taşı
3. tsconfig.json güncelle
4. Test et
