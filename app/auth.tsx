
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { colors, typography } from '@/styles/commonStyles';

const BASE_URL = 'https://publictimeoff.com';

export default function AuthScreen() {
  const { effectiveTheme } = useTheme();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const hasAttemptedAuthRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  console.log('AuthScreen - Checking:', isCheckingAuth);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle navigation state changes
  const handleNavigationStateChange = async (navState: WebViewNavigation) => {
    const url = navState.url;
    console.log('AuthScreen: WebView navigated to:', url);

    // Check if this is an authenticated page (participant, dashboard, rankings, etc.)
    const isAuthenticatedPage = 
      url.includes('/participant') || 
      url.includes('/dashboard') || 
      url.includes('/rankings') ||
      url.includes('/profile') ||
      url.includes('/events');
    
    // Only attempt auth transfer once per session
    if (isAuthenticatedPage && !isCheckingAuth && !hasAttemptedAuthRef.current) {
      console.log('AuthScreen: User navigated to authenticated page:', url);
      hasAttemptedAuthRef.current = true;
      setIsCheckingAuth(true);
      
      // Give the web app 5 seconds to fully load and establish session
      // The WebView cookies will be shared with the dashboard
      timeoutRef.current = setTimeout(() => {
        console.log('AuthScreen: Authentication complete - redirecting to dashboard');
        console.log('AuthScreen: User authenticated via web cookies');
        setIsCheckingAuth(false);
        router.replace('/(tabs)/dashboard');
      }, 5000);
    }
  };

  // Build the auth URL
  const authUrl = `${BASE_URL}/auth?source=app`;

  console.log('Loading auth WebView with URL:', authUrl);

  // Show native green screen while checking auth
  if (isCheckingAuth) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.ptoGreen }]}
        edges={['top', 'bottom']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingTextWhite}>
            Completing sign in...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top', 'bottom']}
    >
      <WebView
        ref={webViewRef}
        source={{ uri: authUrl }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={[styles.loadingContainer, { backgroundColor: colors.ptoGreen }]}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingTextWhite}>
              Loading...
            </Text>
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
        onNavigationStateChange={handleNavigationStateChange}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
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
  loadingTextWhite: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: typography.regular,
    color: '#FFFFFF',
  },
});
