
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationCard from '@/components/NotificationCard';
import { IconSymbol } from '@/components/IconSymbol';

export default function NotificationsScreen() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const { notifications, loading, refreshNotifications, markAsRead, unreadCount } = useNotifications();
  const isDark = effectiveTheme === 'dark';

  useEffect(() => {
    console.log('NotificationsScreen: Screen mounted, fetching notifications');
    refreshNotifications();
  }, [refreshNotifications]);

  const handleDismiss = (notificationId: string) => {
    console.log('NotificationsScreen: Dismissing notification:', notificationId);
    // In a real app, you might want to add a "dismiss" endpoint to hide notifications
    // For now, we just mark it as read
    markAsRead(notificationId);
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#2A2828' : '#F3F4F6' },
      ]}
      edges={['top']}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerStyle: {
            backgroundColor: isDark ? '#2A2828' : '#FFFFFF',
          },
          headerTintColor: isDark ? '#F8F8F8' : '#171A1D',
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                console.log('NotificationsScreen: Back button pressed');
                router.back();
              }}
              style={styles.backButton}
            >
              <IconSymbol
                ios_icon_name="chevron.left"
                android_material_icon_name="arrow-back"
                size={24}
                color={isDark ? '#F8F8F8' : '#171A1D'}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshNotifications}
            tintColor={isDark ? '#F8F8F8' : '#171A1D'}
          />
        }
      >
        {/* Header with unread count */}
        <View style={styles.headerSection}>
          <Text
            style={[
              styles.headerTitle,
              { color: isDark ? '#F8F8F8' : '#171A1D' },
            ]}
          >
            All Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {/* Loading state */}
        {loading && notifications.length === 0 && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#46A758" />
            <Text
              style={[
                styles.loadingText,
                { color: isDark ? '#CFCBC1' : '#6B7280' },
              ]}
            >
              Loading notifications...
            </Text>
          </View>
        )}

        {/* Empty state */}
        {!loading && notifications.length === 0 && (
          <View style={styles.centerContent}>
            <IconSymbol
              ios_icon_name="bell.slash"
              android_material_icon_name="notifications-off"
              size={64}
              color="#6B7280"
            />
            <Text
              style={[
                styles.emptyTitle,
                { color: isDark ? '#F8F8F8' : '#171A1D' },
              ]}
            >
              No notifications yet
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: isDark ? '#CFCBC1' : '#6B7280' },
              ]}
            >
              You&apos;ll see updates about races, rankings, and more here
            </Text>
          </View>
        )}

        {/* Notifications list */}
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            id={notification.id}
            type={notification.type}
            title={notification.title}
            body={notification.body}
            actionLabel={notification.actionLabel}
            actionUrl={notification.actionUrl}
            read={notification.read}
            createdAt={notification.createdAt}
            onDismiss={() => handleDismiss(notification.id)}
            onMarkAsRead={() => markAsRead(notification.id)}
          />
        ))}

        {/* Bottom spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#46A758',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
