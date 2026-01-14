
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from './IconSymbol';
import Animated, { FadeInRight, FadeOutRight } from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';

interface NotificationCardProps {
  id: string;
  type: 'Race Reminder' | 'Ranking Update' | 'EQ Score Update' | 'General';
  title: string;
  body: string;
  actionLabel?: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
  onDismiss: () => void;
  onMarkAsRead: () => void;
}

const getIconForType = (type: string): { ios: string; android: string } => {
  switch (type) {
    case 'Race Reminder':
      return { ios: 'calendar', android: 'event' };
    case 'Ranking Update':
      return { ios: 'trophy.fill', android: 'emoji-events' };
    case 'EQ Score Update':
      return { ios: 'chart.line.uptrend.xyaxis', android: 'trending-up' };
    default:
      return { ios: 'bell.fill', android: 'notifications' };
  }
};

export default function NotificationCard({
  id,
  type,
  title,
  body,
  actionLabel,
  actionUrl,
  read,
  createdAt,
  onDismiss,
  onMarkAsRead,
}: NotificationCardProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const icon = getIconForType(type);

  const handleActionPress = async () => {
    console.log('NotificationCard: Action button pressed for notification:', id);
    
    // Mark as read
    if (!read) {
      onMarkAsRead();
    }

    // Navigate to action URL if present
    if (actionUrl) {
      console.log('NotificationCard: Opening URL:', actionUrl);
      try {
        await WebBrowser.openBrowserAsync(actionUrl);
      } catch (error) {
        console.error('NotificationCard: Error opening URL:', error);
      }
    }
  };

  const handleDismiss = () => {
    console.log('NotificationCard: Dismissing notification:', id);
    if (!read) {
      onMarkAsRead();
    }
    onDismiss();
  };

  return (
    <Animated.View
      entering={FadeInRight.duration(250).easing((t) => {
        // cubic-bezier(0.4, 0, 0.2, 1)
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      })}
      exiting={FadeOutRight.duration(250).easing((t) => {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      })}
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#363333' : '#FFFFFF',
          borderColor: isDark ? '#424242' : 'hsl(220, 13%, 88%)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 8,
        },
      ]}
    >
      {/* Header with icon, title, and close button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconSymbol
            ios_icon_name={icon.ios}
            android_material_icon_name={icon.android}
            size={20}
            color="#6B7280"
          />
          <Text
            style={[
              styles.title,
              {
                color: isDark ? '#F8F8F8' : '#272A2E',
              },
            ]}
          >
            {title}
          </Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconSymbol
            ios_icon_name="xmark"
            android_material_icon_name="close"
            size={18}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>

      {/* Body text */}
      <Text
        style={[
          styles.body,
          {
            color: isDark ? '#CFCBC1' : '#272A2E',
            opacity: 0.9,
          },
        ]}
      >
        {body}
      </Text>

      {/* Action button (if present) */}
      {actionLabel && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleActionPress}
          activeOpacity={0.9}
        >
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}

      {/* Unread indicator */}
      {!read && <View style={styles.unreadIndicator} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.02,
    flex: 1,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#46A758',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    minHeight: 38,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#46A758',
  },
});
