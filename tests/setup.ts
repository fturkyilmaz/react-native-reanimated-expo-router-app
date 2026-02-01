import "@testing-library/jest-native/extend-expect";
import "react-native-gesture-handler/jestSetup";

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => { };
  return Reanimated;
});

// Mock expo-router
jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  Stack: {
    Screen: jest.fn(({ children }) => children),
  },
  Link: jest.fn(({ children }) => children),
}));

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly',
}));

// Mock @react-native-async-storage/async-storage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock expo-image
jest.mock("expo-image", () => ({
  Image: jest.fn(({ source, ...props }) => ({
    type: "Image",
    props: { source, ...props },
  })),
}));

// Mock expo-linear-gradient
jest.mock("expo-linear-gradient", () => ({
  LinearGradient: jest.fn(({ children }) => children),
}));

// Mock expo-video
jest.mock("expo-video", () => ({
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    loop: true,
    playing: false,
  })),
  VideoView: jest.fn(() => null),
  useEvent: jest.fn(() => ({ isPlaying: false })),
}));

// Mock expo-haptics
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

// Mock expo-localization
jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageCode: "tr", languageTag: "tr-TR" }]),
}));

// Mock expo-updates
jest.mock("expo-updates", () => ({
  reloadAsync: jest.fn(),
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
}));

// Mock expo-status-bar
jest.mock("expo-status-bar", () => ({
  StatusBar: jest.fn(() => null),
}));

// Mock expo-font
jest.mock("expo-font", () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

// Mock expo-splash-screen
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

// Mock expo-system-ui
jest.mock("expo-system-ui", () => ({
  setBackgroundColorAsync: jest.fn(),
}));

// Mock expo-web-browser
jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn(),
  maybeCompleteAuthSession: jest.fn(),
}));

// Mock expo-local-authentication
jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1])),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  cancelAuthenticate: jest.fn(),
  SecurityLevel: {
    NONE: 0,
    SECRET: 1,
    BIOMETRIC: 2,
  },
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

// Mock @expo/vector-icons
jest.mock("@expo/vector-icons", () => ({
  Ionicons: jest.fn(({ name, size, color, testID }) => ({
    type: "Ionicons",
    props: { name, size, color, testID },
  })),
}));

// Mock lottie-react-native
jest.mock("lottie-react-native", () => {
  return jest.fn(() => null);
});

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "auth.welcomeBack": "Tekrar Hoşgeldiniz",
        "auth.discoverMovies": "Favori filmlerinizi keşfedin",
        "auth.email": "E-posta",
        "auth.password": "Şifre",
        "auth.login": "Giriş Yap",
        "auth.register": "Kayıt Ol",
        "auth.logout": "Çıkış Yap",
        "auth.logoutConfirm":
          "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
        "auth.name": "Ad Soyad",
        "auth.confirmPassword": "Şifreyi Onayla",
        "auth.forgotPassword": "Şifremi unuttum?",
        "auth.noAccount": "Hesabınız yok mu?",
        "auth.hasAccount": "Zaten hesabınız var mı?",
        "common.loading": "Yükleniyor...",
        "common.error": "Bir hata oluştu",
        "common.retry": "Tekrar Dene",
        "common.save": "Kaydet",
        "common.cancel": "İptal",
        "common.delete": "Sil",
        "common.search": "Ara...",
        "home.greeting": `Merhaba, ${options?.name || "Misafir"}`,
        "home.popular": "Popüler",
        "home.topRated": "En Beğenilen",
        "home.upcoming": "Yakında",
        "home.noResults": "Sonuç bulunamadı",
        "movie.details": "Film Detayı",
        "movie.summary": "Özet",
        "movie.cast": "Oyuncular",
        "movie.trailer": "Fragmanı İzle",
        "movie.addToFavorites": "Favorilere Ekle",
        "movie.removeFromFavorites": "Favorilerden Çıkar",
        "movie.minutes": "dk",
        "favorites.title": "Favorilerim",
        "favorites.empty": "Henüz Favori Yok",
        "favorites.emptyMessage":
          "Beğendiğiniz filmleri buraya eklemek için kalp ikonuna dokunun",
        "favorites.explore": "Keşfetmeye Başla",
        "settings.title": "Ayarlar",
        "settings.account": "HESAP",
        "settings.preferences": "TERCİHLER",
        "settings.darkMode": "Karanlık Mod",
        "settings.language": "Dil",
        "settings.notifications": "Bildirimler",
        "settings.clearCache": "Önbelleği Temizle",
        "settings.clearCacheConfirm":
          "Önbelleği temizlemek istediğinize emin misiniz?",
        "settings.cacheCleared": "Önbellek temizlendi",
        "authTransition.welcome": `Hoşgeldin ${options?.name || ""}! 🎬`,
        "authTransition.subText": "Film dünyası seni bekliyor...",
        "languages.tr": "Türkçe",
        "languages.en": "English",
      };
      return translations[key] || key;
    }),
    i18n: {
      changeLanguage: jest.fn(),
      language: "tr",
    },
  })),
  I18nextProvider: jest.fn(({ children }) => children),
  initReactI18next: {
    type: "3rdParty",
    init: jest.fn(),
  },
}));

