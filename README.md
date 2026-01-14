
# PTO Running League Mobile App

A mobile participant app for PTO Corporate Running League built with Expo and React Native.

## 🏃 Features

- **WebView Integration:** Seamless integration with https://publictimeoff.com
- **Bottom Tab Navigation:** Dashboard, Rankings, and Account screens
- **Theme Support:** Light, Dark, and System default modes
- **Language Support:** English and French
- **Push Notifications:** Native notifications for race reminders, ranking updates, and more
- **Strava Integration:** OAuth authentication for activity syncing
- **User Profiles:** View your score, completed events, and progress

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- iOS Simulator (for iOS development) or Android Emulator

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## 📱 Building for Production

### iOS App Store

1. **Setup EAS:**
   ```bash
   eas login
   eas build:configure
   ```

2. **Create production build:**
   ```bash
   eas build --platform ios --profile production
   ```

3. **Submit to App Store:**
   ```bash
   eas submit --platform ios --profile production
   ```

See `APP_STORE_CHECKLIST.md` for complete deployment guide.

### Android Play Store

```bash
eas build --platform android --profile production
eas submit --platform android --profile production
```

## 🎨 Brand Colors

- **PTO Green:** `#40A060`
- **Light Mode Background:** `#FFFFFF`
- **Dark Mode Background:** `#2A2828`

## 📂 Project Structure

```
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Bottom tab navigation
│   │   ├── dashboard.tsx  # Main dashboard (WebView)
│   │   ├── rankings.tsx   # Rankings (WebView)
│   │   └── account.tsx    # Account settings
│   ├── auth.tsx           # Authentication screen
│   └── notifications.tsx  # Notifications screen
├── components/            # Reusable components
├── contexts/              # React Context providers
├── styles/                # Common styles and theme
├── utils/                 # Utility functions
└── assets/                # Images, fonts, icons
```

## 🔧 Configuration

- **Backend URL:** Configured in `app.json` under `extra.backendUrl`
- **Supabase:** Client configured in `lib/supabase.ts`
- **Theme:** Managed via `contexts/ThemeContext.tsx`
- **Notifications:** Managed via `contexts/NotificationContext.tsx`

## 📝 Environment Variables

No environment variables needed - all configuration is in `app.json`.

## 🧪 Testing

```bash
# Run linter
npm run lint

# Test on iOS simulator
npm run ios

# Test on Android emulator
npm run android
```

## 📄 License

Private - © PTO Running League

## 🤝 Support

For support, contact: support@publictimeoff.com

---

Built with [Expo](https://expo.dev) and [React Native](https://reactnative.dev)
