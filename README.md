# 🎬 Siname - React Native Animated & Expo Router Projesi

Bu proje, **React Native Animated API** ve **Expo Router** kullanılarak geliştirilmiş bir film keşif uygulamasıdır.  
Kullanıcılar modern animasyonlarla zenginleştirilmiş arayüzde film listelerini gezebilir, detay sayfalarına geçiş yapabilir.

---

## 🚀 Özellikler
- **Expo Router** ile kolay sayfa yönlendirme
- **React Native Animated** ile akıcı animasyonlar
- Film listesi ve detay ekranları
- Responsive tasarım
- Kolay kurulum ve geliştirme ortamı

---

## 📦 Kurulum

1. Repoyu klonla:
   ```bash
   git clone https://github.com/fturkyilmaz/react-native-reanimated-expo-router-app.git
   cd siname
   ```

2. Bağımlılıkları yükle:
   ```bash
   npm install
   # veya
   yarn install
   ```

3. Projeyi çalıştır:
   ```bash
   npx expo start
   ```

---

## 📂 Proje Yapısı

```
siname/
│── app/
│   ├── index.tsx          # Ana sayfa
│   ├── movie/[id].tsx     # Film detay sayfası
│   └── _layout.tsx        # Router layout
│
│── components/
│   ├── MovieCard.tsx      # Film kartı componenti
│   └── AnimatedHeader.tsx # Animasyonlu header
│
│── assets/                # Görseller, ikonlar
│── package.json
│── README.md
```

---

## 🎨 Kullanılan Teknolojiler
- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [Expo Router](https://expo.github.io/router/docs)
- [React Native Animated](https://reactnative.dev/docs/animated)

---

## 🛠 Geliştirme Notları
- Animasyonlar için `Animated.Value`, `interpolate` ve `useNativeDriver` kullanıldı.
- Sayfa geçişleri `expo-router` ile yönetildi.
- Tasarımda **Material Design** ve minimalist yaklaşım benimsendi.

---

## 📸 Ekran Görüntüleri
> Buraya uygulamanın ekran görüntülerini ekleyebilirsin.

---

## 🤝 Katkı
Katkıda bulunmak için:
1. Fork yap
2. Yeni branch oluştur (`feature/yenilik`)
3. Değişikliklerini commit et
4. Pull request gönder

---

## 📄 Lisans
Bu proje MIT lisansı ile lisanslanmıştır.
```

---

Bu `README.md` sana başlangıç için güçlü bir temel sunuyor. İstersen ben sana **örnek kod parçaları** da ekleyebilirim, mesela `AnimatedHeader` veya `MovieCard` componenti. İlgini çeker mi?