
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { effectiveTheme } = useTheme();

  const themeColors = effectiveTheme === 'dark' ? colors.dark : colors.light;

  const tabs = [
    { name: 'Dashboard', route: '/(tabs)/dashboard', iosIcon: 'house.fill', androidIcon: 'home' },
    { name: 'Rankings', route: '/(tabs)/rankings', iosIcon: 'chart.bar.fill', androidIcon: 'leaderboard' },
    { name: 'Account', route: '/(tabs)/account', iosIcon: 'person.fill', androidIcon: 'person' },
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

      {/* Custom Bottom Tab Bar - Transparent with Grey Background and White Bubble */}
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
                <IconSymbol
                  ios_icon_name={tab.iosIcon}
                  android_material_icon_name={tab.androidIcon}
                  size={24}
                  color={active ? colors.ptoGreen : (themeColors.mutedText || themeColors.secondaryText)}
                />
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
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica Neue',
    marginTop: 2,
  },
});
