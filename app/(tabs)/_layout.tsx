import { useTheme } from "@/hooks/use-theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { useTranslation } from "react-i18next";
import { DynamicColorIOS, Platform } from "react-native";

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
          {/* Keşfet / Discover */}
          <Tabs.Screen
            name="discover"
            options={{
              title: t("home.discover"),
              tabBarLabel: t("home.discover"),
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
          {/* İzleme Listesi / Watchlist */}
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
          {/* Favoriler / Favorites */}
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
          {/* Ayarlar / Settings */}
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

  // iOS Native Tabs with DynamicColorIOS for proper dark/light mode
  return (
    <React.Fragment>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <NativeTabs
        iconColor={{
          selected: "#E50914",
          default: "#666666",
        }}
        labelStyle={{
          // For the text color
          color: DynamicColorIOS({
            dark: "white",
            light: "black",
          }),
        }}
        // For the selected icon color
        tintColor={DynamicColorIOS({
          dark: "white",
          light: "black",
        })}
      >
        {/* Ana Sayfa / Home */}
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon
            sf={{ default: "house", selected: "house.fill" }}
            md="home"
          />
          <NativeTabs.Trigger.Label>{t("home.discover")}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        {/* Keşfet / Discover */}
        <NativeTabs.Trigger name="discover">
          <NativeTabs.Trigger.Icon
            sf={{ default: "sparkles", selected: "sparkles" }}
            md="star"
          />
          <NativeTabs.Trigger.Label>{t("home.discover")}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        {/* İzleme Listesi / Watchlist */}
        <NativeTabs.Trigger name="watchlist">
          <NativeTabs.Trigger.Icon
            sf={{ default: "bookmark", selected: "bookmark.fill" }}
            md="bookmark"
          />
          <NativeTabs.Trigger.Label>{t("watchlist.title")}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        {/* Favoriler / Favorites */}
        <NativeTabs.Trigger name="favorites">
          <NativeTabs.Trigger.Icon
            sf={{ default: "heart", selected: "heart.fill" }}
            md="heart"
          />
          <NativeTabs.Trigger.Label>{t("favorites.title")}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        {/* Ayarlar / Settings */}
        <NativeTabs.Trigger name="settings">
          <NativeTabs.Trigger.Icon
            sf={{ default: "gear", selected: "gearshape.fill" }}
            md="settings"
          />
          <NativeTabs.Trigger.Label>{t("settings.title")}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </React.Fragment>
  );
}
