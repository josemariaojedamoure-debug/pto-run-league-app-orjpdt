
import React, { useState, useRef, useEffect } from 'react';
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
import { IconSymbol } from '@/components/IconSymbol';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { colors, typography, spacing, commonStyles } from '@/styles/commonStyles';
import * as WebBrowser from 'expo-web-browser';
import { WebView } from 'react-native-webview';

const BASE_URL = 'https://publictimeoff.com';

export default function AccountScreen() {
  const { unreadCount } = useNotifications();
  const { theme, setTheme, language, setLanguage, effectiveTheme } = useTheme();
  const router = useRouter();
  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [dateJoined, setDateJoined] = useState('');
  const webViewRef = useRef<WebView>(null);

  console.log('AccountScreen - Theme:', effectiveTheme, 'Language:', language);

  // Request user info from WebView on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (webViewRef.current) {
        console.log('AccountScreen: Requesting user info from WebView');
        const script = `
          (function() {
            try {
              // Try to get user info from the web app
              if (window.ReactNativeWebView) {
                // Check if user data is available
                const userDataStr = localStorage.getItem('user_data');
                if (userDataStr) {
                  const userData = JSON.parse(userDataStr);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'USER_INFO',
                    data: userData
                  }));
                }
              }
            } catch (e) {
              console.error('Error getting user info:', e);
            }
          })();
          true;
        `;
        webViewRef.current.injectJavaScript(script);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleThemeChange = (mode: 'light' | 'dark') => {
    console.log('User changed theme to:', mode);
    setTheme(mode);
  };

  const handleLanguageChange = (lang: 'en' | 'fr') => {
    console.log('User changed language to:', lang);
    setLanguage(lang);
  };

  const handleLinkPress = async (url: string, title: string) => {
    console.log('User tapped link:', title, 'URL:', url);
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: colors.ptoGreen,
      });
    } catch (error) {
      console.error('Error opening browser:', error);
      Alert.alert('Error', 'Could not open link');
    }
  };

  const handleLogout = () => {
    console.log('User tapped logout button');
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('User cancelled logout'),
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            console.log('User confirmed logout, signing out');
            
            // Clear WebView cookies and redirect to auth
            if (webViewRef.current) {
              const script = `
                (function() {
                  try {
                    // Clear localStorage
                    localStorage.clear();
                    
                    // Redirect to logout endpoint
                    window.location.href = '${BASE_URL}/auth/logout?source=app';
                  } catch (e) {
                    console.error('Error during logout:', e);
                  }
                })();
                true;
              `;
              webViewRef.current.injectJavaScript(script);
            }
            
            // Redirect to auth screen
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('AccountScreen: Received message from WebView:', message.type);

      if (message.type === 'USER_INFO' && message.data) {
        console.log('AccountScreen: Received user info:', message.data);
        if (message.data.name) setUserName(message.data.name);
        if (message.data.email) setUserEmail(message.data.email);
        if (message.data.created_at) {
          const date = new Date(message.data.created_at);
          setDateJoined(date.toLocaleDateString());
        }
      }
    } catch (error) {
      console.error('AccountScreen: Error handling WebView message:', error);
    }
  };

  const themeText = theme === 'system' ? 'System Default' : theme === 'dark' ? 'Dark' : 'Light';
  const languageText = language === 'en' ? 'English' : 'Français';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      {/* Hidden WebView to communicate with web app */}
      <View style={{ height: 0, width: 0, overflow: 'hidden' }}>
        <WebView
          ref={webViewRef}
          source={{ uri: `${BASE_URL}/${language}/participant?source=app` }}
          onMessage={handleWebViewMessage}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* User Info Section */}
        <View style={[styles.section, { backgroundColor: themeColors.cardBackground }]}>
          <View style={styles.userInfoContainer}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.ptoGreen }]}>
              <Text style={styles.avatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: themeColors.text }]}>
                {userName}
              </Text>
              {userEmail ? (
                <Text style={[styles.userEmail, { color: themeColors.mutedText }]}>
                  {userEmail}
                </Text>
              ) : null}
              {dateJoined ? (
                <Text style={[styles.dateJoined, { color: themeColors.mutedText }]}>
                  Joined
                </Text>
              ) : null}
              {dateJoined ? (
                <Text style={[styles.dateJoined, { color: themeColors.mutedText }]}>
                  {dateJoined}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Notifications */}
        <TouchableOpacity
          style={[styles.section, styles.notificationSection, { backgroundColor: themeColors.cardBackground }]}
          onPress={() => {
            console.log('User tapped notifications');
            router.push('/notifications');
          }}
        >
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="bell.fill"
              android_material_icon_name="notifications"
              size={24}
              color={colors.ptoGreen}
            />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Notifications
            </Text>
          </View>
          <View style={styles.notificationBadgeContainer}>
            {unreadCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount}
                </Text>
              </View>
            ) : null}
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={themeColors.mutedText}
            />
          </View>
        </TouchableOpacity>

        {/* Settings Section */}
        <View style={[styles.section, { backgroundColor: themeColors.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="gear"
              android_material_icon_name="settings"
              size={24}
              color={colors.ptoGreen}
            />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Settings
            </Text>
          </View>

          {/* Theme Toggle */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: themeColors.text }]}>
              Theme
            </Text>
            <View style={styles.themeButtons}>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  theme === 'light' && styles.themeButtonActive,
                  { borderColor: themeColors.border },
                ]}
                onPress={() => handleThemeChange('light')}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    { color: themeColors.text },
                    theme === 'light' && styles.themeButtonTextActive,
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  theme === 'dark' && styles.themeButtonActive,
                  { borderColor: themeColors.border },
                ]}
                onPress={() => handleThemeChange('dark')}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    { color: themeColors.text },
                    theme === 'dark' && styles.themeButtonTextActive,
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Language Toggle */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: themeColors.text }]}>
              Language
            </Text>
            <View style={styles.themeButtons}>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  language === 'en' && styles.themeButtonActive,
                  { borderColor: themeColors.border },
                ]}
                onPress={() => handleLanguageChange('en')}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    { color: themeColors.text },
                    language === 'en' && styles.themeButtonTextActive,
                  ]}
                >
                  English
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  language === 'fr' && styles.themeButtonActive,
                  { borderColor: themeColors.border },
                ]}
                onPress={() => handleLanguageChange('fr')}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    { color: themeColors.text },
                    language === 'fr' && styles.themeButtonTextActive,
                  ]}
                >
                  Français
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Links Section */}
        <View style={[styles.section, { backgroundColor: themeColors.cardBackground }]}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => handleLinkPress(`${BASE_URL}/support`, 'Support')}
          >
            <Text style={[styles.linkText, { color: themeColors.text }]}>
              Support
            </Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={themeColors.mutedText}
            />
          </TouchableOpacity>

          <View style={[styles.linkDivider, { backgroundColor: themeColors.border }]} />

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => handleLinkPress(`${BASE_URL}/league-rules`, 'League Rules')}
          >
            <Text style={[styles.linkText, { color: themeColors.text }]}>
              League Rules
            </Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={themeColors.mutedText}
            />
          </TouchableOpacity>

          <View style={[styles.linkDivider, { backgroundColor: themeColors.border }]} />

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => handleLinkPress(`${BASE_URL}/privacy-policy`, 'Privacy Policy')}
          >
            <Text style={[styles.linkText, { color: themeColors.text }]}>
              Privacy Policy
            </Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={themeColors.mutedText}
            />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: themeColors.cardBackground }]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* Version Info */}
        <Text style={[styles.versionText, { color: themeColors.mutedText }]}>
          Version 1.0.0
        </Text>
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
    padding: spacing.md,
    paddingBottom: 100, // Extra padding for tab bar
  },
  section: {
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...commonStyles.cardShadow,
  },
  notificationSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: typography.bold,
    marginLeft: spacing.sm,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontFamily: typography.bold,
    color: '#FFFFFF',
  },
  userDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontFamily: typography.bold,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: typography.regular,
    marginBottom: 4,
  },
  dateJoined: {
    fontSize: 12,
    fontFamily: typography.regular,
  },
  notificationBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBadge: {
    backgroundColor: colors.ptoGreen,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    paddingHorizontal: 8,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: typography.bold,
  },
  settingRow: {
    marginBottom: spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: typography.medium,
    marginBottom: spacing.sm,
  },
  themeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  themeButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeButtonActive: {
    backgroundColor: colors.ptoGreen,
    borderColor: colors.ptoGreen,
  },
  themeButtonText: {
    fontSize: 14,
    fontFamily: typography.medium,
  },
  themeButtonTextActive: {
    color: '#FFFFFF',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  linkText: {
    fontSize: 16,
    fontFamily: typography.regular,
  },
  linkDivider: {
    height: 1,
  },
  logoutButton: {
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...commonStyles.cardShadow,
  },
  logoutButtonText: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: colors.destructive,
  },
  versionText: {
    fontSize: 12,
    fontFamily: typography.regular,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
