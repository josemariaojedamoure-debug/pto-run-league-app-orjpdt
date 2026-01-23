
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { colors } from '@/styles/commonStyles';
import { supabase } from '@/lib/supabase';

const BASE_URL = 'https://publictimeoff.com';

export default function AuthScreen() {
  const { effectiveTheme } = useTheme();
  const { user, loading, checkSession } = useSupabase();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;
  const hasCheckedSessionRef = useRef(false);

  console.log('AuthScreen - User:', user ? 'Logged in' : 'Not logged in', 'Loading:', loading);

  // Redirect to dashboard if user is authenticated
  useEffect(() => {
    if (!loading && user) {
      console.log('User authenticated, redirecting to dashboard');
      router.replace('/(tabs)/dashboard');
    }
  }, [user, loading, router]);

  // Handle navigation state changes - detect when user navigates away from /auth
  const handleNavigationStateChange = async (navState: WebViewNavigation) => {
    const url = navState.url;
    console.log('AuthScreen: WebView navigated to:', url);

    // If the user navigates away from /auth (e.g., to /participant or /dashboard),
    // it means they successfully logged in. Check the session.
    if (!url.includes('/auth') && !hasCheckedSessionRef.current) {
      console.log('AuthScreen: User navigated away from /auth, checking session...');
      hasCheckedSessionRef.current = true;
      
      // Wait a moment for cookies to sync
      setTimeout(async () => {
        console.log('AuthScreen: Checking session after navigation');
        await checkSession();
      }, 500);
    }
  };

  // Handle messages from the WebView (backup method)
  const handleWebViewMessage = async (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('AuthScreen: Received message from WebView:', message.type);

      if (message.type === 'SUPABASE_AUTH_SUCCESS' && message.session) {
        console.log('AuthScreen: Setting session from WebView message');
        
        // Set the session in the native Supabase client
        const { data, error } = await supabase.auth.setSession({
          access_token: message.session.access_token,
          refresh_token: message.session.refresh_token,
        });

        if (error) {
          console.error('AuthScreen: Error setting session:', error);
        } else {
          console.log('AuthScreen: Session set successfully, user:', data.user?.email);
          // The onAuthStateChange listener in SupabaseContext will handle the rest
        }
      }
    } catch (error) {
      console.error('AuthScreen: Error handling WebView message:', error);
    }
  };

  // Inject JavaScript to listen for Supabase auth events and send them to React Native
  const injectedJavaScript = `
    (function() {
      console.log('AuthScreen injected script: Setting up Supabase auth listener');
      
      // Function to send message to React Native
      function sendMessageToApp(type, data) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
          console.log('AuthScreen injected script: Sent message to app:', type);
        }
      }

      // Check if Supabase is available
      if (typeof window.supabase !== 'undefined') {
        console.log('AuthScreen injected script: Supabase client found');
        
        // Listen for auth state changes
        window.supabase.auth.onAuthStateChange((event, session) => {
          console.log('AuthScreen injected script: Auth state changed:', event);
          
          if (event === 'SIGNED_IN' && session) {
            console.log('AuthScreen injected script: User signed in, sending session to app');
            sendMessageToApp('SUPABASE_AUTH_SUCCESS', { session });
          }
        });

        // Also check for existing session immediately
        window.supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            console.log('AuthScreen injected script: Existing session found, sending to app');
            sendMessageToApp('SUPABASE_AUTH_SUCCESS', { session });
          }
        });
      } else {
        console.log('AuthScreen injected script: Supabase client not found, will retry');
        
        // Retry after a delay if Supabase isn't loaded yet
        setTimeout(() => {
          if (typeof window.supabase !== 'undefined') {
            console.log('AuthScreen injected script: Supabase client found on retry');
            
            window.supabase.auth.onAuthStateChange((event, session) => {
              console.log('AuthScreen injected script: Auth state changed:', event);
              
              if (event === 'SIGNED_IN' && session) {
                console.log('AuthScreen injected script: User signed in, sending session to app');
                sendMessageToApp('SUPABASE_AUTH_SUCCESS', { session });
              }
            });

            window.supabase.auth.getSession().then(({ data: { session } }) => {
              if (session) {
                console.log('AuthScreen injected script: Existing session found, sending to app');
                sendMessageToApp('SUPABASE_AUTH_SUCCESS', { session });
              }
            });
          }
        }, 1000);
      }
    })();
    true; // Required for iOS
  `;

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
});
