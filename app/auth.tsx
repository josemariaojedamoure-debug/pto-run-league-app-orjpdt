
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { colors, typography, spacing } from '@/styles/commonStyles';

export default function AuthScreen() {
  const { effectiveTheme } = useTheme();
  const { signIn, signUp, loading } = useSupabase();
  const router = useRouter();
  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    console.log('User tapped', isSignUp ? 'Sign Up' : 'Sign In', 'button');
    
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (isSignUp && (!name || !company)) {
      Alert.alert('Error', 'Please enter name and company');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        console.log('Signing up user with email:', email);
        await signUp(email, password, name, company);
        Alert.alert('Success', 'Account created successfully! Please sign in.');
        setIsSignUp(false);
        setPassword('');
      } else {
        console.log('Signing in user with email:', email);
        await signIn(email, password);
        console.log('Sign in successful, navigating to dashboard');
        router.replace('/(tabs)/dashboard');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.foreground }]}>
              PTO Corporate Running League
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.mutedText || themeColors.secondaryText }]}>
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {isSignUp && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: themeColors.foreground }]}>
                    Name
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: themeColors.card,
                        color: themeColors.foreground,
                        borderColor: themeColors.border,
                      },
                    ]}
                    placeholder="Enter your name"
                    placeholderTextColor={themeColors.mutedText || themeColors.secondaryText}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!isSubmitting}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: themeColors.foreground }]}>
                    Company
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: themeColors.card,
                        color: themeColors.foreground,
                        borderColor: themeColors.border,
                      },
                    ]}
                    placeholder="Enter your company"
                    placeholderTextColor={themeColors.mutedText || themeColors.secondaryText}
                    value={company}
                    onChangeText={setCompany}
                    autoCapitalize="words"
                    editable={!isSubmitting}
                  />
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.foreground }]}>
                Email
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.card,
                    color: themeColors.foreground,
                    borderColor: themeColors.border,
                  },
                ]}
                placeholder="Enter your email"
                placeholderTextColor={themeColors.mutedText || themeColors.secondaryText}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.foreground }]}>
                Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.card,
                    color: themeColors.foreground,
                    borderColor: themeColors.border,
                  },
                ]}
                placeholder="Enter your password"
                placeholderTextColor={themeColors.mutedText || themeColors.secondaryText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                editable={!isSubmitting}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.ptoGreen },
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Sign In / Sign Up */}
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                console.log('User toggled to', isSignUp ? 'Sign In' : 'Sign Up');
                setIsSignUp(!isSignUp);
              }}
              disabled={isSubmitting}
            >
              <Text style={[styles.toggleButtonText, { color: themeColors.mutedText || themeColors.secondaryText }]}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Text style={{ color: colors.ptoGreen, fontWeight: typography.weights.medium }}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: typography.weights.medium,
  },
  input: {
    height: spacing.buttonHeight,
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  submitButton: {
    height: spacing.buttonHeight,
    borderRadius: spacing.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: typography.weights.medium,
  },
  toggleButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 14,
  },
});
