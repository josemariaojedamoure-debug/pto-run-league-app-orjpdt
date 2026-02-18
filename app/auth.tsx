
import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const hasAttemptedAuthRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  console.log('AuthScreen - Checking:', isCheckingAuth, 'Loading:', isLoading);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle navigation state changes
  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    const url = navState.url;
    console.log('AuthScreen: WebView navigated to:', url);

    // If user navigates to /get-access (sign up flow), let the WebView handle it
    // Don't intercept or redirect - the web app will handle the onboarding
    if (url.includes('/get-access')) {
      console.log('AuthScreen: User navigated to /get-access - allowing WebView to handle sign up flow');
      setIsLoading(false); // Ensure loading state is cleared so content is visible
      return;
    }

    // Check if this is an authenticated page (participant, dashboard, rankings, etc.)
    // But NOT /get-access which is part of the sign up flow
    const isAuthenticatedPage = 
      (url.includes('/participant') || 
       url.includes('/dashboard') || 
       url.includes('/rankings') ||
       url.includes('/profile') ||
       url.includes('/events')) &&
      !url.includes('/get-access');
    
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
  }, [isCheckingAuth, router]);

  // Handle WebView requests to intercept before navigation
  const handleShouldStartLoadWithRequest = useCallback((request: any) => {
    const url = request.url;
    console.log('AuthScreen: Should start load with request:', url);

    // Allow navigation to /get-access (sign up flow)
    if (url.includes('/get-access')) {
      console.log('AuthScreen: Allowing navigation to /get-access');
      setIsLoading(false); // Clear loading immediately when navigating to get-access
      return true;
    }

    // Allow all other requests
    return true;
  }, []);

  // Handle load start
  const handleLoadStart = useCallback(() => {
    console.log('WebView started loading auth page');
    setIsLoading(true);
  }, []);

  // Handle load end
  const handleLoadEnd = useCallback((navState: WebViewNavigation) => {
    console.log('WebView finished loading auth page');
    const url = navState.url;
    
    // If we're on /get-access, ensure loading is cleared
    if (url.includes('/get-access')) {
      console.log('AuthScreen: Finished loading /get-access - clearing loading state');
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Handle errors
  const handleError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error loading auth page:', nativeEvent);
    setIsLoading(false);
  }, []);

  // Build the auth URL
  const authUrl = `${BASE_URL}/auth?source=app`;

  console.log('Loading auth WebView with URL:', authUrl);

  // Show loading screen matching theme while checking auth
  if (isCheckingAuth) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        edges={['top', 'bottom']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.ptoGreen} />
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
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
        startInLoadingState={false}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
      {isLoading && (
        <View style={[styles.loadingOverlay, { backgroundColor: themeColors.background }]}>
          <ActivityIndicator size="large" color={colors.ptoGreen} />
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            Loading...
          </Text>
        </View>
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: typography.regular,
  },
});
