
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { colors, typography } from '@/styles/commonStyles';
import { supabase } from '@/lib/supabase';

const BASE_URL = 'https://publictimeoff.com';

export default function AuthScreen() {
  const { effectiveTheme } = useTheme();
  const { user, loading } = useSupabase();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const hasAttemptedAuthRef = useRef(false);

  console.log('AuthScreen - User:', user ? 'Logged in' : 'Not logged in', 'Loading:', loading, 'Checking:', isCheckingAuth);

  // Redirect to dashboard if user is authenticated
  useEffect(() => {
    if (!loading && user) {
      console.log('User authenticated, redirecting to dashboard');
      router.replace('/(tabs)/dashboard');
    }
  }, [user, loading, router]);

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
      
      // Request authentication token from the WebView
      // The web app should respond with a message containing the auth token
      const requestAuthScript = `
        (function() {
          console.log('AuthScreen: Requesting authentication from web app');
          
          // Try multiple methods to get authentication data
          
          // Method 1: Check if web app exposes auth data
          if (window.ReactNativeWebView) {
            // Request auth data from the web app
            const event = new CustomEvent('requestAuth', { 
              detail: { source: 'react-native-app' } 
            });
            window.dispatchEvent(event);
            
            // Method 2: Check for Supabase session
            if (typeof window.supabase !== 'undefined') {
              window.supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'AUTH_SUCCESS',
                    session: session
                  }));
                  console.log('AuthScreen: Sent Supabase session to app');
                }
              }).catch(err => {
                console.error('AuthScreen: Error getting Supabase session:', err);
              });
            }
            
            // Method 3: Check for auth cookies or localStorage
            try {
              const authData = localStorage.getItem('supabase.auth.token');
              if (authData) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'AUTH_SUCCESS',
                  authData: authData
                }));
                console.log('AuthScreen: Sent localStorage auth to app');
              }
            } catch (e) {
              console.error('AuthScreen: Error reading localStorage:', e);
            }
            
            // Method 4: Just signal that user is authenticated
            // The app will continue with WebView-based auth
            setTimeout(() => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'AUTH_DETECTED',
                url: window.location.href
              }));
              console.log('AuthScreen: Sent auth detected signal');
            }, 500);
          }
        })();
        true;
      `;
      
      webViewRef.current?.injectJavaScript(requestAuthScript);
      
      // Fallback: If we don't receive auth data within 3 seconds,
      // assume the user is authenticated via web cookies and proceed
      setTimeout(() => {
        if (isCheckingAuth && hasAttemptedAuthRef.current) {
          console.log('AuthScreen: No auth data received, but user is on authenticated page');
          console.log('AuthScreen: Proceeding with WebView-based authentication');
          setIsCheckingAuth(false);
          // Navigate to dashboard - the WebView will handle auth via cookies
          router.replace('/(tabs)/dashboard');
        }
      }, 3000);
    }
  };

  // Handle messages from the WebView
  const handleWebViewMessage = async (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('AuthScreen: Received message from WebView:', message.type);

      if (message.type === 'AUTH_SUCCESS' && message.session) {
        console.log('AuthScreen: Received Supabase session from WebView');
        
        // Set the session in the native Supabase client
        const { data, error } = await supabase.auth.setSession({
          access_token: message.session.access_token,
          refresh_token: message.session.refresh_token,
        });

        if (error) {
          console.error('AuthScreen: Error setting session:', error);
          // Even if session setting fails, user might be authenticated via web cookies
          console.log('AuthScreen: Proceeding to dashboard despite session error');
          router.replace('/(tabs)/dashboard');
        } else {
          console.log('AuthScreen: Session set successfully, user:', data.user?.email);
          // The onAuthStateChange listener will handle navigation
        }
      } else if (message.type === 'AUTH_DETECTED') {
        console.log('AuthScreen: Authentication detected, proceeding to dashboard');
        setIsCheckingAuth(false);
        router.replace('/(tabs)/dashboard');
      }
    } catch (error) {
      console.error('AuthScreen: Error handling WebView message:', error);
      // Don't block the user - they might still be authenticated via web cookies
      console.log('AuthScreen: Proceeding to dashboard despite message error');
      setIsCheckingAuth(false);
      router.replace('/(tabs)/dashboard');
    }
  };

  // Inject JavaScript to listen for auth events
  const injectedJavaScript = `
    (function() {
      console.log('AuthScreen: Injected script initialized');
      
      // Listen for custom auth request events from the app
      window.addEventListener('requestAuth', function(event) {
        console.log('AuthScreen: Received requestAuth event');
      });
      
      // Check if user is already on an authenticated page
      const isAuthPage = window.location.pathname.includes('/participant') ||
                         window.location.pathname.includes('/dashboard') ||
                         window.location.pathname.includes('/rankings');
      
      if (isAuthPage && window.ReactNativeWebView) {
        console.log('AuthScreen: Already on authenticated page, signaling to app');
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'AUTH_DETECTED',
          url: window.location.href
        }));
      }
    })();
    true;
  `;

  // Build the auth URL
  const authUrl = `${BASE_URL}/auth?source=app`;

  console.log('Loading auth WebView with URL:', authUrl);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top', 'bottom']}
    >
      {loading || isCheckingAuth ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.ptoGreen} />
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            {isCheckingAuth ? 'Completing sign in...' : 'Loading...'}
          </Text>
        </View>
      ) : (
        <WebView
          key={webViewKey}
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
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleWebViewMessage}
          injectedJavaScript={injectedJavaScript}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: typography.regular,
  },
});
