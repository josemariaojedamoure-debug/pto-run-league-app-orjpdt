
# iOS App Store Deployment Checklist for PTO Running League

## 🚨 CRITICAL - Must Complete Before Submission

### 1. App Icons & Assets
- [ ] **Create 1024x1024px app icon** (PNG, no transparency)
  - Save as `assets/images/app-icon.png`
  - Must be square, no rounded corners
  - Should represent PTO Running League brand
  
- [ ] **Create splash screen** (1242x2688px)
  - Save as `assets/images/splash-screen.png`
  - Use PTO Green (#40A060) background
  - Include PTO logo/branding

- [ ] **Create notification icon** (256x256px)
  - Save as `assets/images/notification-icon.png`

### 2. EAS Configuration
- [ ] **Run EAS setup:**
  ```bash
  npm install -g eas-cli
  eas login
  eas build:configure
  ```
  This will generate a real project ID to replace "your-project-id-here" in app.json

### 3. Apple Developer Account
- [ ] **Enroll in Apple Developer Program** ($99/year)
  - Visit: https://developer.apple.com/programs/
  
- [ ] **Create App Store Connect App**
  - Visit: https://appstoreconnect.apple.com
  - Create new app with bundle ID: `com.publictimeoff.runleague`
  - Note your App ID and Team ID

- [ ] **Update eas.json** with your Apple credentials:
  - `appleId`: Your Apple ID email
  - `ascAppId`: App Store Connect App ID
  - `appleTeamId`: Your Apple Team ID

### 4. Privacy Policy & Legal
- [ ] **Create and host Privacy Policy**
  - Must cover: data collection, push notifications, location (if used), Strava integration
  - Host at: `https://publictimeoff.com/privacy-policy`
  - Add URL to App Store Connect

- [ ] **Create Terms of Service** (recommended)
  - Host at: `https://publictimeoff.com/terms-of-service`

### 5. App Store Metadata
Prepare the following for App Store Connect:

- [ ] **App Name:** "PTO Corporate Running League" (or your preferred name)
- [ ] **Subtitle:** (35 characters max)
  - Example: "Corporate Running Competition"
  
- [ ] **Description:** (4000 characters max)
  - Explain the app's purpose
  - Highlight key features: rankings, events, scoring, awards
  - Mention Strava integration
  
- [ ] **Keywords:** (100 characters max, comma-separated)
  - Example: "running,corporate,league,fitness,competition,strava,races"
  
- [ ] **Promotional Text:** (170 characters, can be updated anytime)
  - Example: "Join your company's running league! Track progress, compete in rankings, and win real prizes."

- [ ] **Support URL:** 
  - Example: `https://publictimeoff.com/support`

- [ ] **Marketing URL:** (optional)
  - Example: `https://publictimeoff.com`

### 6. Screenshots (REQUIRED)
You need screenshots for these device sizes:

- [ ] **6.7" Display (iPhone 15 Pro Max)** - 1290 x 2796 pixels
  - Minimum 3 screenshots, maximum 10
  
- [ ] **6.5" Display (iPhone 11 Pro Max)** - 1242 x 2688 pixels
  - Minimum 3 screenshots, maximum 10

**Recommended screenshots to capture:**
1. Dashboard with WebView content
2. Rankings screen showing leaderboard
3. Account screen with settings
4. Notifications screen
5. Event registration screen

### 7. App Review Information
- [ ] **Demo Account Credentials** (if login required)
  - Provide test account for Apple reviewers
  - Email: test@publictimeoff.com
  - Password: (create a test account)

- [ ] **Notes for Reviewer:**
  ```
  This app is a WebView-based participant app for PTO Corporate Running League.
  It integrates with our web platform at https://publictimeoff.com.
  
  Test Account:
  Email: test@publictimeoff.com
  Password: [your-test-password]
  
  Key features to test:
  - Login via WebView
  - View dashboard and rankings
  - Register for events
  - Receive push notifications
  - Strava OAuth integration
  ```

### 8. Build & Test
- [ ] **Create production build:**
  ```bash
  eas build --platform ios --profile production
  ```

- [ ] **Test on physical iOS device**
  - Install via TestFlight
  - Test all core features
  - Verify Strava OAuth works
  - Test push notifications
  - Check theme switching
  - Verify language toggle

- [ ] **Test on different iOS versions**
  - iOS 15, 16, 17, 18

### 9. Compliance & Ratings
- [ ] **Age Rating:** Determine appropriate rating (likely 4+)
- [ ] **Export Compliance:** Set `ITSAppUsesNonExemptEncryption: false` (already done)
- [ ] **Content Rights:** Ensure you have rights to all content/images

### 10. Submission
- [ ] **Upload build to App Store Connect:**
  ```bash
  eas submit --platform ios --profile production
  ```

- [ ] **Complete all App Store Connect fields**
- [ ] **Submit for review**
- [ ] **Monitor review status** (typically 24-48 hours)

---

## ⚠️ Common Rejection Reasons to Avoid

1. **Missing Privacy Policy** - Must be accessible URL
2. **Broken functionality** - Test thoroughly before submission
3. **Incomplete metadata** - Fill all required fields
4. **Poor screenshots** - Use high-quality, representative images
5. **Login issues** - Provide working demo account
6. **Crashes** - Test on multiple devices/iOS versions
7. **Misleading description** - Accurately describe app features

---

## 📋 Quick Start Commands

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Configure EAS (generates project ID)
eas build:configure

# 4. Create production build
eas build --platform ios --profile production

# 5. Submit to App Store (after build completes)
eas submit --platform ios --profile production
```

---

## 🎯 Estimated Timeline

- **Asset creation** (icons, screenshots): 2-4 hours
- **EAS setup & first build**: 1-2 hours
- **App Store Connect setup**: 1-2 hours
- **Testing**: 2-4 hours
- **Metadata preparation**: 1-2 hours
- **Apple review**: 24-48 hours (after submission)

**Total: 1-2 days of work + Apple review time**

---

## 📞 Need Help?

- **Expo EAS Docs:** https://docs.expo.dev/build/introduction/
- **App Store Connect:** https://appstoreconnect.apple.com
- **Apple Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/

---

## ✅ Current Status

**Ready:**
- ✅ Core app functionality
- ✅ Bundle identifier configured
- ✅ EAS configuration structure
- ✅ iOS permissions configured
- ✅ Push notifications setup

**Needs Attention:**
- ❌ App icon (1024x1024px)
- ❌ Splash screen image
- ❌ EAS project ID (run `eas build:configure`)
- ❌ Privacy policy URL
- ❌ App Store screenshots
- ❌ Apple Developer account setup
- ❌ App Store Connect metadata

**Once you complete the "Needs Attention" items, your app will be ready for submission!**
