
import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, Linking, Alert, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { colors, typography } from '@/styles/commonStyles';
import { useRouter } from 'expo-router';

const BASE_URL = 'https://publictimeoff.com';

export default function RankingsScreen() {
  const { effectiveTheme, language } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;
  const [isWebViewLoading, setIsWebViewLoading] = useState(true);
  const router = useRouter();

  // Build URL with source=app parameter
  const rankingsUrl = `${BASE_URL}/${language}/rankings?source=app`;

  console.log('Rankings screen loaded, loading WebView from:', rankingsUrl, 'Language:', language, 'Theme:', effectiveTheme);

  // Handle navigation state changes to intercept special URLs
  const handleNavigationStateChange = (navState: any) => {
    console.log('Rankings WebView navigation:', navState.url);
    
    const url = navState.url;

    // Update loading state
    setIsWebViewLoading(navState.loading);

    // If the web app redirects to /auth, it means user is not authenticated
    // Redirect to native auth screen
    if (url.includes('/auth') && url.includes('source=app')) {
      console.log('Rankings: Web app redirected to auth - user not authenticated');
      console.log('Rankings: Redirecting to native auth screen');
      router.replace('/auth');
      return false;
    }

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
    console.log('Rankings WebView should start load with request:', url);

    // If the web app redirects to /auth, redirect to native auth screen
    if (url.includes('/auth') && url.includes('source=app')) {
      console.log('Rankings: Intercepting auth redirect');
      router.replace('/auth');
      return false;
    }

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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      {/* WebView for rankings - Full screen */}
      <View style={styles.webviewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: rankingsUrl }}
          style={styles.webview}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={[styles.loadingContainer, { backgroundColor: colors.ptoGreen }]}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingTextWhite}>
                Loading rankings...
              </Text>
            </View>
          )}
          onLoadStart={() => {
            console.log('Rankings WebView started loading:', rankingsUrl);
            setIsWebViewLoading(true);
          }}
          onLoadEnd={() => {
            console.log('Rankings WebView finished loading');
            setIsWebViewLoading(false);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('Rankings WebView error:', nativeEvent);
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
          // Share cookies with auth WebView - this allows authentication via web cookies
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
        />
        
        {/* Show native green loading screen while WebView is loading */}
        {isWebViewLoading && (
          <View style={[styles.loadingOverlay, { backgroundColor: colors.ptoGreen }]}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingTextWhite}>
              Loading rankings...
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
  },
  loadingTextWhite: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: typography.regular,
    color: '#FFFFFF',
  },
});
