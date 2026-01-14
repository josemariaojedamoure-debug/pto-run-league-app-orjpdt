
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { colors } from '@/styles/commonStyles';

const BASE_URL = 'https://publictimeoff.com';

export default function DashboardScreen() {
  const { effectiveTheme, language } = useTheme();
  const { user, loading: profileLoading } = useSupabase();
  const webViewRef = useRef<WebView>(null);
  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;
  const [webViewUrl, setWebViewUrl] = useState('');

  // Build URL with source=app parameter - updates when language changes
  useEffect(() => {
    const url = `${BASE_URL}/participant?source=app`;
    console.log('Dashboard screen loaded, loading WebView from:', url, 'Language:', language, 'Theme:', effectiveTheme);
    setWebViewUrl(url);
  }, [language, effectiveTheme]);

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
          onNavigationStateChange={(navState) => {
            console.log('WebView navigation:', navState.url);
            // Ensure ?source=app persists across navigation
            if (navState.url && !navState.url.includes('source=app')) {
              const separator = navState.url.includes('?') ? '&' : '?';
              const newUrl = `${navState.url}${separator}source=app`;
              console.log('Adding source=app to URL:', newUrl);
            }
          }}
          // Enable JavaScript
          javaScriptEnabled={true}
          // Enable DOM storage
          domStorageEnabled={true}
          // Allow mixed content on Android
          mixedContentMode="compatibility"
          // iOS specific
          allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
          // Inject JavaScript to ensure source=app persists
          injectedJavaScript={`
            (function() {
              console.log('WebView JavaScript injected - ensuring source=app persists');
              // Intercept link clicks to add source=app
              document.addEventListener('click', function(e) {
                var target = e.target;
                while (target && target.tagName !== 'A') {
                  target = target.parentElement;
                }
                if (target && target.href) {
                  var url = new URL(target.href);
                  if (!url.searchParams.has('source')) {
                    url.searchParams.set('source', 'app');
                    target.href = url.toString();
                    console.log('Added source=app to link:', target.href);
                  }
                }
              }, true);
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
