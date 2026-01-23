
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
import * as WebBrowser from 'expo-web-browser';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { colors, typography, spacing, commonStyles } from '@/styles/commonStyles';

export default function AccountScreen() {
  const router = useRouter();
  const { effectiveTheme, setThemeMode, themeMode, language, setLanguage } = useTheme();
  const { user, profile, signOut, loading } = useSupabase();
  const { notifications, unreadCount } = useNotifications();
  const [signingOut, setSigningOut] = useState(false);

  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;

  const handleThemeChange = (mode: 'light' | 'dark') => {
    console.log('User changed theme to:', mode);
    setThemeMode(mode);
  };

  const handleLanguageChange = (lang: 'en' | 'fr') => {
    console.log('User changed language to:', lang);
    setLanguage(lang);
  };

  const handleLinkPress = async (url: string, title: string) => {
    console.log('User tapped link:', title, url);
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.error('Error opening browser:', error);
      Alert.alert('Error', 'Could not open link');
    }
  };

  const handleLogout = () => {
    console.log('User tapped logout button');
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('User cancelled logout'),
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            console.log('User confirmed logout');
            setSigningOut(true);
            try {
              await signOut();
              console.log('Logout successful, navigating to auth screen');
              router.replace('/auth');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setSigningOut(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Get user display info - prefer profile, fallback to auth user metadata
  const userName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = profile?.email || user?.email || '';
  const userCompany = profile?.company || user?.user_metadata?.company || '';
  const dateJoined = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : user?.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Account
          </Text>
          <TouchableOpacity
            onPress={() => {
              console.log('User tapped notifications icon');
              router.push('/notifications');
            }}
            style={styles.notificationButton}
          >
            <IconSymbol
              ios_icon_name="bell.fill"
              android_material_icon_name="notifications"
              size={24}
              color={themeColors.text}
            />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.ptoGreen }]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* User Info Section */}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <View style={styles.userInfoContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.ptoGreen }]}>
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: themeColors.text }]}>
                {userName}
              </Text>
              {userEmail && (
                <Text style={[styles.userEmail, { color: themeColors.mutedText }]}>
                  {userEmail}
                </Text>
              )}
              {userCompany && (
                <Text style={[styles.userCompany, { color: themeColors.mutedText }]}>
                  {userCompany}
                </Text>
              )}
              <Text style={[styles.dateJoined, { color: themeColors.mutedText }]}>
                Joined {dateJoined}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Settings
          </Text>

          {/* Theme Toggle */}
          <View style={[styles.settingCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.settingLabel, { color: themeColors.text }]}>
              Theme
            </Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  themeMode === 'light' && styles.toggleButtonActive,
                  themeMode === 'light' && { backgroundColor: colors.ptoGreen },
                ]}
                onPress={() => handleThemeChange('light')}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    { color: themeMode === 'light' ? '#FFFFFF' : themeColors.text },
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  themeMode === 'dark' && styles.toggleButtonActive,
                  themeMode === 'dark' && { backgroundColor: colors.ptoGreen },
                ]}
                onPress={() => handleThemeChange('dark')}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    { color: themeMode === 'dark' ? '#FFFFFF' : themeColors.text },
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Language Toggle */}
          <View style={[styles.settingCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.settingLabel, { color: themeColors.text }]}>
              Language
            </Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  language === 'en' && styles.toggleButtonActive,
                  language === 'en' && { backgroundColor: colors.ptoGreen },
                ]}
                onPress={() => handleLanguageChange('en')}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    { color: language === 'en' ? '#FFFFFF' : themeColors.text },
                  ]}
                >
                  English
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  language === 'fr' && styles.toggleButtonActive,
                  language === 'fr' && { backgroundColor: colors.ptoGreen },
                ]}
                onPress={() => handleLanguageChange('fr')}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    { color: language === 'fr' ? '#FFFFFF' : themeColors.text },
                  ]}
                >
                  French
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Links Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Information
          </Text>

          <TouchableOpacity
            style={[styles.linkCard, { backgroundColor: themeColors.card }]}
            onPress={() => handleLinkPress('https://publictimeoff.com/support', 'Support')}
          >
            <IconSymbol
              ios_icon_name="questionmark.circle"
              android_material_icon_name="help"
              size={24}
              color={themeColors.text}
            />
            <Text style={[styles.linkText, { color: themeColors.text }]}>
              Support
            </Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={themeColors.mutedText}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkCard, { backgroundColor: themeColors.card }]}
            onPress={() => handleLinkPress('https://publictimeoff.com/league-rules', 'League Rules')}
          >
            <IconSymbol
              ios_icon_name="doc.text"
              android_material_icon_name="description"
              size={24}
              color={themeColors.text}
            />
            <Text style={[styles.linkText, { color: themeColors.text }]}>
              League Rules
            </Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={themeColors.mutedText}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkCard, { backgroundColor: themeColors.card }]}
            onPress={() => handleLinkPress('https://publictimeoff.com/privacy-policy', 'Privacy Policy')}
          >
            <IconSymbol
              ios_icon_name="lock.shield"
              android_material_icon_name="lock"
              size={24}
              color={themeColors.text}
            />
            <Text style={[styles.linkText, { color: themeColors.text }]}>
              Privacy Policy
            </Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={themeColors.mutedText}
            />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: themeColors.destructive }]}
          onPress={handleLogout}
          disabled={signingOut}
        >
          <Text style={styles.logoutButtonText}>
            {signingOut ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>

        {/* Bottom Padding for Tab Bar */}
        <View style={{ height: 100 }} />
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: typography.fontFamily,
  },
  notificationButton: {
    position: 'relative',
    padding: spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: typography.fontFamily,
  },
  section: {
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: typography.fontFamily,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: typography.fontFamily,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
    fontFamily: typography.fontFamily,
  },
  userCompany: {
    fontSize: 14,
    marginBottom: 2,
    fontFamily: typography.fontFamily,
  },
  dateJoined: {
    fontSize: 12,
    fontFamily: typography.fontFamily,
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
    fontFamily: typography.fontFamily,
  },
  settingCard: {
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.md,
    fontFamily: typography.fontFamily,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleButtonActive: {
    borderWidth: 0,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: typography.fontFamily,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: spacing.md,
    fontFamily: typography.fontFamily,
  },
  logoutButton: {
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: typography.fontFamily,
  },
});
