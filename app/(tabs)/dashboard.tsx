
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, Linking, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { colors } from '@/styles/commonStyles';
import { supabase } from '@/lib/supabase';

const BASE_URL = 'https://publictimeoff.com';

export default function DashboardScreen() {
  const { effectiveTheme, language } = useTheme();
  const { user, loading: profileLoading, session, checkSession } = useSupabase();
  const webViewRef = useRef<WebView>(null);
  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;
  const [webViewUrl, setWebViewUrl] = useState('');

  // Build URL with source=app parameter - updates when language changes
  useEffect(() => {
    const url = `${BASE_URL}/participant?source=app`;
    console.log('Dashboard screen loaded, loading WebView from:', url, 'Language:', language, 'Theme:', effectiveTheme);
    setWebViewUrl(url);
  }, [language, effectiveTheme]);

  // Handle messages from WebView to sync session
  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Dashboard received message from WebView:', data);

      if (data.type === 'AUTH_TOKEN' || data.type === 'AUTH_SUCCESS') {
        console.log('Syncing session from WebView to native app');
        
        let access_token, refresh_token;
        
        if (data.type === 'AUTH_TOKEN') {
          access_token = data.access_token;
          refresh_token = data.refresh_token;
        } else if (data.session) {
          access_token = data.session.access_token;
          refresh_token = data.session.refresh_token;
        }

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) {
            console.error('Error setting session from WebView:', error);
          } else {
            console.log('Session successfully synced from WebView');
            await checkSession();
          }
        }
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  // Handle navigation state changes to intercept special URLs
  const handleNavigationStateChange = (navState: any) => {
    console.log('WebView navigation:', navState.url);
    
    const url = navState.url;

    // Intercept Instagram URLs and open in Instagram app
    if (url.startsWith('instagram://') || url.includes('instagram.com/share')) {
      console.log('User attempting to share to Instagram, opening Instagram app');
      
      // Stop the WebView from navigating
      if (webViewRef.current) {
        webViewRef.current.stopLoading();
      }

      // Try to open Instagram app directly
      const instagramUrl = url.startsWith('instagram://') ? url : `instagram://share`;
      
      Linking.canOpenURL(instagramUrl).then((supported) => {
        if (supported) {
          console.log('Opening Instagram app with URL:', instagramUrl);
          Linking.openURL(instagramUrl);
        } else {
          // Fallback: Try to open Instagram in browser or app store
          console.log('Instagram app not installed, opening fallback');
          const fallbackUrl = Platform.OS === 'ios' 
            ? 'https://apps.apple.com/app/instagram/id389801252'
            : 'https://play.google.com/store/apps/details?id=com.instagram.android';
          Linking.openURL(fallbackUrl);
        }
      }).catch((err) => {
        console.error('Error opening Instagram:', err);
        Alert.alert('Error', 'Could not open Instagram. Please make sure Instagram is installed.');
      });

      return false; // Prevent WebView navigation
    }

    // Intercept mailto links and open with system mail provider picker
    if (url.startsWith('mailto:')) {
      console.log('User attempting to send email, opening mail provider picker');
      
      // Stop the WebView from navigating
      if (webViewRef.current) {
        webViewRef.current.stopLoading();
      }

      // Open with system mail provider picker
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          console.log('Opening mail provider picker with URL:', url);
          Linking.openURL(url); // This will show the system picker for Mail/Gmail/etc.
        } else {
          console.error('Cannot open mailto URL');
          Alert.alert('Error', 'Could not open mail app. Please check your mail settings.');
        }
      }).catch((err) => {
        console.error('Error opening mail app:', err);
        Alert.alert('Error', 'Could not open mail app.');
      });

      return false; // Prevent WebView navigation
    }

    // Ensure ?source=app persists across navigation
    if (url && !url.includes('source=app') && url.includes('publictimeoff.com')) {
      const separator = url.includes('?') ? '&' : '?';
      const newUrl = `${url}${separator}source=app`;
      console.log('Adding source=app to URL:', newUrl);
    }

    return true; // Allow other navigations
  };

  // Handle WebView requests to intercept before navigation
  const handleShouldStartLoadWithRequest = (request: any) => {
    const url = request.url;
    console.log('WebView should start load with request:', url);

    // Intercept Instagram URLs
    if (url.startsWith('instagram://') || url.includes('instagram.com/share')) {
      console.log('Intercepting Instagram share request');
      
      const instagramUrl = url.startsWith('instagram://') ? url : `instagram://share`;
      
      Linking.canOpenURL(instagramUrl).then((supported) => {
        if (supported) {
          console.log('Opening Instagram app');
          Linking.openURL(instagramUrl);
        } else {
          console.log('Instagram app not installed, opening app store');
          const fallbackUrl = Platform.OS === 'ios' 
            ? 'https://apps.apple.com/app/instagram/id389801252'
            : 'https://play.google.com/store/apps/details?id=com.instagram.android';
          Linking.openURL(fallbackUrl);
        }
      }).catch((err) => {
        console.error('Error opening Instagram:', err);
      });

      return false; // Block WebView navigation
    }

    // Intercept mailto links
    if (url.startsWith('mailto:')) {
      console.log('Intercepting mailto request');
      
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          console.log('Opening mail provider picker');
          Linking.openURL(url);
        } else {
          console.error('Cannot open mailto URL');
        }
      }).catch((err) => {
        console.error('Error opening mail app:', err);
      });

      return false; // Block WebView navigation
    }

    // Allow all other requests
    return true;
  };

  if (!webViewUrl || profileLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.ptoGreen} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      {/* WebView for participant dashboard - Full screen */}
      <View style={styles.webviewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: webViewUrl }}
          style={styles.webview}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.ptoGreen} />
            </View>
          )}
          onLoadStart={() => console.log('WebView started loading:', webViewUrl)}
          onLoadEnd={() => console.log('WebView finished loading')}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
          }}
          onMessage={handleWebViewMessage}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          // Enable JavaScript
          javaScriptEnabled={true}
          // Enable DOM storage
          domStorageEnabled={true}
          // Allow mixed content on Android
          mixedContentMode="compatibility"
          // iOS specific
          allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
          // Share cookies with auth WebView
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          // Inject JavaScript to sync session and handle share buttons
          injectedJavaScript={`
            (function() {
              console.log('Dashboard WebView JavaScript injected');
              
              // Function to send message to React Native
              function sendMessageToNative(message) {
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify(message));
                  console.log('Sent message to native app:', message);
                }
              }

              // Check if user is authenticated and sync session to native app
              function syncSessionToNative() {
                try {
                  const supabaseAuthKey = Object.keys(localStorage).find(key => 
                    key.includes('supabase.auth.token') || key.includes('sb-') && key.includes('-auth-token')
                  );
                  
                  if (supabaseAuthKey) {
                    const authData = localStorage.getItem(supabaseAuthKey);
                    if (authData) {
                      console.log('Found Supabase auth data, syncing to native');
                      const parsed = JSON.parse(authData);
                      
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
                  console.error('Error syncing session:', error);
                }
              }

              // Sync session on load
              syncSessionToNative();
              
              // Intercept link clicks to add source=app
              document.addEventListener('click', function(e) {
                var target = e.target;
                while (target && target.tagName !== 'A') {
                  target = target.parentElement;
                }
                if (target && target.href) {
                  // Check if it's an Instagram or mailto link
                  if (target.href.startsWith('instagram://') || 
                      target.href.includes('instagram.com/share') ||
                      target.href.startsWith('mailto:')) {
                    console.log('Detected special link:', target.href);
                    // Let the native handler deal with it
                    return;
                  }
                  
                  // Add source=app to internal links
                  var url = new URL(target.href);
                  if (!url.searchParams.has('source')) {
                    url.searchParams.set('source', 'app');
                    target.href = url.toString();
                    console.log('Added source=app to link:', target.href);
                  }
                }
              }, true);

              // Listen for messages from the web page about Instagram sharing
              window.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'instagram-share') {
                  console.log('Instagram share message received from web');
                  // The native handler will intercept the navigation
                }
              });
            })();
            true;
          `}
        />
      </View>
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
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
