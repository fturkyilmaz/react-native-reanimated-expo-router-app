import { useTheme } from "@/hooks/use-theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

export default function TabLayout() {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();

  // Android tabs with MaterialCommunityIcons (equivalent to iOS SF Symbols)
  if (Platform.OS === "android") {
    return (
      <React.Fragment>
        <StatusBar style="auto" />
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: "#E50914",
            tabBarInactiveTintColor: isDarkMode ? "#666666" : "#787878",
            tabBarStyle: {
              backgroundColor: isDarkMode
                ? "rgba(20,20,20,0.95)"
                : "rgba(255,255,255,0.95)",
              borderTopWidth: 0,
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "500",
            },
            tabBarIconStyle: {
              marginBottom: -4,
            },
            headerShown: false,
            lazy: false,
          }}
        >
          {/* Ana Sayfa / Home - equivalent to house */}
          <Tabs.Screen
            name="index"
            options={{
              title: t("home.discover"),
              tabBarLabel: t("home.discover"),
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons
                  name={focused ? "home" : "home-outline"}
                  size={26}
                  color={color}
                />
              ),
              tabBarAccessibilityLabel: "tab-home",
            }}
          />

          {/* Keşfet / Discover - equivalent to sparkles */}
          <Tabs.Screen
            name="discover"
            options={{
              title: "Keşfet",
              tabBarLabel: "Keşfet",
              headerShown: false,
              popToTopOnBlur: true,
              tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons
                  name={focused ? "auto-fix" : "auto-fix"}
                  size={26}
                  color={color}
                />
              ),
              tabBarAccessibilityLabel: "tab-discover",
            }}
          />

          {/* İzleme Listesi / Watchlist - equivalent to bookmark */}
          <Tabs.Screen
            name="watchlist"
            options={{
              title: t("watchlist.title"),
              tabBarLabel: t("watchlist.title"),
              tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons
                  name={focused ? "bookmark" : "bookmark-outline"}
                  size={26}
                  color={color}
                />
              ),
              tabBarAccessibilityLabel: "tab-watchlist",
            }}
          />

          {/* Favoriler / Favorites - equivalent to heart */}
          <Tabs.Screen
            name="favorites"
            options={{
              title: t("favorites.title"),
              tabBarLabel: t("favorites.title"),
              tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons
                  name={focused ? "heart" : "heart-outline"}
                  size={26}
                  color={color}
                />
              ),
              tabBarAccessibilityLabel: "tab-favorites",
            }}
          />

          {/* Ayarlar / Settings - equivalent to gear */}
          <Tabs.Screen
            name="settings"
            options={{
              title: t("settings.title"),
              tabBarLabel: t("settings.title"),
              tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons
                  name={focused ? "cog" : "cog-outline"}
                  size={26}
                  color={color}
                />
              ),
              tabBarAccessibilityLabel: "tab-settings",
            }}
          />
        </Tabs>
      </React.Fragment>
    );
  }

  // iOS tabs with NativeTabs and SF Symbols (original layout)
  return (
    <NativeTabs
      iconColor={{
        default: isDarkMode ? "#666666" : "#787878",
        selected: "#E50914",
      }}
      backgroundColor={
        isDarkMode ? "rgba(20,20,20,0.95)" : "rgba(255,255,255,0.95)"
      }
      blurEffect={isDarkMode ? "systemMaterialDark" : "systemMaterial"}
      labelStyle={{
        color: theme.text,
      }}
      tintColor={theme.primary}
    >
      {/* Ana Sayfa / Home */}
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>{t("home.discover")}</Label>
      </NativeTabs.Trigger>

      {/* Keşfet / Discover */}
      <NativeTabs.Trigger name="discover">
        <Icon sf={{ default: "sparkles", selected: "sparkles" }} />
        <Label>Keşfet</Label>
      </NativeTabs.Trigger>

      {/* İzleme Listesi / Watchlist */}
      <NativeTabs.Trigger name="watchlist">
        <Icon sf={{ default: "bookmark", selected: "bookmark.fill" }} />
        <Label>{t("watchlist.title")}</Label>
      </NativeTabs.Trigger>

      {/* Favoriler / Favorites */}
      <NativeTabs.Trigger name="favorites">
        <Icon sf={{ default: "heart", selected: "heart.fill" }} />
        <Label>{t("favorites.title")}</Label>
      </NativeTabs.Trigger>

      {/* Ayarlar / Settings */}
      <NativeTabs.Trigger name="settings" options={{}}>
        <Icon sf={{ default: "gear", selected: "gearshape.fill" }} />
        <Label>{t("settings.title")}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
