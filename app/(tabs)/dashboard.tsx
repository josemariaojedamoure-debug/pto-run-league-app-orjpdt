
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, Linking, Alert, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { colors, typography } from '@/styles/commonStyles';

const BASE_URL = 'https://publictimeoff.com';

export default function DashboardScreen() {
  const { effectiveTheme, language } = useTheme();
  const { user, loading: profileLoading, error, clearError, checkSession } = useSupabase();
  const webViewRef = useRef<WebView>(null);
  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;
  const [webViewUrl, setWebViewUrl] = useState('');
  const [isWebViewLoading, setIsWebViewLoading] = useState(true);

  // Build URL with source=app parameter - updates when language changes
  useEffect(() => {
    // Load the participant page directly - the web app will handle authentication
    const url = `${BASE_URL}/${language}/participant?source=app`;
    console.log('Dashboard screen loaded, loading WebView from:', url, 'Language:', language, 'Theme:', effectiveTheme);
    setWebViewUrl(url);
  }, [language, effectiveTheme]);

  // Handle navigation state changes to intercept special URLs
  const handleNavigationStateChange = (navState: any) => {
    console.log('WebView navigation:', navState.url);
    
    const url = navState.url;

    // Update loading state
    setIsWebViewLoading(navState.loading);

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

  // Show error state
  if (error && !profileLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        edges={['top']}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.retryButton]} 
              onPress={() => {
                clearError();
                checkSession();
              }}
            >
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!webViewUrl) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.ptoGreen} />
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            Loading dashboard...
          </Text>
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
              <Text style={[styles.loadingText, { color: themeColors.text }]}>
                Loading dashboard...
              </Text>
            </View>
          )}
          onLoadStart={() => {
            console.log('WebView started loading:', webViewUrl);
            setIsWebViewLoading(true);
          }}
          onLoadEnd={() => {
            console.log('WebView finished loading');
            setIsWebViewLoading(false);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            setIsWebViewLoading(false);
          }}
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
          // Share cookies with auth WebView - this allows the native Supabase client
          // to detect the session via the onAuthStateChange listener
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
        />
        
        {/* Show loading overlay while WebView is loading */}
        {isWebViewLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.ptoGreen} />
            <Text style={[styles.loadingText, { color: themeColors.text }]}>
              Loading dashboard...
            </Text>
          </View>
        )}
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: typography.regular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: typography.bold,
    color: colors.destructive,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    fontFamily: typography.regular,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: colors.ptoGreen,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#FFFFFF',
  },
});
