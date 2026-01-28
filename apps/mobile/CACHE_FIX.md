# Fix: React Version Cache Issue

## Problem
Even though `package.json` shows React 18.3.1, the app was still using React 19 from the Metro bundler cache, causing the error:
```
ERROR [TypeError: Cannot read property 'S' of undefined]
```

## Root Cause
Metro bundler and Expo cache were still serving the old React 19 code even after updating `package.json` and reinstalling dependencies.

## ✅ Solution Applied

### 1. Cleared All Caches
```powershell
cd apps/mobile
Remove-Item -Recurse -Force .expo
Remove-Item -Recurse -Force node_modules\.cache
```

### 2. Started Expo with Cache Clear
```powershell
npx expo start --clear --port 8082
```

## 🔍 Verification Steps

After the app starts, verify React version:

1. **Check package.json:**
   ```json
   "react": "18.3.1",
   "react-dom": "18.3.1"
   ```

2. **Check installed version:**
   ```powershell
   npm list react react-dom --depth=0
   ```
   Should show: `react@18.3.1` and `react-dom@18.3.1`

3. **App should now:**
   - ✅ Bundle without errors
   - ✅ Launch successfully
   - ✅ Display Cheap eSIMs theme (lime green, white background)
   - ✅ No "Cannot read property 'S'" errors

## 🚨 If Error Persists

If you still see the error after clearing cache:

### Option 1: Nuclear Reset
```powershell
cd apps/mobile

# Stop all Expo/Metro processes
Get-Process -Name "node" | Stop-Process -Force -ErrorAction SilentlyContinue

# Remove everything
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .expo
Remove-Item -Force package-lock.json

# Reinstall
npm install --legacy-peer-deps --force

# Start fresh
npx expo start --clear
```

### Option 2: Check for Global Cache
```powershell
# Clear npm cache
npm cache clean --force

# Clear Expo global cache
npx expo start --clear
```

### Option 3: Restart Computer
Sometimes Metro bundler processes persist. A restart ensures all processes are killed.

## 📝 What We Fixed

1. **React Version**: Downgraded from 19.1.0 → 18.3.1
2. **Cache**: Cleared Metro bundler and Expo caches
3. **Theme**: Added back `primaryGlow` shadow for compatibility

## 🎯 Expected Behavior

After the fix:
- App launches without errors
- Theme displays correctly (lime green primary color)
- All components render properly
- No React renderer errors

## 💡 Why This Happened

The Metro bundler caches compiled JavaScript bundles for faster reload times. When you update dependencies, the cache can serve stale code. The `--clear` flag forces Metro to rebuild everything from scratch.

## 🔄 Future Updates

When updating React or other core dependencies:
1. Update `package.json`
2. Remove `node_modules`
3. Clear all caches (`.expo`, `node_modules/.cache`)
4. Reinstall with `npm install --legacy-peer-deps`
5. Start with `npx expo start --clear`





