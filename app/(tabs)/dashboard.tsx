
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, ScrollView, Text, TouchableOpacity, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { colors, typography, spacing } from '@/styles/commonStyles';
import * as WebBrowser from 'expo-web-browser';

const BASE_URL = 'https://publictimeoff.com';
const STRAVA_CLIENT_ID = '183997';

export default function DashboardScreen() {
  const { effectiveTheme, language } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;
  const [webViewUrl, setWebViewUrl] = useState('');

  // Placeholder user data - TODO: Backend Integration - GET /api/user to fetch user info
  const [userData] = useState({
    name: 'Jose Ojeda',
    company: 'PTO',
    profileId: 'user-profile-id', // This should come from actual user data
  });

  // Build URL with source=app parameter
  useEffect(() => {
    const url = `${BASE_URL}/participant?source=app`;
    console.log('Dashboard screen loaded, loading WebView from:', url);
    setWebViewUrl(url);
  }, []);

  const handleStravaConnect = async () => {
    console.log('User tapped Connect to Strava button');
    try {
      // Build Strava OAuth URL with correct redirect_uri
      const redirectUri = encodeURIComponent(`${BASE_URL}/participant?source=app`);
      const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=activity:read_all,profile:read_all&state=${userData.profileId}`;
      
      console.log('Opening Strava OAuth URL:', stravaAuthUrl);
      
      // Open Strava OAuth in browser
      // If user has Strava app installed, they will be prompted to open it
      const result = await WebBrowser.openBrowserAsync(stravaAuthUrl);
      
      console.log('Strava OAuth result:', result);
      
      // After OAuth completes and user returns, refresh the WebView
      if (result.type === 'cancel' || result.type === 'dismiss') {
        console.log('User closed Strava OAuth browser');
      }
      
      // Refresh WebView to show updated connection status
      if (webViewRef.current) {
        console.log('Refreshing WebView after Strava OAuth');
        webViewRef.current.reload();
      }
    } catch (error) {
      console.error('Error opening Strava OAuth:', error);
    }
  };

  const t = {
    en: {
      welcome: 'Welcome',
      trackPerformance: 'Track your performance and upcoming events',
      performanceProfile: 'Performance Profile',
      connectStravaDescription: 'Connect your Strava account to generate your personalized score',
      connectToStrava: 'Connect to Strava',
      runningDataEnables: 'Your running data enables fair competition with colleagues of all fitness levels.',
    },
    fr: {
      welcome: 'Bienvenue',
      trackPerformance: 'Suivez vos performances et événements à venir',
      performanceProfile: 'Profil de performance',
      connectStravaDescription: 'Connectez votre compte Strava pour générer votre score personnalisé',
      connectToStrava: 'Connecter à Strava',
      runningDataEnables: 'Vos données de course permettent une compétition équitable avec vos collègues de tous niveaux.',
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
        {/* Welcome Text Section */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeTitle, { color: themeColors.foreground }]}>
            {strings.welcome}, {userData.name}
          </Text>
          <Text style={[styles.companyName, { color: themeColors.mutedText || themeColors.secondaryText }]}>
            {userData.company}
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: themeColors.mutedText || themeColors.secondaryText }]}>
            {strings.trackPerformance}
          </Text>
        </View>

        {/* Native Strava Integration Card - Matching Performance Profile Design */}
        <View style={[
          styles.stravaCard, 
          { 
            backgroundColor: themeColors.card,
            borderColor: effectiveTheme === 'dark' ? themeColors.border : 'hsl(220, 13%, 88%)',
          }
        ]}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: themeColors.foreground }]}>
              {strings.performanceProfile}
            </Text>
            <Text style={[styles.cardDescription, { color: themeColors.mutedText || themeColors.secondaryText }]}>
              {strings.connectStravaDescription}
            </Text>
          </View>

          {/* Card Content */}
          <View style={styles.cardContent}>
            <View style={styles.cardInnerContent}>
              {/* "Connect to Strava" text - same font size and design as "Performance Profile" */}
              <Text style={[styles.connectToStravaText, { color: themeColors.foreground }]}>
                {strings.connectToStrava}
              </Text>

              {/* Connect to Strava Button */}
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

              {/* Description Text */}
              <Text style={[styles.stravaDescription, { color: themeColors.mutedText || themeColors.secondaryText }]}>
                {strings.runningDataEnables}
              </Text>
            </View>
          </View>
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
  // Welcome Text Section Styles
  welcomeSection: {
    paddingHorizontal: 16, // px-4 = 16px
    paddingTop: 32, // py-8 = 32px top
    marginBottom: 32, // mb-8 = 32px
  },
  welcomeTitle: {
    fontSize: 24, // text-2xl = 24px mobile
    fontWeight: '700', // font-bold
    letterSpacing: -0.025 * 24, // tracking-tight = -0.025em
    marginBottom: 12, // mb-3 = 12px
    fontFamily: 'Helvetica Neue',
  },
  companyName: {
    fontSize: 14, // text-sm = 14px mobile
    fontWeight: '500', // font-medium
    marginBottom: 8, // mb-2 = 8px
  },
  welcomeSubtitle: {
    fontSize: 14, // text-sm = 14px mobile
    fontWeight: '400', // normal
  },
  // Strava Card Styles - Matching Performance Profile
  stravaCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12, // rounded-xl = 12px
    borderWidth: 2, // border-2 = 2px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    padding: 24, // p-6 = 24px all sides
    flexDirection: 'column',
    gap: 6, // space-y-1.5 = 6px
  },
  cardTitle: {
    fontSize: 18, // text-lg = 18px mobile
    fontWeight: '600', // font-semibold
    lineHeight: 18, // leading-none = 1
    letterSpacing: -0.025 * 18, // tracking-tight = -0.025em
  },
  cardDescription: {
    fontSize: 14, // text-sm = 14px mobile
  },
  cardContent: {
    paddingHorizontal: 24, // p-6 sides = 24px
    paddingBottom: 24, // p-6 bottom = 24px
    paddingTop: 0, // pt-0 = 0
  },
  cardInnerContent: {
    paddingVertical: 24, // py-6 = 24px mobile
    alignItems: 'center',
  },
  // "Connect to Strava" text - same font size and design as "Performance Profile"
  connectToStravaText: {
    fontSize: 18, // Same as cardTitle (text-lg = 18px mobile)
    fontWeight: '600', // Same as cardTitle (font-semibold)
    lineHeight: 18, // Same as cardTitle (leading-none = 1)
    letterSpacing: -0.025 * 18, // Same as cardTitle (tracking-tight = -0.025em)
    marginBottom: 24,
    textAlign: 'center',
  },
  stravaButton: {
    width: '100%',
    marginBottom: 16,
  },
  stravaButtonImage: {
    width: '100%',
    height: 50,
  },
  stravaDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
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
