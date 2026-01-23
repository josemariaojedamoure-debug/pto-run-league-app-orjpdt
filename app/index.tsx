
import { Redirect } from 'expo-router';
import { useSupabase } from '@/contexts/SupabaseContext';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography } from '@/styles/commonStyles';
import React from 'react';

export default function Index() {
  const { user, loading, error, checkSession, signOut } = useSupabase();

  console.log('Index screen - User:', user ? 'Logged in' : 'Not logged in', 'Loading:', loading, 'Error:', error ? 'YES' : 'NO');

  // Show error state with retry option
  if (error && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.retryButton]} 
              onPress={checkSession}
            >
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.signOutButton]} 
              onPress={signOut}
            >
              <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.ptoGreen} />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  // Redirect to auth if not logged in, otherwise to dashboard
  if (!user) {
    console.log('Redirecting to /auth - user not logged in');
    return <Redirect href="/auth" />;
  }

  console.log('Redirecting to /(tabs)/dashboard - user logged in');
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
  errorContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
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
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
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
  signOutButton: {
    backgroundColor: colors.destructive,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#FFFFFF',
  },
});
