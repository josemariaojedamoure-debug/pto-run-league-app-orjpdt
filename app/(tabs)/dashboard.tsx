
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, ScrollView, Text, TouchableOpacity, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { colors, typography, spacing } from '@/styles/commonStyles';
import * as WebBrowser from 'expo-web-browser';

const BASE_URL = 'https://publictimeoff.com';

export default function DashboardScreen() {
  const { effectiveTheme, language } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;
  const [webViewUrl, setWebViewUrl] = useState('');

  // Build URL with source=app parameter
  useEffect(() => {
    const url = `${BASE_URL}/participant?source=app`;
    console.log('Dashboard screen loaded, loading WebView from:', url);
    setWebViewUrl(url);
  }, []);

  const handleStravaConnect = async () => {
    console.log('User tapped Connect to Strava button');
    try {
      // Open Strava OAuth flow - callback will be handled by publictimeoff.com
      const stravaAuthUrl = `${BASE_URL}/auth/strava?source=app`;
      await WebBrowser.openBrowserAsync(stravaAuthUrl);
      
      // After OAuth completes and user returns, refresh the WebView
      if (webViewRef.current) {
        webViewRef.current.reload();
      }
    } catch (error) {
      console.error('Error opening Strava OAuth:', error);
    }
  };

  const t = {
    en: {
      connectStrava: 'Connect to Strava',
      stravaDescription: 'Connect your Strava account to sync your runs and track your performance.',
    },
    fr: {
      connectStrava: 'Connecter à Strava',
      stravaDescription: 'Connectez votre compte Strava pour synchroniser vos courses et suivre vos performances.',
    },
  };

  const strings = t[language];

  if (!webViewUrl) {
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
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Native Strava Integration Card */}
        <View style={[styles.stravaCard, { backgroundColor: themeColors.card }]}>
          <TouchableOpacity 
            onPress={handleStravaConnect}
            activeOpacity={0.8}
            style={styles.stravaButton}
          >
            <Image
              source={require('@/assets/images/3f593887-3444-43e9-8d1b-f35da33e1638.png')}
              style={styles.stravaButtonImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={[styles.stravaDescription, { color: themeColors.mutedText || themeColors.secondaryText }]}>
            {strings.stravaDescription}
          </Text>
        </View>

        {/* WebView for participant dashboard */}
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
            onLoadStart={() => console.log('WebView started loading')}
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
                    }
                  }
                }, true);
              })();
              true;
            `}
          />
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stravaCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    borderRadius: spacing.borderRadius,
    padding: spacing.cardPadding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stravaButton: {
    width: '100%',
    marginBottom: 12,
  },
  stravaButtonImage: {
    width: '100%',
    height: 50,
  },
  stravaDescription: {
    fontSize: typography.sizes.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  webviewContainer: {
    flex: 1,
    minHeight: 600,
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
