# Cheap eSIMs Mobile App - Quick Setup Guide

## 🚀 Quick Start (5 minutes)

### 1. Environment Configuration

Create `.env.mobile` in the `apps/mobile/` directory:

```bash
# Copy the example file
cp .env.mobile.example .env.mobile
```

Then edit `.env.mobile` with your values:

```env
# Backend API URL
# For local development on physical device, use your computer's IP address
# Find your IP: Windows (ipconfig), Mac/Linux (ifconfig)
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.XXX:3001/api

# Clerk Authentication Key
# Get from: https://dashboard.clerk.com
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# App Configuration
EXPO_PUBLIC_APP_NAME=Cheap eSIMs
EXPO_PUBLIC_APP_SCHEME=cheapesims
```

### 2. Install Dependencies

```bash
cd apps/mobile
npm install --legacy-peer-deps
```

### 3. Start the App

```bash
npm start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on your phone

## 📱 Testing on Physical Device

### Why Physical Device?
- Emulators can't connect to `localhost` backend
- Better performance testing
- Real device compatibility testing

### Setup Steps

1. **Find Your Computer's IP Address**
   ```bash
   # Windows
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.100)
   
   # Mac/Linux
   ifconfig
   # Look for "inet" under your network interface
   ```

2. **Update `.env.mobile`**
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://YOUR_IP:3001/api
   # Example: http://192.168.1.100:3001/api
   ```

3. **Ensure Backend is Running**
   ```bash
   # In another terminal, from project root
   cd apps/backend
   npm run start:dev
   ```

4. **Connect Your Phone**
   - Install Expo Go app from App Store/Play Store
   - Ensure phone is on same WiFi as your computer
   - Scan QR code from `npm start`

## 🔑 Getting Clerk Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your project (or create new one)
3. Go to **API Keys** section
4. Copy the **Publishable Key** (starts with `pk_test_` or `pk_live_`)
5. Paste into `.env.mobile`

### Clerk Configuration
- **Sign-in methods**: Email, Google, Apple (configure in Clerk dashboard)
- **User metadata**: Email is required for orders
- **Redirect URLs**: Configure `cheapesims://` scheme in Clerk

## 🎨 Customizing Assets

Replace these files with your Cheap eSIMs branding:

### App Icon (`assets/icon.png`)
- Size: 1024x1024 px
- Format: PNG with transparency
- Design: Lime green (#98DE00) with your logo

### Adaptive Icon (`assets/adaptive-icon.png`)
- Size: 1024x1024 px
- Format: PNG with transparency
- Safe area: Center 66% (avoid corners)

### Splash Screen (`assets/splash-icon.png`)
- Size: 1242x2436 px (or larger)
- Format: PNG
- Background: White
- Logo: Centered

### Favicon (`assets/favicon.png`)
- Size: 48x48 px
- Format: PNG
- Simple, recognizable at small size

## 🐛 Troubleshooting

### "Network request failed"
**Problem**: Can't connect to backend API

**Solutions**:
1. Check backend is running: `curl http://localhost:3001/api/health`
2. Verify IP address in `.env.mobile` is correct
3. Ensure phone and computer are on same WiFi
4. Check firewall isn't blocking port 3001
5. Try using computer's IP instead of `localhost`

### "Clerk publishable key not configured"
**Problem**: Clerk key missing or invalid

**Solutions**:
1. Check `.env.mobile` has `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
2. Verify key starts with `pk_test_` or `pk_live_`
3. Restart Expo dev server after changing `.env.mobile`

### "Font loading error"
**Problem**: Inter fonts not loading

**Solutions**:
1. Clear Expo cache: `npx expo start -c`
2. Reinstall dependencies: `rm -rf node_modules && npm install --legacy-peer-deps`

### "Module not found"
**Problem**: Import errors

**Solutions**:
1. Ensure you're in `apps/mobile` directory
2. Run `npm install --legacy-peer-deps`
3. Restart Metro bundler

## 📦 Building for Production

### iOS (requires Mac)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios
```

### Android
```bash
# Build for Android
eas build --platform android

# Or build APK for testing
eas build --platform android --profile preview
```

## 🧪 Testing Checklist

Before deploying:

- [ ] App launches successfully
- [ ] Can browse countries and plans
- [ ] Search functionality works
- [ ] Can view plan details
- [ ] Sign up/sign in works
- [ ] Can create test order
- [ ] Order appears in "My eSIMs"
- [ ] eSIM details display correctly
- [ ] Profile page loads
- [ ] V-Cash balance shows
- [ ] Affiliate program accessible
- [ ] Support tickets work
- [ ] Reviews submission works
- [ ] All text is "Cheap eSIMs" (no "Voyo")
- [ ] Colors are lime green (not blue)
- [ ] Theme is light (not dark)

## 🔐 Security Notes

### Environment Variables
- Never commit `.env.mobile` to git (it's gitignored)
- Use different Clerk keys for dev/production
- Rotate keys if accidentally exposed

### API Security
- Backend has CSRF protection (auto-handled by client)
- Rate limiting prevents abuse
- Authentication required for sensitive endpoints

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Clerk Documentation](https://clerk.com/docs)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)

## 🆘 Need Help?

1. Check console logs in Expo dev tools
2. Check backend logs for API errors
3. Test API endpoints with curl/Postman
4. Review `MIGRATION_COMPLETE.md` for detailed changes
5. Check Clerk dashboard for auth issues

## 🎉 Success!

If you can:
1. Launch the app
2. Browse plans
3. Sign in
4. Create a test order

Then your setup is complete! 🚀





