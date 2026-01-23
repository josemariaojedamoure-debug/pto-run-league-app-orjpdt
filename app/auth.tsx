
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
  const { user, loading, checkSession } = useSupabase();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);

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

    // If navigating to participant/dashboard pages, user is likely authenticated
    const isParticipantPage = url.includes('/participant') || url.includes('/dashboard') || url.includes('/rankings');
    
    if (isParticipantPage && !isCheckingAuth) {
      console.log('AuthScreen: User navigated to authenticated page, requesting session from WebView...');
      setIsCheckingAuth(true);
      
      // Request the session from the WebView
      const requestSessionScript = `
        (function() {
          if (typeof window.supabase !== 'undefined') {
            window.supabase.auth.getSession().then(({ data: { session } }) => {
              if (session && window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'SUPABASE_AUTH_SUCCESS',
                  session: session
                }));
                console.log('Sent session to React Native app');
              } else {
                console.log('No session found or ReactNativeWebView not available');
              }
            });
          } else {
            console.log('Supabase not available on window');
          }
        })();
        true;
      `;
      
      webViewRef.current?.injectJavaScript(requestSessionScript);
      
      // Fallback: If we don't receive a message within 2 seconds, reload the WebView
      setTimeout(() => {
        if (isCheckingAuth) {
          console.log('AuthScreen: No session received from WebView, reloading...');
          setIsCheckingAuth(false);
          setWebViewKey(prev => prev + 1);
        }
      }, 2000);
    }
  };

  // Handle messages from the WebView
  const handleWebViewMessage = async (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('AuthScreen: Received message from WebView:', message.type);

      if (message.type === 'SUPABASE_AUTH_SUCCESS' && message.session) {
        console.log('AuthScreen: Setting session from WebView message');
        setIsCheckingAuth(true);
        
        // Set the session in the native Supabase client
        const { data, error } = await supabase.auth.setSession({
          access_token: message.session.access_token,
          refresh_token: message.session.refresh_token,
        });

        if (error) {
          console.error('AuthScreen: Error setting session:', error);
          setIsCheckingAuth(false);
        } else {
          console.log('AuthScreen: Session set successfully, user:', data.user?.email);
          // The onAuthStateChange listener in SupabaseContext will handle the rest
          // Don't set isCheckingAuth to false here - let the redirect happen
        }
      }
    } catch (error) {
      console.error('AuthScreen: Error handling WebView message:', error);
      setIsCheckingAuth(false);
    }
  };

  // Inject JavaScript to listen for Supabase auth events
  const injectedJavaScript = `
    (function() {
      console.log('AuthScreen: Injected script running');
      
      // Function to send message to React Native
      function sendMessageToApp(type, data) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
          console.log('AuthScreen: Sent message to app:', type);
        } else {
          console.log('AuthScreen: ReactNativeWebView not available');
        }
      }

      // Function to check and send session
      function checkAndSendSession() {
        if (typeof window.supabase !== 'undefined') {
          console.log('AuthScreen: Supabase client found, checking session');
          
          window.supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              console.log('AuthScreen: Session found, sending to app');
              sendMessageToApp('SUPABASE_AUTH_SUCCESS', { session });
            } else {
              console.log('AuthScreen: No session found');
            }
          }).catch(err => {
            console.error('AuthScreen: Error getting session:', err);
          });
          
          // Also listen for future auth changes
          window.supabase.auth.onAuthStateChange((event, session) => {
            console.log('AuthScreen: Auth state changed:', event);
            if (event === 'SIGNED_IN' && session) {
              console.log('AuthScreen: User signed in, sending session to app');
              sendMessageToApp('SUPABASE_AUTH_SUCCESS', { session });
            }
          });
        } else {
          console.log('AuthScreen: Supabase not found, will retry');
        }
      }

      // Try immediately
      checkAndSendSession();
      
      // Retry after delays in case Supabase loads later
      setTimeout(checkAndSendSession, 500);
      setTimeout(checkAndSendSession, 1000);
      setTimeout(checkAndSendSession, 2000);
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
            {isCheckingAuth ? 'Signing you in...' : 'Loading...'}
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