// Mock i18n
jest.mock("@/i18n", () => ({
  __esModule: true,
  default: {
    use: jest.fn().mockReturnThis(),
    init: jest.fn(),
    changeLanguage: jest.fn(),
    language: "tr",
    t: jest.fn((key: string) => key),
  },
}));

// Mock react-native-safe-area-context
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: jest.fn(({ children }) => children),
  SafeAreaView: jest.fn(({ children }) => children),
  useSafeAreaInsets: jest.fn(() => ({ top: 0, right: 0, bottom: 0, left: 0 })),
}));

// Mock react-native-screens
jest.mock("react-native-screens", () => ({
  enableScreens: jest.fn(),
}));

// Mock react-native-gesture-handler
jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: jest.fn(({ children }) => children),
  PanGestureHandler: jest.fn(({ children }) => children),
  TapGestureHandler: jest.fn(({ children }) => children),
  State: {},
}));

// Mock @tanstack/react-query
jest.mock("@tanstack/react-query", () => ({
  QueryClient: jest.fn(() => ({
    setDefaultOptions: jest.fn(),
    getQueryCache: jest.fn(() => ({ find: jest.fn() })),
  })),
  QueryClientProvider: jest.fn(({ children }) => children),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
}));

// Mock zustand persist middleware
const mockPersistStorage: Record<string, string> = {};

jest.mock("zustand/middleware", () => ({
  persist: (config: any) => (set: any, get: any, api: any) => {
    const store = config(
      (args: any) => {
        set(args);
        const state = get();
        mockPersistStorage["zustand-store"] = JSON.stringify(state);
      },
      get,
      api,
    );
    return store;
  },
  createJSONStorage: jest.fn(() => ({
    getItem: jest.fn((key: string) =>
      Promise.resolve(mockPersistStorage[key] || null),
    ),
    setItem: jest.fn((key: string, value: string) => {
      mockPersistStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete mockPersistStorage[key];
      return Promise.resolve();
    }),
  })),
}));

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock expo-linking
jest.mock("expo-linking", () => ({
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
  parse: jest.fn((url: string) => {
    const path = url.replace(/^[^:]+:\/\//, '').replace(/^https?:\/\/[^\/]+/, '');
    const [pathname, queryString] = path.split('?');
    const queryParams: Record<string, string> = {};
    if (queryString) {
      const params = new URLSearchParams(queryString);
      params.forEach((value, key) => {
        queryParams[key] = value;
      });
    }
    return { path: pathname.replace(/^\//, ''), queryParams };
  }),
  createURL: jest.fn((path: string) => `cinesearch://${path}`),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  openURL: jest.fn(() => Promise.resolve(true)),
}));

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'test-push-token' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('test-notification-id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  setBadgeCountAsync: jest.fn(() => Promise.resolve()),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
  AndroidImportance: {
    HIGH: 'high',
    DEFAULT: 'default',
    LOW: 'low',
    MIN: 'min',
    MAX: 'max',
    NONE: 'none',
  },
}));

// Mock expo-device
jest.mock("expo-device", () => ({
  isDevice: true,
  brand: 'Apple',
  manufacturer: 'Apple',
  modelName: 'iPhone 14',
  osName: 'iOS',
  osVersion: '16.0',
}));

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation((path: string) => ({
    uri: path,
    exists: false,
    write: jest.fn(),
    delete: jest.fn(),
  })),
  Directory: jest.fn().mockImplementation((path: string) => ({
    uri: path,
    exists: false,
  })),
  Paths: {
    cache: { uri: 'file:///mock/cache' },
    document: { uri: 'file:///mock/documents' },
    bundle: { uri: 'file:///mock/bundle' },
  },
}));

// Mock Dimensions
jest.mock("react-native/Libraries/Utilities/Dimensions", () => ({
  get: jest.fn(() => ({ width: 375, height: 812 })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock Alert
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  alert: jest.fn(),
}));

// Setup global fetch mock
global.fetch = jest.fn();

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(mockPersistStorage).forEach(
    (key) => delete mockPersistStorage[key],
  );
});

// Cleanup after all tests
afterAll(() => {
  jest.restoreAllMocks();
});
