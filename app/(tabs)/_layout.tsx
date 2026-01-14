
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { colors, typography, spacing } from '@/styles/commonStyles';

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { effectiveTheme } = useTheme();

  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;

  const tabs = [
    { name: 'Dashboard', route: '/(tabs)/dashboard' },
    { name: 'Rankings', route: '/(tabs)/rankings' },
    { name: 'Account', route: '/(tabs)/account' },
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

      {/* Custom Bottom Tab Bar - Pill Style with White Bubble Indicator */}
      <SafeAreaView
        edges={['bottom']}
        style={[
          styles.tabBarContainer,
          { backgroundColor: themeColors.background },
        ]}
      >
        <View style={[
          styles.tabBar,
          { 
            backgroundColor: effectiveTheme === 'dark' ? '#3E3C3C' : '#F3F4F6',
          },
        ]}>
          {tabs.map((tab) => {
            const active = isActive(tab.route);
            return (
              <TouchableOpacity
                key={tab.name}
                style={[
                  styles.tabButton,
                  active && styles.activeTabButton,
                ]}
                onPress={() => {
                  console.log('User tapped', tab.name, 'tab');
                  router.push(tab.route as any);
                }}
              >
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
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tabBar: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica Neue',
  },
});
