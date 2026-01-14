
import React, { useEffect } from 'react';
import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { SupabaseProvider } from "@/contexts/SupabaseContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { effectiveTheme } = useTheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      console.log('Fonts loaded, hiding splash screen');
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // Custom theme based on PTO colors
  const PTOLightTheme: Theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.ptoGreen,
      background: colors.light.background,
      card: colors.light.card,
      text: colors.light.foreground,
      border: colors.light.border,
      notification: colors.ptoGreen,
    },
  };

  const PTODarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.ptoGreen,
      background: colors.dark.background,
      card: colors.dark.card,
      text: colors.dark.foreground,
      border: colors.dark.border,
      notification: colors.ptoGreen,
    },
  };

  return (
    <NavigationThemeProvider
      value={effectiveTheme === "dark" ? PTODarkTheme : PTOLightTheme}
    >
      <SystemBars style={effectiveTheme === "dark" ? "light" : "dark"} />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="transparent-modal"
          options={{
            presentation: "transparentModal",
            animation: "fade",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="formsheet"
          options={{
            presentation: "formSheet",
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SupabaseProvider>
          <RootLayoutContent />
        </SupabaseProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
