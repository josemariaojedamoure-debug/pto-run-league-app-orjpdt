
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { colors, typography, spacing } from '@/styles/commonStyles';
import * as WebBrowser from 'expo-web-browser';
import { WebView } from 'react-native-webview';

const BASE_URL = 'https://publictimeoff.com';

export default function AccountScreen() {
  const { unreadCount } = useNotifications();
  const { theme, setTheme, language, setLanguage, effectiveTheme } = useTheme();
  const router = useRouter();
  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;
  
  // User profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [dateJoined, setDateJoined] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const webViewRef = useRef<WebView>(null);

  console.log('AccountScreen - Theme:', theme, 'Effective:', effectiveTheme, 'Language:', language);

  // Fetch user profile from backend API
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      console.log('AccountScreen: Fetching user profile from backend API');
      setIsLoadingProfile(true);

      // TODO: Backend Integration - GET /api/user/profile to fetch { firstName, lastName, company, email, createdAt }
      // For now, we'll try to get user info from the WebView as fallback
      const timer = setTimeout(() => {
        if (webViewRef.current) {
          console.log('AccountScreen: Requesting user info from WebView as fallback');
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
        setIsLoadingProfile(false);
      }, 2000);

      return () => clearTimeout(timer);
    } catch (error) {
      console.error('AccountScreen: Error fetching user profile:', error);
      setIsLoadingProfile(false);
    }
  };

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
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
    }
  };

  const handleLogout = () => {
    console.log('User tapped logout button');
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    console.log('User confirmed logout, signing out');
    setShowLogoutModal(false);
    
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
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('AccountScreen: Received message from WebView:', message.type);

      if (message.type === 'USER_INFO' && message.data) {
        console.log('AccountScreen: Received user info:', message.data);
        if (message.data.first_name || message.data.firstName) {
          setFirstName(message.data.first_name || message.data.firstName);
        }
        if (message.data.last_name || message.data.lastName) {
          setLastName(message.data.last_name || message.data.lastName);
        }
        if (message.data.company) setCompany(message.data.company);
        if (message.data.email) setUserEmail(message.data.email);
        if (message.data.created_at || message.data.createdAt) {
          const dateStr = message.data.created_at || message.data.createdAt;
          const date = new Date(dateStr);
          setDateJoined(date.toLocaleDateString());
        }
        setIsLoadingProfile(false);
      }
    } catch (error) {
      console.error('AccountScreen: Error handling WebView message:', error);
      setIsLoadingProfile(false);
    }
  };

  // Calculate display name
  const displayName = firstName && lastName 
    ? `${firstName} ${lastName}` 
    : firstName || lastName || 'User';
  
  const initials = firstName && lastName
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    : displayName.charAt(0).toUpperCase();

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

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: themeColors.cardBackground || themeColors.card }]}>
          {isLoadingProfile ? (
            <React.Fragment>
              <View style={[styles.avatarCircle, { backgroundColor: colors.ptoGreen + '40' }]}>
                <ActivityIndicator size="large" color={colors.ptoGreen} />
              </View>
              <Text style={[styles.displayName, { color: themeColors.foreground || themeColors.text, opacity: 0.5 }]}>
                Loading...
              </Text>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <View style={[styles.avatarCircle, { backgroundColor: colors.ptoGreen }]}>
                <Text style={styles.avatarText}>
                  {initials}
                </Text>
              </View>
              <Text style={[styles.displayName, { color: themeColors.foreground || themeColors.text }]}>
                {displayName}
              </Text>
              {company ? (
                <Text style={[styles.companyText, { color: themeColors.mutedText }]}>
                  {company}
                </Text>
              ) : null}
              {userEmail ? (
                <Text style={[styles.emailText, { color: themeColors.mutedText }]}>
                  {userEmail}
                </Text>
              ) : null}
            </React.Fragment>
          )}
        </View>

        {/* Notifications */}
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: themeColors.cardBackground || themeColors.card }]}
          onPress={() => {
            console.log('User tapped notifications');
            router.push('/notifications');
          }}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.ptoGreen + '20' }]}>
              <IconSymbol
                ios_icon_name="bell.fill"
                android_material_icon_name="notifications"
                size={20}
                color={colors.ptoGreen}
              />
            </View>
            <Text style={[styles.menuItemText, { color: themeColors.foreground || themeColors.text }]}>
              Notifications
            </Text>
          </View>
          <View style={styles.menuItemRight}>
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
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

        {/* Settings Section Header */}
        <Text style={[styles.sectionHeader, { color: themeColors.mutedText }]}>
          SETTINGS
        </Text>

        {/* Theme Setting */}
        <View style={[styles.settingCard, { backgroundColor: themeColors.cardBackground || themeColors.card }]}>
          <View style={styles.settingHeader}>
            <View style={styles.settingHeaderLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.ptoGreen + '20' }]}>
                <IconSymbol
                  ios_icon_name="moon.fill"
                  android_material_icon_name="brightness-4"
                  size={20}
                  color={colors.ptoGreen}
                />
              </View>
              <Text style={[styles.settingLabel, { color: themeColors.foreground || themeColors.text }]}>
                Theme
              </Text>
            </View>
          </View>
          <View style={styles.optionButtons}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                { borderColor: themeColors.border },
                theme === 'light' && [styles.optionButtonActive, { backgroundColor: colors.ptoGreen }],
              ]}
              onPress={() => handleThemeChange('light')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  { color: themeColors.foreground || themeColors.text },
                  theme === 'light' && styles.optionButtonTextActive,
                ]}
              >
                Light
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                { borderColor: themeColors.border },
                theme === 'dark' && [styles.optionButtonActive, { backgroundColor: colors.ptoGreen }],
              ]}
              onPress={() => handleThemeChange('dark')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  { color: themeColors.foreground || themeColors.text },
                  theme === 'dark' && styles.optionButtonTextActive,
                ]}
              >
                Dark
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                { borderColor: themeColors.border },
                theme === 'system' && [styles.optionButtonActive, { backgroundColor: colors.ptoGreen }],
              ]}
              onPress={() => handleThemeChange('system')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  { color: themeColors.foreground || themeColors.text },
                  theme === 'system' && styles.optionButtonTextActive,
                ]}
              >
                System
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Language Setting */}
        <View style={[styles.settingCard, { backgroundColor: themeColors.cardBackground || themeColors.card }]}>
          <View style={styles.settingHeader}>
            <View style={styles.settingHeaderLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.ptoGreen + '20' }]}>
                <IconSymbol
                  ios_icon_name="globe"
                  android_material_icon_name="language"
                  size={20}
                  color={colors.ptoGreen}
                />
              </View>
              <Text style={[styles.settingLabel, { color: themeColors.foreground || themeColors.text }]}>
                Language
              </Text>
            </View>
          </View>
          <View style={styles.optionButtons}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                { borderColor: themeColors.border },
                language === 'en' && [styles.optionButtonActive, { backgroundColor: colors.ptoGreen }],
              ]}
              onPress={() => handleLanguageChange('en')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  { color: themeColors.foreground || themeColors.text },
                  language === 'en' && styles.optionButtonTextActive,
                ]}
              >
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                { borderColor: themeColors.border },
                language === 'fr' && [styles.optionButtonActive, { backgroundColor: colors.ptoGreen }],
              ]}
              onPress={() => handleLanguageChange('fr')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  { color: themeColors.foreground || themeColors.text },
                  language === 'fr' && styles.optionButtonTextActive,
                ]}
              >
                Français
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Links Section Header */}
        <Text style={[styles.sectionHeader, { color: themeColors.mutedText }]}>
          SUPPORT
        </Text>

        {/* Support Links */}
        <View style={[styles.linksCard, { backgroundColor: themeColors.cardBackground || themeColors.card }]}>
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => handleLinkPress(`${BASE_URL}/support`, 'Support')}
            activeOpacity={0.7}
          >
            <Text style={[styles.linkText, { color: themeColors.foreground || themeColors.text }]}>
              Support
            </Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={themeColors.mutedText}
            />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => handleLinkPress(`${BASE_URL}/league-rules`, 'League Rules')}
            activeOpacity={0.7}
          >
            <Text style={[styles.linkText, { color: themeColors.foreground || themeColors.text }]}>
              League Rules
            </Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={themeColors.mutedText}
            />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => handleLinkPress(`${BASE_URL}/privacy-policy`, 'Privacy Policy')}
            activeOpacity={0.7}
          >
            <Text style={[styles.linkText, { color: themeColors.foreground || themeColors.text }]}>
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
          style={[styles.logoutButton, { backgroundColor: themeColors.cardBackground || themeColors.card }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="arrow.right.square"
            android_material_icon_name="logout"
            size={20}
            color={colors.destructive}
          />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* Version Info */}
        <Text style={[styles.versionText, { color: themeColors.mutedText }]}>
          Version 1.0.0
        </Text>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.cardBackground || themeColors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.foreground || themeColors.text }]}>
              Sign Out
            </Text>
            <Text style={[styles.modalMessage, { color: themeColors.mutedText }]}>
              Are you sure you want to sign out?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { borderColor: themeColors.border }]}
                onPress={() => {
                  console.log('User cancelled logout');
                  setShowLogoutModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: themeColors.foreground || themeColors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm, { backgroundColor: colors.destructive }]}
                onPress={confirmLogout}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  profileHeader: {
    borderRadius: spacing.borderRadius,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 40,
    fontFamily: typography.bold,
    color: '#FFFFFF',
  },
  displayName: {
    fontSize: 28,
    fontFamily: typography.bold,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  companyText: {
    fontSize: 16,
    fontFamily: typography.medium,
    marginBottom: 4,
    opacity: 0.8,
  },
  emailText: {
    fontSize: 14,
    fontFamily: typography.regular,
    opacity: 0.6,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: typography.bold,
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: spacing.borderRadius,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: typography.medium,
  },
  badge: {
    backgroundColor: colors.ptoGreen,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: typography.bold,
  },
  settingCard: {
    borderRadius: spacing.borderRadius,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  settingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: typography.medium,
  },
  optionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionButtonActive: {
    borderColor: colors.ptoGreen,
  },
  optionButtonText: {
    fontSize: 14,
    fontFamily: typography.medium,
  },
  optionButtonTextActive: {
    color: '#FFFFFF',
  },
  linksCard: {
    borderRadius: spacing.borderRadius,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  linkText: {
    fontSize: 16,
    fontFamily: typography.regular,
  },
  divider: {
    height: 1,
    marginLeft: spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: spacing.borderRadius,
    marginBottom: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: typography.bold,
  },
  versionText: {
    fontSize: 12,
    fontFamily: typography.regular,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: spacing.borderRadius,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: typography.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: typography.regular,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonCancel: {
    borderWidth: 1,
  },
  modalButtonConfirm: {
    // backgroundColor set dynamically
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: typography.medium,
  },
  modalButtonTextConfirm: {
    color: '#FFFFFF',
  },
});
