# Fix: React Native Bundling Error

## Problem
```
ERROR [TypeError: Cannot read property 'S' of undefined]
```

This was caused by:
1. **React 19 incompatibility** - Expo SDK 54 requires React 18
2. **Missing shadow property** - `primaryGlow` was removed but still referenced

## ✅ Fixes Applied

### 1. React Version Downgrade
- Changed `react` from `19.1.0` → `18.3.1`
- Changed `react-dom` from `19.1.0` → `18.3.1`
- Changed `@types/react` from `19.1.4` → `18.3.12`

### 2. Theme Shadow Fix
- Added back `primaryGlow` shadow property for backward compatibility
- Updated to use lime green color (#98DE00) instead of blue

## 🔧 Steps to Fix (Run These Commands)

```bash
cd apps/mobile

# 1. Remove old dependencies
rm -rf node_modules
rm -f package-lock.json

# 2. Clear Expo/Metro cache
npx expo start --clear

# OR if that doesn't work:
rm -rf .expo
rm -rf node_modules/.cache

# 3. Reinstall dependencies
npm install --legacy-peer-deps

# 4. Restart Expo
npm start
```

## 🪟 Windows PowerShell Commands

```powershell
cd apps\mobile

# Remove old dependencies
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Clear cache
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

# Reinstall
npm install --legacy-peer-deps

# Start
npm start
```

## ✅ Verification

After running these commands, the app should:
- ✅ Bundle without errors
- ✅ Launch successfully
- ✅ Display the Cheap eSIMs theme (lime green, white background)
- ✅ All shadows work correctly

## 🐛 If Still Having Issues

1. **Clear all caches:**
   ```bash
   npx expo start -c
   ```

2. **Reset Metro bundler:**
   ```bash
   npx react-native start --reset-cache
   ```

3. **Check React version:**
   ```bash
   npm list react react-dom
   ```
   Should show `18.3.1` for both

4. **Verify theme exports:**
   Check that `src/theme/index.ts` exports `shadows.primaryGlow`

## 📝 What Changed

### package.json
```diff
- "react": "19.1.0",
- "react-dom": "19.1.0",
- "@types/react": "^19.1.4",
+ "react": "18.3.1",
+ "react-dom": "18.3.1",
+ "@types/react": "~18.3.12",
```

### src/theme/index.ts
```diff
+ // Legacy primaryGlow - now uses hard shadow with primary color border effect
+ primaryGlow: { 
+   shadowColor: '#98DE00', 
+   shadowOffset: { width: 4, height: 4 }, 
+   shadowOpacity: 0.8, 
+   shadowRadius: 0, 
+   elevation: 4 
+ },
```

## 🎯 Expected Result

After fixing, you should see:
- No bundling errors
- App launches successfully
- Theme displays correctly (lime green primary, white background)
- All components render properly





