
import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, Linking, Alert, Text, Share } from 'react-native';
import { WebView, WebViewNavigationEvent, WebViewNavigation } from 'react-native-webview';
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
  const [webViewUrl, setWebViewUrl] = useState('');
  const router = useRouter();

  // Build URL with source=app parameter - updates when language or theme changes
  useEffect(() => {
    // Theme parameter: only add &theme=dark for dark mode, light mode has no parameter (default)
    const themeParam = effectiveTheme === 'dark' ? '&theme=dark' : '';
    const url = `${BASE_URL}/${language}/rankings?source=app${themeParam}`;
    console.log('Rankings screen loaded, loading WebView from:', url, 'Language:', language, 'Theme:', effectiveTheme);
    setWebViewUrl(url);
  }, [language, effectiveTheme]);

  // Inject JavaScript to force theme in WebView and set up message handlers
  const injectedJavaScript = `
    (function() {
      // Set theme in localStorage to override any saved preference
      try {
        localStorage.setItem('theme', '${effectiveTheme}');
        console.log('[Native App] Set theme to ${effectiveTheme} in localStorage');
        
        // Dispatch custom event for web app to listen to
        window.dispatchEvent(new CustomEvent('appThemeChanged', { detail: '${effectiveTheme}' }));
        console.log('[Native App] Dispatched appThemeChanged event');
        
        // Force apply theme by adding data attribute to html element
        document.documentElement.setAttribute('data-theme', '${effectiveTheme}');
        console.log('[Native App] Set data-theme attribute to ${effectiveTheme}');
      } catch (error) {
        console.error('[Native App] Error setting theme:', error);
      }

      // Intercept share actions from the web app
      if (window.navigator && window.navigator.share) {
        const originalShare = window.navigator.share;
        window.navigator.share = function(shareData) {
          console.log('[Native App] Intercepted share action:', shareData);
          
          // Send share data to native app
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SHARE_REQUEST',
              data: shareData
            }));
          }
          
          // Return a resolved promise to prevent web app from showing error
          return Promise.resolve();
        };
      }
    })();
    true;
  `;

  // Handle messages from WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('Rankings: Received message from WebView:', message.type);

      if (message.type === 'SHARE_REQUEST') {
        console.log('Rankings: Share request received:', message.data);
        handleShare(message.data);
      }
    } catch (error) {
      console.error('Rankings: Error handling WebView message:', error);
    }
  };

  // Handle share action
  const handleShare = async (shareData: any) => {
    try {
      console.log('Rankings: Handling share with data:', shareData);
      
      // Check if this is an Instagram share request
      // Look for Instagram in URL, text, or title
      const shareUrl = shareData.url || '';
      const shareText = shareData.text || '';
      const shareTitle = shareData.title || '';
      
      const isInstagramShare = 
        shareUrl.toLowerCase().includes('instagram') || 
        shareText.toLowerCase().includes('instagram') ||
        shareTitle.toLowerCase().includes('instagram') ||
        shareUrl.includes('instagram.com');
      
      if (isInstagramShare) {
        console.log('Rankings: Instagram share detected, opening Instagram app');
        
        // Try to open Instagram app with stories
        const instagramUrl = 'instagram://story-camera';
        const canOpen = await Linking.canOpenURL(instagramUrl);
        
        if (canOpen) {
          console.log('Rankings: Opening Instagram app');
          await Linking.openURL(instagramUrl);
        } else {
          console.log('Rankings: Instagram app not installed, opening app store');
          const fallbackUrl = Platform.OS === 'ios' 
            ? 'https://apps.apple.com/app/instagram/id389801252'
            : 'https://play.google.com/store/apps/details?id=com.instagram.android';
          await Linking.openURL(fallbackUrl);
        }
      } else {
        // Use native share sheet for other shares
        console.log('Rankings: Using native share sheet');
        await Share.share({
          message: shareText || shareTitle || '',
          url: shareUrl || '',
          title: shareTitle || '',
        });
      }
    } catch (error) {
      console.error('Rankings: Error sharing:', error);
      Alert.alert('Error', 'Could not share content. Please try again.');
    }
  };

  // Handle navigation state changes to intercept special URLs
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const url = navState.url;
    console.log('Rankings WebView navigation:', url);

    // Guard against undefined url
    if (!url) {
      console.log('Rankings: URL is undefined, skipping navigation check');
      setIsWebViewLoading(navState.loading);
      return true;
    }

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
    if (url.startsWith('instagram://') || url.includes('instagram.com/share') || url.includes('instagram.com/stories')) {
      console.log('User attempting to share to Instagram, opening Instagram app');
      
      // Stop the WebView from navigating
      if (webViewRef.current) {
        webViewRef.current.stopLoading();
      }

      // Try to open Instagram app directly
      const instagramUrl = url.startsWith('instagram://') ? url : 'instagram://story-camera';
      
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

    // Guard against undefined url
    if (!url) {
      console.log('Rankings: URL is undefined in request, allowing');
      return true;
    }

    // If the web app redirects to /auth, redirect to native auth screen
    if (url.includes('/auth') && url.includes('source=app')) {
      console.log('Rankings: Intercepting auth redirect');
      router.replace('/auth');
      return false;
    }

    // Intercept Instagram URLs
    if (url.startsWith('instagram://') || url.includes('instagram.com/share') || url.includes('instagram.com/stories')) {
      console.log('Intercepting Instagram share request');
      
      const instagramUrl = url.startsWith('instagram://') ? url : 'instagram://story-camera';
      
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

  // Handle load end - FIXED to properly read URL from event.nativeEvent
  const handleLoadEnd = (event: WebViewNavigationEvent) => {
    const url = event.nativeEvent?.url;
    console.log('Rankings WebView finished loading, URL:', url);
    
    // Guard against undefined url
    if (!url) {
      console.warn('Rankings: URL is undefined in load end, clearing loading state');
      setIsWebViewLoading(false);
      return;
    }
    
    setIsWebViewLoading(false);
    
    // Re-inject theme after page load to ensure it's applied
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(injectedJavaScript);
    }
  };

  if (!webViewUrl) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.ptoGreen} />
          <Text style={[styles.loadingText, { color: themeColors.foreground }]}>
            Loading rankings...
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
      {/* WebView for rankings - Full screen */}
      <View style={styles.webviewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: webViewUrl }}
          style={styles.webview}
          startInLoadingState={true}
          injectedJavaScript={injectedJavaScript}
          injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
          onMessage={handleWebViewMessage}
          renderLoading={() => (
            <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
              <ActivityIndicator size="large" color={colors.ptoGreen} />
              <Text style={[styles.loadingText, { color: themeColors.foreground }]}>
                Loading rankings...
              </Text>
            </View>
          )}
          onLoadStart={() => {
            console.log('Rankings WebView started loading:', webViewUrl);
            setIsWebViewLoading(true);
          }}
          onLoadEnd={handleLoadEnd}
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
        
        {/* Show loading screen matching theme while WebView is loading */}
        {isWebViewLoading && (
          <View style={[styles.loadingOverlay, { backgroundColor: themeColors.background }]}>
            <ActivityIndicator size="large" color={colors.ptoGreen} />
            <Text style={[styles.loadingText, { color: themeColors.foreground }]}>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: typography.regular,
  },
});
