
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { colors, typography, spacing, commonStyles } from '@/styles/commonStyles';
import * as WebBrowser from 'expo-web-browser';

export default function AccountScreen() {
  const { effectiveTheme, themeMode, language, setThemeMode, setLanguage } = useTheme();
  const { profile, signOut, loading: profileLoading } = useSupabase();
  const router = useRouter();
  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;

  // Use Supabase profile data
  const userData = {
    name: profile?.name || 'User',
    company: profile?.company || 'Company',
    dateJoined: profile?.created_at 
      ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      : 'N/A',
  };

  const handleThemeChange = async (mode: 'light' | 'dark') => {
    console.log('User changed theme to:', mode);
    await setThemeMode(mode);
  };

  const handleLanguageChange = async (lang: 'en' | 'fr') => {
    console.log('User changed language to:', lang);
    await setLanguage(lang);
  };

  const handleLinkPress = async (url: string, title: string) => {
    console.log('User tapped link:', title, url);
    try {
      // Add ?source=app to all links
      const fullUrl = `https://publictimeoff.com${url}?source=app`;
      await WebBrowser.openBrowserAsync(fullUrl);
    } catch (error) {
      console.error('Error opening browser:', error);
    }
  };

  const handleLogout = () => {
    console.log('User tapped Logout button');
    Alert.alert(
      language === 'en' ? 'Logout' : 'Déconnexion',
      language === 'en'
        ? 'Are you sure you want to logout?'
        : 'Êtes-vous sûr de vouloir vous déconnecter?',
      [
        {
          text: language === 'en' ? 'Cancel' : 'Annuler',
          style: 'cancel',
        },
        {
          text: language === 'en' ? 'Logout' : 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            console.log('User confirmed logout');
            try {
              await signOut();
              console.log('User signed out successfully');
              // Optionally navigate to login screen or show a message
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert(
                'Error',
                'Failed to sign out. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const t = {
    en: {
      account: 'Account',
      userInfo: 'User Information',
      name: 'Name',
      company: 'Company',
      dateJoined: 'Date Joined',
      settings: 'Settings',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      language: 'Language',
      english: 'English',
      french: 'French',
      links: 'Links',
      support: 'Support',
      leagueRules: 'League Rules',
      privacyPolicy: 'Privacy Policy',
      logout: 'Logout',
    },
    fr: {
      account: 'Compte',
      userInfo: 'Informations utilisateur',
      name: 'Nom',
      company: 'Entreprise',
      dateJoined: 'Date d\'inscription',
      settings: 'Paramètres',
      theme: 'Thème',
      light: 'Clair',
      dark: 'Sombre',
      language: 'Langue',
      english: 'Anglais',
      french: 'Français',
      links: 'Liens',
      support: 'Support',
      leagueRules: 'Règles de la ligue',
      privacyPolicy: 'Politique de confidentialité',
      logout: 'Déconnexion',
    },
  };

  const strings = t[language];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: themeColors.foreground }]}>
            {strings.account}
          </Text>
        </View>

        {/* User Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.foreground }]}>
            {strings.userInfo}
          </Text>
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: effectiveTheme === 'dark' ? themeColors.secondaryText : themeColors.foreground }]}>
                {strings.name}
              </Text>
              <Text style={[styles.infoValue, { color: themeColors.foreground }]}>
                {userData.name}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: effectiveTheme === 'dark' ? themeColors.secondaryText : themeColors.foreground }]}>
                {strings.company}
              </Text>
              <Text style={[styles.infoValue, { color: themeColors.foreground }]}>
                {userData.company}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: effectiveTheme === 'dark' ? themeColors.secondaryText : themeColors.foreground }]}>
                {strings.dateJoined}
              </Text>
              <Text style={[styles.infoValue, { color: themeColors.foreground }]}>
                {userData.dateJoined}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.foreground }]}>
            {strings.settings}
          </Text>

          {/* Theme Toggle - Only Light and Dark */}
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.settingLabel, { color: themeColors.foreground }]}>
              {strings.theme}
            </Text>
            <View style={styles.toggleGroup}>
              {(['light', 'dark'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.toggleButton,
                    themeMode === mode && {
                      backgroundColor: colors.ptoGreen,
                    },
                    { borderColor: themeColors.border },
                  ]}
                  onPress={() => handleThemeChange(mode)}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      {
                        color:
                          themeMode === mode
                            ? '#FFFFFF'
                            : themeColors.foreground,
                      },
                    ]}
                  >
                    {strings[mode]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Language Toggle */}
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.settingLabel, { color: themeColors.foreground }]}>
              {strings.language}
            </Text>
            <View style={styles.toggleGroup}>
              {(['en', 'fr'] as const).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.toggleButton,
                    language === lang && {
                      backgroundColor: colors.ptoGreen,
                    },
                    { borderColor: themeColors.border },
                  ]}
                  onPress={() => handleLanguageChange(lang)}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      {
                        color:
                          language === lang
                            ? '#FFFFFF'
                            : themeColors.foreground,
                      },
                    ]}
                  >
                    {lang === 'en' ? strings.english : strings.french}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.foreground }]}>
            {strings.links}
          </Text>
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => handleLinkPress('/support', strings.support)}
            >
              <Text style={[styles.linkText, { color: colors.ptoGreen }]}>
                {strings.support}
              </Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => handleLinkPress('/league-rules', strings.leagueRules)}
            >
              <Text style={[styles.linkText, { color: colors.ptoGreen }]}>
                {strings.leagueRules}
              </Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => handleLinkPress('/privacy-policy', strings.privacyPolicy)}
            >
              <Text style={[styles.linkText, { color: colors.ptoGreen }]}>
                {strings.privacyPolicy}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              commonStyles.button,
              { backgroundColor: themeColors.destructive },
            ]}
            onPress={handleLogout}
          >
            <Text style={commonStyles.buttonText}>{strings.logout}</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 40 }} />
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  header: {
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    marginBottom: 12,
  },
  card: {
    borderRadius: spacing.borderRadius,
    padding: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
  },
  infoValue: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  settingLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    marginBottom: 12,
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    height: spacing.buttonHeight,
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
  },
  linkRow: {
    paddingVertical: 12,
  },
  linkText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
  },
});
