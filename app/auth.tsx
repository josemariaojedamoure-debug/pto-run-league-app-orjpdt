
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView, WebViewMessageEvent, WebViewNavigation, WebViewNavigationEvent } from 'react-native-webview';
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

    // Guard against undefined url
    if (!url) {
      console.log('AuthScreen: URL is undefined, skipping navigation check');
      return;
    }

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

    // Guard against undefined url
    if (!url) {
      console.log('AuthScreen: URL is undefined, allowing request');
      return true;
    }

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

  // Handle load end - FIXED to properly read URL from event.nativeEvent
  const handleLoadEnd = useCallback((event: WebViewNavigationEvent) => {
    const url = event.nativeEvent?.url;
    console.log('WebView finished loading auth page, URL:', url);
    
    // Guard against undefined url
    if (!url) {
      console.warn('AuthScreen: URL is undefined in load end, clearing loading state');
      setIsLoading(false);
      return;
    }
    
    // If we're on /get-access, ensure loading is cleared
    if (url.includes('/get-access')) {
      console.log('AuthScreen: Finished loading /get-access - clearing loading state');
      setIsLoading(false);
      
      // Inject diagnostic JavaScript to check if content is actually rendered
      webViewRef.current?.injectJavaScript(`
        (function() {
          const bodyHeight = document.body.scrollHeight;
          const bodyContent = document.body.innerText.substring(0, 200);
          const visibleElements = document.querySelectorAll('*:not(script):not(style)').length;
          
          console.log('🔍 /get-access Page Diagnostics:');
          console.log('  - Body height:', bodyHeight, 'px');
          console.log('  - Visible elements:', visibleElements);
          console.log('  - First 200 chars:', bodyContent);
          console.log('  - Background color:', window.getComputedStyle(document.body).backgroundColor);
          console.log('  - Text color:', window.getComputedStyle(document.body).color);
          
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PAGE_DIAGNOSTICS',
            url: window.location.href,
            bodyHeight: bodyHeight,
            visibleElements: visibleElements,
            bodyContent: bodyContent,
            backgroundColor: window.getComputedStyle(document.body).backgroundColor,
            textColor: window.getComputedStyle(document.body).color
          }));
        })();
        true;
      `);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Handle WebView messages (for diagnostics)
  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'PAGE_DIAGNOSTICS') {
        console.log('📊 WebView Page Diagnostics Received:');
        console.log('  URL:', data.url);
        console.log('  Body Height:', data.bodyHeight, 'px');
        console.log('  Visible Elements:', data.visibleElements);
        console.log('  Background Color:', data.backgroundColor);
        console.log('  Text Color:', data.textColor);
        console.log('  Content Preview:', data.bodyContent);
        
        // Alert if page appears empty
        if (data.bodyHeight < 100 || data.visibleElements < 5) {
          console.warn('⚠️ WARNING: /get-access page appears to have minimal content!');
          console.warn('   This suggests the web page itself may not be rendering properly.');
        }
        
        // Alert if colors might be causing invisibility
        if (data.backgroundColor === data.textColor) {
          console.warn('⚠️ WARNING: Background and text colors are the same!');
          console.warn('   Content may be invisible due to color mismatch.');
        }
      }
    } catch (error) {
      console.log('WebView message (non-JSON):', event.nativeEvent.data);
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
      <View style={styles.webviewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: authUrl }}
          style={[styles.webview, { opacity: isLoading ? 0 : 1 }]}
          startInLoadingState={false}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onMessage={handleMessage}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </View>
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
  webviewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
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
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: typography.regular,
  },
});
