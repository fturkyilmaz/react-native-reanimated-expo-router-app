# 🎬 Siname – Modern Movie Discovery App

<div align="center">

**Production‑Ready React Native & Expo Router Template**

[`https://reactnative.dev/`](https://reactnative.dev/)  
[`https://expo.dev/`](https://expo.dev/)  
[`https://www.typescriptlang.org/`](https://www.typescriptlang.org/)

*A modern movie discovery experience built with React Native Animated, Expo Router, and a scalable architecture.*

</div>

---

## 🚀 Features

### 🎨 UI/UX
- **Smooth Animations**: Native‑performance transitions powered by Reanimated 3  
- **Liquid Glass Effects**: Modern blur & glassmorphism with expo‑liquid‑glass  
- **Auth Transitions**: Custom animated authentication flow  
- **Responsive Design**: Optimized for all screen sizes  

### ⚙️ Technical Stack
- **Expo Router v3**: File‑based routing with deep linking support  
- **Zustand**: Lightweight and fast state management  
- **React Query**: Server state management and caching  
- **i18n**: Multi‑language support (English & Turkish)  
- **Authentication Flow**: Integrated store + provider architecture  

### 🛡️ Production Ready
- **Sentry**: Crash reporting and error tracking  
- **OpenTelemetry**: Performance monitoring and observability  
- **Error Boundary**: Global crash protection  
- **Deep Linking**: Native deep link integration  
- **Favorites**: Local favorites management  

---

## 🏗️ Architecture

```
cinesearch/
│── app/                # Expo Router pages
│   ├── (tabs)/         # Tab navigation group
│   ├── (auth)/         # Authentication flow
│   ├── (movies)/       # Movie detail flow
│   ├── _layout.tsx     # Root layout & providers
│   └── index.tsx       # Entry point
│
│── src/                # Application source code
│   ├── assets/         # Images, animations, fonts
│   │   ├── animations/ # Lottie animations
│   │   └── images/     # App images & icons
│   ├── components/     # UI Components
│   ├── hooks/          # Custom React Hooks
│   ├── store/          # Zustand Stores
│   ├── providers/      # Context Providers
│   ├── services/       # API Services
│   ├── i18n/           # Internationalization
│   ├── analytics/      # Analytics & A/B Testing
│   ├── otel/           # OpenTelemetry config
│   ├── sentry/         # Sentry integration
│   ├── schemas/        # Zod validation schemas
│   ├── config/         # App configuration
│   ├── constants/      # Theme & constants
│   ├── security/       # Security modules
│   ├── deep-linking/   # Deep linking
│   ├── notifications/  # Notifications
│   └── utils/          # Utility functions
│── tests/              # Unit & Integration tests
│── e2e/                # End‑to‑End tests
│── docs/               # Documentation
└── plans/              # Planning documents
```

---

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/fturkyilmaz/react-native-reanimated-expo-router-app.git
cd siname

# Install dependencies
npm install
# or
yarn install

# Environment variables (optional)
cp .env.example .env.local

# Start Expo development server
npx expo start
```

### Requirements
- Node.js ≥ 18  
- Expo CLI  
- iOS Simulator (macOS) or Android Emulator  

---

## 💡 Technical Highlights

### Auth Transition Flow
```tsx
<AuthTransition
  isVisible={authStore.isTransitioning}
  onAnimationComplete={authStore.completeTransition}
  userName={authStore.user?.name || ''}
/>
```

### Provider Hierarchy
```tsx
<SentryProvider>
  <OpenTelemetryProvider>
    <SecurityProvider>
      <DeepLinkProvider>
        <I18nextProvider>
          <QueryProvider>
            <ErrorBoundary>
              <AuthProvider>
                <FavoritesProvider>
                  {/* App Content */}
                </FavoritesProvider>
              </AuthProvider>
            </ErrorBoundary>
          </QueryProvider>
        </I18nextProvider>
      </DeepLinkProvider>
    </SecurityProvider>
  </OpenTelemetryProvider>
</SentryProvider>
```

### Navigation Structure
- **(tabs)** → Main navigation (Home, Search, Profile)  
- **(auth)** → Authentication flow (Login, Register)  
- **(movies)** → Movie detail screens  

---

## 🎨 Technology Stack

| Category | Technologies |
|----------|--------------|
| **Core** | React Native 0.81+, Expo 54+, TypeScript 5.0+ |
| **Navigation** | Expo Router v3 |
| **Animation** | Reanimated 3, Animated API |
| **UI Effects** | expo‑liquid‑glass, expo‑blur |
| **State Management** | Zustand, React Query |
| **Forms/Validation** | React Hook Form, Zod |
| **Monitoring** | Sentry, OpenTelemetry |
| **Localization** | i18next, react‑i18next |
| **Gestures** | react‑native‑gesture‑handler |

---

## 📸 Screenshots

<div align="center">

| Home | Movie Detail | Auth Flow |
|------|--------------|-----------|
| *(Coming soon)* | *(Coming soon)* | *(Coming soon)* |

</div>

---

## 🤝 Contributing

We welcome contributions! Please open an issue first to discuss proposed changes.

1. Fork the repository  
2. Create a feature branch (`git checkout -b feature/amazing-feature`)  
3. Commit changes (`git commit -m 'feat: Add amazing feature'`)  
4. Push to branch (`git push origin feature/amazing-feature`)  
5. Open a Pull Request  

### Development Guidelines
- TypeScript strict mode enabled  
- ESLint + Prettier enforced  
- Unit tests per component  
- E2E tests required for critical flows  

---

## 🙏 Acknowledgements

- [Expo](https://expo.dev/) – for the ecosystem  
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) – for animation power  
- [Zustand](https://docs.pmndrs.io/zustand) – for state management  

<div align="center">

**⭐ If you find this project useful, please give it a star!**

</div>
