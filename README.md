# 🎬 Siname - Expo Router & Animated Film Keşif Uygulaması

**Siname**, modern mobil deneyimi hedefleyen bir **React Native** projesidir.  
Expo Router ile yönlendirme, React Native Animated ile geçiş efektleri ve **expo-liquid-glass** ile cam efekti gibi görsel detaylar bir araya getirildi.  
Kullanıcılar film listelerini gezebilir, detay sayfalarına geçiş yapabilir ve animasyonlarla zenginleştirilmiş bir arayüz deneyimi yaşar.

---

## 🚀 Özellikler

- ⚡ **Expo Router** ile dosya tabanlı sayfa yönlendirme  
- 🎞️ **React Native Animated** ile akıcı geçişler ve scroll efektleri  
- 🧊 **expo-liquid-glass** ile blur & cam efekti  
- 🎬 Film listesi ve detay ekranları  
- 📱 Responsive tasarım  
- 🛠️ Kolay kurulum ve geliştirme ortamı  

---

## 📦 Kurulum

```bash
git clone https://github.com/fturkyilmaz/react-native-reanimated-expo-router-app.git
cd siname

npm install
# veya
yarn install

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
│   ├── AnimatedHeader.tsx # Scroll animasyonlu header
│   └── GlassPanel.tsx     # expo-liquid-glass ile cam efekti
│
│── assets/                # Görseller, ikonlar
│── constants/             # Sabitler ve tema
│── hooks/                 # Custom hook'lar
│── package.json
│── README.md
```

---

## 🎨 Kullanılan Teknolojiler

| Teknoloji              | Açıklama                              |
|------------------------|----------------------------------------|
| [React Native](https://reactnative.dev/) | Mobil uygulama çatısı |
| [Expo](https://expo.dev/) | Geliştirme ve bundling |
| [Expo Router](https://expo.github.io/router/docs) | Dosya tabanlı routing |
| [React Native Animated](https://reactnative.dev/docs/animated) | Animasyon API |
| expo-liquid-glass [(github.com in Bing)](https://www.bing.com/search?q="https%3A%2F%2Fgithub.com%2Fexpo%2Fexpo-liquid-glass") | Cam efekti ve blur |

---

## 🛠 Geliştirme Notları

- Animasyonlar `Animated.Value`, `interpolate`, `useAnimatedScrollHandler` ve `useNativeDriver` ile yönetildi.  
- Sayfa geçişleri `expo-router` ile segment bazlı olarak tanımlandı.  
- Cam efekti için `expo-liquid-glass` kullanıldı, özellikle header ve modal arayüzlerde.  
- Tasarımda **Material Design** ve **minimalist** yaklaşım benimsendi.  

---

## 📸 Ekran Görüntüleri

> Uygulama ekran görüntüleri buraya eklenebilir (MovieCard, detay geçişi, blur header vs.)

---

## 🤝 Katkı

Katkıda bulunmak için:

```bash
# Forkla
# Yeni branch oluştur: feature/yenilik
# Değişiklikleri commit et
# Pull request gönder
```

---

## 📄 Lisans

Bu proje **MIT lisansı** ile lisanslanmıştır.