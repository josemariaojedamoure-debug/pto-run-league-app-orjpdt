
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useSupabase } from './SupabaseContext';

interface NotificationData {
  id: string;
  type: 'Race Reminder' | 'Ranking Update' | 'EQ Score Update' | 'General';
  title: string;
  body: string;
  actionLabel?: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  expoPushToken: string | null;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useSupabase();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Define refreshNotifications BEFORE it's used in useEffect
  const refreshNotifications = useCallback(async () => {
    if (!user) {
      console.log('NotificationProvider: No user, skipping notification fetch');
      return;
    }

    setLoading(true);
    try {
      console.log('NotificationProvider: Fetching notifications for user:', user.id);
      const backendUrl = Constants.expoConfig?.extra?.backendUrl;
      
      const response = await fetch(`${backendUrl}/api/notifications?userId=${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('NotificationProvider: Failed to fetch notifications');
        return;
      }

      const data = await response.json();
      console.log('NotificationProvider: Fetched notifications:', data.length);
      setNotifications(data);
    } catch (error) {
      console.error('NotificationProvider: Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const registerTokenWithBackend = useCallback(async (token: string, userId: string) => {
    try {
      console.log('NotificationProvider: Registering push token with backend');
      const backendUrl = Constants.expoConfig?.extra?.backendUrl;
      
      const response = await fetch(`${backendUrl}/api/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          expoPushToken: token,
          deviceType: Platform.OS,
        }),
      });

      if (!response.ok) {
        console.error('NotificationProvider: Failed to register token with backend');
      } else {
        console.log('NotificationProvider: Token registered successfully');
      }
    } catch (error) {
      console.error('NotificationProvider: Error registering token:', error);
    }
  }, []);

  useEffect(() => {
    console.log('NotificationProvider: Initializing');
    
    const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
      let token;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#40A060',
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('NotificationProvider: Permission not granted for push notifications');
          return;
        }
        
        try {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId;
          token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
          console.log('NotificationProvider: Expo push token:', token);
        } catch (error) {
          console.error('NotificationProvider: Error getting push token:', error);
        }
      } else {
        console.log('NotificationProvider: Must use physical device for push notifications');
      }

      return token;
    };

    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      console.log('NotificationProvider: Push token obtained:', token);
      setExpoPushToken(token || null);
      
      // Register token with backend if user is logged in
      if (token && user) {
        registerTokenWithBackend(token, user.id);
      }
    });

    // Listen for notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('NotificationProvider: Notification received in foreground:', notification);
      // Refresh notifications list
      if (user) {
        refreshNotifications();
      }
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('NotificationProvider: User interacted with notification:', response);
      const data = response.notification.request.content.data;
      
      // Handle navigation based on actionUrl if present
      if (data?.actionUrl) {
        console.log('NotificationProvider: Should navigate to:', data.actionUrl);
        // Navigation will be handled by the app's navigation system
      }
    });

    return () => {
      console.log('NotificationProvider: Cleaning up listeners');
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user, refreshNotifications, registerTokenWithBackend]);

  // Fetch notifications when user logs in
  useEffect(() => {
    if (user) {
      console.log('NotificationProvider: User logged in, fetching notifications');
      refreshNotifications();
      
      // Re-register push token with backend
      if (expoPushToken) {
        registerTokenWithBackend(expoPushToken, user.id);
      }
    } else {
      console.log('NotificationProvider: User logged out, clearing notifications');
      setNotifications([]);
    }
  }, [user, expoPushToken, refreshNotifications, registerTokenWithBackend]);

  const markAsRead = async (notificationId: string) => {
    try {
      console.log('NotificationProvider: Marking notification as read:', notificationId);
      const backendUrl = Constants.expoConfig?.extra?.backendUrl;
      
      const response = await fetch(`${backendUrl}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        console.error('NotificationProvider: Failed to mark notification as read');
        return;
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      console.log('NotificationProvider: Notification marked as read');
    } catch (error) {
      console.error('NotificationProvider: Error marking notification as read:', error);
    }
  };

  const clearAll = () => {
    console.log('NotificationProvider: Clearing all notifications from UI');
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        expoPushToken,
        loading,
        refreshNotifications,
        markAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
