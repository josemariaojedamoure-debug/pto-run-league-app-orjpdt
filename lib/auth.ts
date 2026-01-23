
/**
 * BetterAuth Client Configuration (Currently Unused)
 * 
 * This app uses Supabase for authentication instead of BetterAuth.
 * See contexts/SupabaseContext.tsx for the actual authentication implementation.
 * 
 * This file is kept for reference but is not actively used in the app.
 */

import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Note: This configuration is not used in the current app
// The app uses Supabase authentication via contexts/SupabaseContext.tsx

const API_URL = Constants.expoConfig?.extra?.backendUrl || "";
const BEARER_TOKEN_KEY = "pto-running-league_bearer_token";

const storage = Platform.OS === "web"
  ? {
      getItem: (key: string) => localStorage.getItem(key),
      setItem: (key: string, value: string) => localStorage.setItem(key, value),
      deleteItem: (key: string) => localStorage.removeItem(key),
    }
  : SecureStore;

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: "pto-running-league",
      storagePrefix: "pto-running-league",
      storage,
    }),
  ],
  ...(Platform.OS === "web" && {
    fetchOptions: {
      auth: {
        type: "Bearer" as const,
        token: () => localStorage.getItem(BEARER_TOKEN_KEY) || "",
      },
    },
  }),
});

export function storeWebBearerToken(token: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(BEARER_TOKEN_KEY, token);
  }
}

export function clearAuthTokens() {
  if (Platform.OS === "web") {
    localStorage.removeItem(BEARER_TOKEN_KEY);
  }
}
