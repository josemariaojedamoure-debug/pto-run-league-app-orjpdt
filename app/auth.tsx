
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { colors } from '@/styles/commonStyles';
import { supabase } from '@/lib/supabase';

const BASE_URL = 'https://publictimeoff.com';

export default function AuthScreen() {
  const { effectiveTheme, language } = useTheme();
  const { user, loading, checkSession } = useSupabase();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;
  const isProcessingAuth = useRef(false);
  const lastProcessedToken = useRef<string | null>(null);

  console.log('AuthScreen - User:', user ? 'Logged in' : 'Not logged in', 'Loading:', loading);

  // Redirect to dashboard if user is authenticated
  useEffect(() => {
    if (!loading && user) {
      console.log('User authenticated, redirecting to dashboard');
      router.replace('/(tabs)/dashboard');
    }
  }, [user, loading, router]);

  // Handle messages from WebView
  const handleWebViewMessage = async (event: any) => {
    // Prevent processing if already handling an auth attempt
    if (isProcessingAuth.current) {
      console.log('Already processing auth, ignoring duplicate message');
      return;
    }

    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Received message from WebView:', data);

      if (data.type === 'AUTH_SUCCESS') {
        console.log('Authentication successful in WebView, syncing session to native app');
        
        // If the web page sends us the session data, set it in the native Supabase client
        if (data.session) {
          console.log('Setting session from WebView data');
          const { access_token, refresh_token } = data.session;
          
          // Check if we already processed this token
          if (lastProcessedToken.current === access_token) {
            console.log('Already processed this token, skipping');
            return;
          }

          isProcessingAuth.current = true;
          lastProcessedToken.current = access_token;
          
          // Set the session in the native Supabase client
          const { data: sessionData, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) {
            console.error('Error setting session from WebView:', error);
            isProcessingAuth.current = false;
          } else {
            console.log('Session successfully set from WebView, user should be authenticated now');
            // Force a session check to update the context
            await checkSession();
            isProcessingAuth.current = false;
          }
        } else {
          // Fallback: Just check for session (in case cookies are shared)
          console.log('No session data in message, checking for session via Supabase');
          await checkSession();
        }
      } else if (data.type === 'AUTH_TOKEN') {
        console.log('Received auth token from WebView');
        const { access_token, refresh_token } = data;
        
        // Check if we already processed this token
        if (lastProcessedToken.current === access_token) {
          console.log('Already processed this token, skipping');
          return;
        }

        isProcessingAuth.current = true;
        lastProcessedToken.current = access_token;
        
        // Set the session in the native Supabase client
        const { data: sessionData, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          console.error('Error setting session from token:', error);
          // Don't retry - break the loop
          isProcessingAuth.current = false;
          
          // If setSession fails, it means the WebView auth approach isn't working
          // The user should stay on the auth page and try again
          console.log('Session sync failed. User should authenticate via WebView.');
        } else {
          console.log('Session successfully set from token');
          await checkSession();
          isProcessingAuth.current = false;
        }
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
      isProcessingAuth.current = false;
    }
  };

  // Build the auth URL with source parameter
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
          onMessage={handleWebViewMessage}
          onNavigationStateChange={(navState) => {
            console.log('WebView navigation state changed:', navState.url);
            
            // Check if user has navigated away from auth page (successful login)
            if (navState.url && !navState.url.includes('/auth')) {
              console.log('User navigated away from auth page, checking authentication status');
              // Check for session after a short delay to allow cookies to sync
              setTimeout(() => {
                checkSession();
              }, 1000);
            }
          }}
          // Allow cookies and local storage for authentication
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          // Inject JavaScript to detect successful authentication and send session to native app
          injectedJavaScript={`
            (function() {
              console.log('WebView loaded with theme: ${effectiveTheme}, language: ${language}');
              
              let lastSentToken = null;
              let hasSentToken = false;
              
              // Function to send message to React Native
              function sendMessageToNative(message) {
                if (window.ReactNativeWebView) {
                  // Prevent sending duplicate tokens
                  if (message.type === 'AUTH_TOKEN' && message.access_token === lastSentToken) {
                    console.log('Token already sent, skipping duplicate');
                    return;
                  }
                  
                  if (message.type === 'AUTH_TOKEN') {
                    lastSentToken = message.access_token;
                    hasSentToken = true;
                  }
                  
                  window.ReactNativeWebView.postMessage(JSON.stringify(message));
                  console.log('Sent message to native app:', message.type);
                }
              }

              // Check if user is authenticated by looking for Supabase session
              function checkAuthStatus() {
                // Only check once to prevent loops
                if (hasSentToken) {
                  console.log('Already sent token, skipping check');
                  return;
                }
                
                try {
                  // Try to get session from localStorage (where Supabase stores it)
                  const supabaseAuthKey = Object.keys(localStorage).find(key => 
                    key.includes('supabase.auth.token') || key.includes('sb-') && key.includes('-auth-token')
                  );
                  
                  if (supabaseAuthKey) {
                    const authData = localStorage.getItem(supabaseAuthKey);
                    if (authData) {
                      console.log('Found Supabase auth data in localStorage');
                      const parsed = JSON.parse(authData);
                      
                      // Send the session to native app (only once)
                      if (parsed.access_token && parsed.refresh_token) {
                        sendMessageToNative({
                          type: 'AUTH_TOKEN',
                          access_token: parsed.access_token,
                          refresh_token: parsed.refresh_token
                        });
                      } else if (parsed.currentSession) {
                        sendMessageToNative({
                          type: 'AUTH_SUCCESS',
                          session: parsed.currentSession
                        });
                      }
                    }
                  }
                } catch (error) {
                  console.error('Error checking auth status:', error);
                }
              }

              // Check auth status on load
              setTimeout(checkAuthStatus, 1000);

              // Monitor for changes to localStorage (successful login)
              const originalSetItem = localStorage.setItem;
              localStorage.setItem = function(key, value) {
                originalSetItem.apply(this, arguments);
                if ((key.includes('supabase') || key.includes('auth')) && !hasSentToken) {
                  console.log('localStorage changed, checking auth status');
                  setTimeout(checkAuthStatus, 500);
                }
              };

              true;
            })();
          `}
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
