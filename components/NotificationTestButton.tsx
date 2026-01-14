
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNotifications } from '@/contexts/NotificationContext';

// This is a test component to demonstrate notifications
// Remove this in production
export default function NotificationTestButton() {
  const { refreshNotifications } = useNotifications();

  const handleTest = () => {
    console.log('NotificationTestButton: Test button pressed');
    // In production, notifications will be sent from the backend
    // This is just to trigger a refresh to check for new notifications
    refreshNotifications();
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleTest}>
      <Text style={styles.buttonText}>Refresh Notifications (Test)</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#46A758',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
