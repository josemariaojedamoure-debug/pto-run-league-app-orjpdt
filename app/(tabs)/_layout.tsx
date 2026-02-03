
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { colors, typography, spacing } from '@/styles/commonStyles';

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { effectiveTheme, language } = useTheme();

  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;

  // Tab labels with translations
  const tabs = [
    { 
      name: language === 'fr' ? 'Tableau de bord' : 'Dashboard', 
      route: '/(tabs)/dashboard' 
    },
    { 
      name: language === 'fr' ? 'Classements' : 'Rankings', 
      route: '/(tabs)/rankings' 
    },
    { 
      name: language === 'fr' ? 'Compte' : 'Account', 
      route: '/(tabs)/account' 
    },
  ];

  const isActive = (route: string) => {
    return pathname === route || pathname.startsWith(route);
  };

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="rankings" />
        <Stack.Screen name="account" />
      </Stack>

      {/* Custom Bottom Tab Bar - Transparent with Grey Background and Theme-Aware Bubble */}
      <SafeAreaView
        edges={['bottom']}
        style={styles.tabBarContainer}
      >
        <View style={[
          styles.tabBar,
          { 
            backgroundColor: effectiveTheme === 'dark' ? 'rgba(62, 60, 60, 0.95)' : 'rgba(243, 244, 246, 0.95)',
          },
        ]}>
          {tabs.map((tab) => {
            const active = isActive(tab.route);
            return (
              <TouchableOpacity
                key={tab.route}
                style={styles.tabButtonContainer}
                onPress={() => {
                  console.log('User tapped', tab.name, 'tab');
                  router.push(tab.route as any);
                }}
              >
                {/* Theme-aware bubble - white in light mode, dark card color in dark mode */}
                {active && (
                  <View style={[
                    styles.activeBubble,
                    {
                      backgroundColor: effectiveTheme === 'dark' ? colors.dark.card : '#FFFFFF',
                    }
                  ]} />
                )}
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: active
                        ? colors.ptoGreen
                        : (themeColors.mutedText || themeColors.secondaryText),
                      fontWeight: active ? '600' : '400',
                    },
                  ]}
                >
                  {tab.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  tabBar: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    padding: 4,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  tabButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeBubble: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 8,
    right: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica Neue',
    zIndex: 2,
  },
});
