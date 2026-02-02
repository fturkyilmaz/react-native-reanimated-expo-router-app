import { Platform } from "react-native";

export const Colors = {
  light: {
    // Backgrounds
    background: "#f8f9fa",
    card: "#ffffff",
    input: "#fafafa",

    // Text
    text: "#1a1a1a",
    textSecondary: "#666666",
    textMuted: "#999999",

    // Borders
    border: "#e0e0e0",
    divider: "#f0f0f0",

    // Accents
    primary: "#E50914",
    primaryLight: "#FFF3F3",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",

    // Misc
    shadow: "#000000",
    overlay: "rgba(0,0,0,0.5)",
  },
  dark: {
    // Backgrounds
    background: "#0f0f0f",
    card: "#1a1a1a",
    input: "#2a2a2a",

    // Text
    text: "#ffffff",
    textSecondary: "#b3b3b3",
    textMuted: "#666666",

    // Borders
    border: "#2a2a2a",
    divider: "#2a2a2a",

    // Accents
    primary: "#E50914",
    primaryLight: "#2a1a1a",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",

    // Misc
    shadow: "#000000",
    overlay: "rgba(0,0,0,0.8)",
  },
};
export type ThemeColors = typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
