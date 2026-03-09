# Expo SDK 52+ Breaking Changes

## Impact: HIGH
## Applies to: Expo SDK 52+, React Native 0.76+

## Overview

Expo SDK 52 introduces several breaking changes tied to React Native's New Architecture becoming the default. This reference documents every breaking change and migration path.

## Breaking Changes

### 1. JSC Removed from Expo Go

**What Changed:** JavaScriptCore (JSC) is no longer available in Expo Go. Hermes is the only JavaScript engine.

**Impact:**
```json
// This no longer works in Expo Go (SDK 52+):
{
  "jsEngine": "jsc"  // Ignored, Hermes only
}
```

**Migration:**
- Remove any `"jsEngine": "jsc"` from `app.json` / `app.config.js`
- If you depend on JSC-specific behavior, use a custom dev client:
```bash
npx expo install expo-dev-client
npx expo run:android
npx expo run:ios
```
- For the rare case you still need JSC (0.79+):
```bash
npm install @react-native-community/javascriptcore
```

### 2. New Architecture Enabled by Default

**What Changed:** Expo SDK 52 enables the New Architecture (Fabric + TurboModules) by default.

**Verification:**
```bash
npx expo config --type introspect | grep newArchEnabled
# Should output: true
```

**Impact:**
- All third-party native libraries must support New Architecture
- The interop layer handles most legacy libraries transparently (0.76-0.81)
- In 0.82+, interop layer is removed — libraries must natively support New Architecture

### 3. Google Maps Removed from Expo Go (SDK 53+)

**What Changed:** Google Maps is no longer bundled in Expo Go starting SDK 53.

**Migration:**
```bash
# Must use custom dev client for Google Maps
npx expo install expo-dev-client
npx expo run:android
```

### 4. Push Notification Warnings in Expo Go

**What Changed:** Expo Go shows warnings for push notification operations.

**Migration:**
- Use custom dev client for production push notification testing
- Expo Go is fine for development but not for testing push notification flows

### 5. expo/fetch (New Feature)

**What's New:** WinterCG-compliant fetch API for edge/worker runtime compatibility.

```tsx
import { fetch } from 'expo/fetch';

const response = await fetch('https://api.example.com/data');
const data = await response.json();
```

**When to use:**
- When targeting Workers/Edge runtimes
- When you need standards-compliant fetch behavior
- The global `fetch` still works for normal use cases

### 6. React Navigation v7

**What Changed:** Expo SDK 52 supports React Navigation v7.

```bash
npm install @react-navigation/native@^7.0.0
```

**Key changes in v7:**
- New static configuration API (optional)
- Improved TypeScript support
- Better Web support
- Drawer and Tab navigators improvements

### 7. Expo Router Updates

**What Changed:** Expo Router in SDK 52 aligns with React Navigation v7.

**Impact:**
- Check Expo Router migration guide for any layout changes
- Typed routes are now the default
- API route handling improvements

## Hermes-Specific Considerations

Since Hermes is now the only engine in Expo Go, be aware of:

### Hermes V1 (React Native 0.84, Feb 2026)

- Significant performance improvements over previous Hermes versions
- Better garbage collection
- Improved startup time
- Better memory efficiency

### Hermes Limitations

- No `eval()` in production (security feature)
- Some rarely-used ES features may behave differently
- `Intl` support is built-in (no polyfills needed for basic formatting)

### Hermes Debugging

```bash
# Use React Native DevTools (not Chrome debugger)
# Press 'j' in Metro CLI

# Hermes-specific profiling
npx react-native profile-hermes android
```

## Custom Dev Client

For features not available in Expo Go (Google Maps, custom native modules, JSC engine), use a custom dev client:

```bash
# Install
npx expo install expo-dev-client

# Build for Android
npx expo run:android

# Build for iOS
npx expo run:ios

# Or use EAS Build for cloud builds
eas build --profile development --platform android
eas build --profile development --platform ios
```

## Migration Checklist

- [ ] Remove `"jsEngine": "jsc"` from `app.json` if present
- [ ] Verify New Architecture is enabled: `npx expo config --type introspect | grep newArchEnabled`
- [ ] Update all Expo packages: `npx expo install --fix`
- [ ] Test app in Expo Go with Hermes engine
- [ ] If using Google Maps, set up custom dev client
- [ ] Update React Navigation to v7 if applicable
- [ ] Test push notifications with custom dev client (not Expo Go)
- [ ] Remove any JSC-specific polyfills (Intl, etc.)
- [ ] Run full test suite on Android and iOS

## Package Version Compatibility

```json
{
  "expo": "~52.0.0",
  "react-native": "0.76.x - 0.84.x",
  "react": "^19.1.0",
  "@react-navigation/native": "^7.0.0",
  "expo-dev-client": "~5.0.0",
  "expo-router": "~4.0.0"
}
```

## Sources

- [Expo SDK 52 Release Notes](https://blog.expo.dev/expo-sdk-52/)
- [Expo Documentation](https://docs.expo.dev)
- [React Native 0.84 - Hermes V1](https://reactnative.dev/blog/2026/02/11/react-native-0.84)
