module.exports = {
  preset: "react-native",
  transform: {
    "^.+\\.tsx?$": "babel-jest",
    "^.+\\.jsx?$": "babel-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@expo/(.*)$": "<rootDir>/node_modules/@expo/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testMatch: ["<rootDir>/tests/**/*.test.ts", "<rootDir>/tests/**/*.test.tsx"],
  testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/", "/e2e/"],
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "hooks/**/*.{ts,tsx}",
    "services/**/*.{ts,tsx}",
    "store/**/*.{ts,tsx}",
    "schemas/**/*.{ts,tsx}",
    "config/**/*.{ts,tsx}",
    "constants/**/*.{ts,tsx}",
    "!**/node_modules/**",
    "!**/*.d.ts",
    "!**/index.ts",
  ],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "text-summary", "lcov", "html"],
  transformIgnorePatterns: [
    "node_modules/(?!((react-native.*|@react-native.*|expo.*|@expo.*|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|@react-navigation.*|react-native-web|lottie-react-native)/))",
  ],
  globals: {
    __DEV__: true,
  },
};
