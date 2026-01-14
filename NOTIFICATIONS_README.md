
# PTO League Push Notifications

This document describes the native push notification system implemented for the PTO Corporate Running League mobile app.

## Overview

The notification system allows the app to receive and display push notifications that match the PTO League brand style guide. Notifications are fetched from a backend database and displayed with custom styling.

## Features

- **Native Push Notifications**: Uses Expo's notification system for iOS and Android
- **Custom Styling**: Matches PTO League brand colors and typography
- **Notification Types**: 
  - Race Reminder (Calendar icon)
  - Ranking Update (Trophy icon)
  - EQ Score Update (Trending Up icon)
  - General (Bell icon)
- **Action Buttons**: Optional action buttons that can navigate to specific URLs
- **Unread Badges**: Visual indicators for unread notifications
- **Dark Mode Support**: Fully styled for both light and dark themes
- **Smooth Animations**: Slide-in and fade-out animations

## Architecture

### Frontend Components

1. **NotificationContext** (`contexts/NotificationContext.tsx`)
   - Manages notification state
   - Handles push token registration
   - Fetches notifications from backend
   - Listens for incoming notifications

2. **NotificationCard** (`components/NotificationCard.tsx`)
   - Displays individual notifications
   - Handles dismiss and mark-as-read actions
   - Shows action buttons when present

3. **NotificationsScreen** (`app/notifications.tsx`)
   - Full-screen view of all notifications
   - Pull-to-refresh functionality
   - Empty state handling

### Backend Endpoints

The backend provides the following endpoints:

- `POST /api/notifications/register-token` - Register device push token
  - Body: `{ userId, expoPushToken, deviceType }`
  - Returns: `{ success: true }`

- `GET /api/notifications?userId=x&unreadOnly=true` - Fetch notifications
  - Returns: `[{ id, type, title, body, actionLabel, actionUrl, read, createdAt }]`

- `PUT /api/notifications/:id/read` - Mark notification as read
  - Returns: `{ success: true }`

- `POST /api/notifications/send` - Send a notification
  - Body: `{ userId, type, title, body, actionLabel?, actionUrl? }`
  - Returns: `{ success: true, notificationId }`

### Database Schema

**notifications table:**
- `id` (uuid, primary key)
- `user_id` (uuid, required)
- `type` (text: 'Race Reminder' | 'Ranking Update' | 'EQ Score Update' | 'General')
- `title` (text, required)
- `body` (text, required)
- `action_label` (text, optional)
- `action_url` (text, optional)
- `read` (boolean, default false)
- `created_at` (timestamp)
- `sent_at` (timestamp, optional)

**push_tokens table:**
- `id` (uuid, primary key)
- `user_id` (uuid, unique)
- `expo_push_token` (text, required)
- `device_type` (text: 'ios' | 'android')
- `updated_at` (timestamp)

## Usage

### Accessing Notifications

Users can access notifications by tapping the bell icon in the Account screen header. The bell icon shows a badge with the unread count.

### Sending Notifications (Backend)

To send a notification to a user:

```javascript
POST /api/notifications/send
{
  "userId": "user-uuid",
  "type": "Ranking Update",
  "title": "Ranking Update",
  "body": "You moved up 5 spots in your regional rankings!",
  "actionLabel": "View Rankings",
  "actionUrl": "https://publictimeoff.com/rankings?source=app"
}
```

### Notification Permissions

The app requests notification permissions on first launch. Users must grant permission to receive push notifications.

## Styling

All notification styling follows the PTO League brand guidelines:

- **Primary Green**: `#46A758` (action buttons, badges)
- **Typography**: Helvetica Neue, 14px
- **Border Radius**: 12px
- **Shadows**: `0 4px 16px rgba(0,0,0,0.10)`
- **Animations**: 250ms cubic-bezier(0.4, 0, 0.2, 1)

### Dark Mode

Dark mode uses adjusted colors:
- Background: `#363333`
- Text (title): `#F8F8F8`
- Text (body): `#CFCBC1`
- Border: `#424242`

## Testing

To test notifications:

1. Run the app on a physical device (push notifications don't work in simulators)
2. Grant notification permissions when prompted
3. The app will automatically register the device token with the backend
4. Use the backend API to send test notifications
5. Notifications will appear in the system notification tray and in the app's notification screen

## Configuration

The notification system is configured in `app.json`:

```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/images/natively-dark.png",
        "color": "#40A060",
        "sounds": []
      }
    ]
  ]
}
```

## Dependencies

- `expo-notifications` - Expo's notification API
- `expo-device` - Device information for push token registration
- `react-native-reanimated` - Smooth animations

## Future Enhancements

Potential improvements:
- Notification categories/filtering
- Notification preferences/settings
- Rich notifications with images
- Scheduled notifications
- Notification history archive
