
# PTO Corporate Running League Mobile App

A mobile participant app for PTO Corporate Running League built with Expo managed workflow. The app is primarily WebView-based with native enhancements for navigation, theme management, and OAuth integration.

## Features

### ✅ Implemented

- **Three-tab navigation**: Dashboard, Rankings, Account
- **WebView integration**: Loads content from https://publictimeoff.com
- **Native bottom tab bar**: Text-only labels with PTO Green active color
- **Theme management**: Light/Dark/System modes with AsyncStorage persistence
- **Language support**: English/French toggle with persistence
- **Native Account screen**: User info, settings, links, and logout
- **PTO Brand colors**: Proper light/dark mode theming
- **Typography**: Helvetica Neue with proper sizing

### 🚧 To Be Implemented

1. **Strava OAuth Integration**
   - Requires backend endpoint for OAuth callback
   - Use expo-web-browser for OAuth flow
   - Callback URL: https://publictimeoff.com/auth/strava/callback
   - Store tokens securely with expo-secure-store

2. **User Authentication**
   - Backend API for login/registration
   - Session management
   - Display actual user data in Account screen

3. **Push Notifications**
   - expo-notifications for local/remote notifications
   - Backend integration for notification triggers

4. **Custom Splash Screen & App Icon**
   - Replace placeholder images with PTO branding
   - Update app.json with proper asset paths

## Project Structure

```
app/
├── (tabs)/
│   ├── _layout.tsx       # Tab navigation with custom bottom bar
│   ├── dashboard.tsx     # WebView loading publictimeoff.com
│   ├── rankings.tsx      # WebView loading publictimeoff.com
│   └── account.tsx       # Native settings and user info
├── _layout.tsx           # Root layout with theme provider
contexts/
├── ThemeContext.tsx      # Theme and language management
styles/
├── commonStyles.ts       # PTO brand colors and typography
```

## Color Scheme

### PTO Green (Both Modes)
- Primary: `#40A060`

### Light Mode
- Background: `#FFFFFF`
- Foreground: `#171A1D`
- Secondary Background: `#F3F4F6`
- Tab Bar Background: `#F3F4F6`

### Dark Mode
- Background: `#2A2828`
- Foreground: `#F8F8F8`
- Card: `#343232`
- Tab Bar Background: `#3E3C3C`

## Typography

- **Font Family**: Helvetica Neue
- **Display Font**: Swissposters (for hero sections)
- **Sizes**: H1 32px, H2 24px, H3 20px, H4 18px, Body 16px, Caption 12px
- **Tab Labels**: 12px

## Running the App

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## Next Steps

1. **Backend Integration**
   - Set up authentication endpoints
   - Implement Strava OAuth callback handler
   - Create user profile API

2. **Strava OAuth Flow**
   - Configure Strava app credentials
   - Implement OAuth flow with expo-web-browser
   - Store and refresh tokens

3. **WebView Communication**
   - Implement postMessage for WebView ↔ Native communication
   - Share auth tokens with WebView
   - Handle deep links from WebView

4. **App Store Preparation**
   - Add proper app icons (1024x1024 for iOS, adaptive icon for Android)
   - Create splash screens with PTO branding
   - Update app.json with proper metadata
   - Test on physical devices
   - Prepare privacy policy and app store descriptions

## Dependencies

- `expo` - Expo SDK
- `expo-router` - File-based routing
- `react-native-webview` - WebView component
- `@react-native-async-storage/async-storage` - Persistent storage
- `expo-web-browser` - OAuth browser integration
- `react-native-safe-area-context` - Safe area handling

## Notes

- WebView loads from https://publictimeoff.com
- All OAuth callbacks should use https://publictimeoff.com domain
- Theme and language preferences persist across app restarts
- Tab bar height: 60px including safe area
- All buttons: 40px height, 12px border radius
