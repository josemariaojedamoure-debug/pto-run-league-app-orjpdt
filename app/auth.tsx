
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { colors } from '@/styles/commonStyles';

const BASE_URL = 'https://publictimeoff.com';

export default function AuthScreen() {
  const { effectiveTheme } = useTheme();
  const { user, loading } = useSupabase();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;

  console.log('AuthScreen - User:', user ? 'Logged in' : 'Not logged in', 'Loading:', loading);

  // Redirect to dashboard if user is authenticated
  // The onAuthStateChange listener in SupabaseContext will detect when auth succeeds
  useEffect(() => {
    if (!loading && user) {
      console.log('User authenticated via onAuthStateChange listener, redirecting to dashboard');
      router.replace('/(tabs)/dashboard');
    }
  }, [user, loading, router]);

  // Build the auth URL
  const authUrl = `${BASE_URL}/auth?source=app`;

  console.log('Loading auth WebView with URL:', authUrl);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top', 'bottom']}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.ptoGreen} />
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: authUrl }}
          style={styles.webview}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.ptoGreen} />
            </View>
          )}
          onLoadStart={() => {
            console.log('WebView started loading auth page');
          }}
          onLoadEnd={() => {
            console.log('WebView finished loading auth page');
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error loading auth page:', nativeEvent);
          }}
          // Allow cookies and local storage for authentication
          // This enables the native Supabase client to share the session with the WebView
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          // Allow the WebView to navigate freely during authentication
          // The onAuthStateChange listener will detect when auth succeeds
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
