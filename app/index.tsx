
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, typography } from '@/styles/commonStyles';
import React from 'react';

export default function Index() {
  console.log('Index screen - Redirecting to dashboard');

  // Always redirect to dashboard
  // The dashboard will load the WebView with shared cookies
  // If user is not authenticated, the web app will redirect to auth page
  // If user is authenticated, the web app will show the participant dashboard
  return <Redirect href="/(tabs)/dashboard" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
    fontFamily: typography.regular,
  },
});
