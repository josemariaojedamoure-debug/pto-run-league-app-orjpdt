
import React, { useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { colors } from '@/styles/commonStyles';

const WEBVIEW_URL = 'https://publictimeoff.com';

export default function RankingsScreen() {
  const { effectiveTheme } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;

  console.log('Rankings screen loaded, loading WebView from:', WEBVIEW_URL);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      <WebView
        ref={webViewRef}
        source={{ uri: WEBVIEW_URL }}
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
        // Enable JavaScript
        javaScriptEnabled={true}
        // Enable DOM storage
        domStorageEnabled={true}
        // Allow mixed content on Android
        mixedContentMode="compatibility"
        // iOS specific
        allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
      />
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
