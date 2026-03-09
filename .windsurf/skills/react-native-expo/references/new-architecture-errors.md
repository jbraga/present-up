# New Architecture Common Build Errors

## Impact: CRITICAL
## Applies to: React Native 0.76+

## Overview

When enabling or migrating to the New Architecture (Fabric + TurboModules + JSI), you may encounter several common build errors. This reference documents each error, its root cause, and the fix.

## Error #1: "Fabric component descriptor not found"

**Full Error:**
```
Fabric component descriptor provider not found for component <ComponentName>
```

**Cause:** The component (usually from a third-party library) has not been updated to support the New Architecture's Fabric renderer.

**Fix (0.76-0.81 — Interop Layer):**
The interop layer automatically wraps legacy components. If you still see this error:

1. Check if the library has a New Architecture-compatible version:
```bash
npx react-native-new-arch-check
```

2. Update the library to the latest version:
```bash
npm install <library-name>@latest
```

3. If no compatible version exists, file an issue with the library maintainer.

**Fix (0.82+ — No Interop Layer):**
- You **must** use a New Architecture-compatible version of the library
- If none exists, consider an alternative library or write a custom Fabric component

## Error #2: "TurboModule not registered"

**Full Error:**
```
TurboModule '[ModuleName]' not found
```

**Cause:** A native module hasn't been updated to use TurboModules (the New Architecture's native module system).

**Fix (0.76-0.81):**
The interop layer should handle this automatically. If not:

1. Verify the library supports New Architecture:
```bash
npx react-native-new-arch-check
```

2. Clean and rebuild:
```bash
# Android
cd android && ./gradlew clean && cd ..
npm run android

# iOS
cd ios && rm -rf Pods && bundle exec pod install && cd ..
npm run ios
```

**Fix (0.82+):**
- Update to a TurboModule-compatible version of the library
- If unavailable, write a custom TurboModule wrapper

## Error #3: Build fails with `newArchEnabled=false`

**Full Error:**
```
Build fails when trying to disable New Architecture
```

**Cause:** In React Native 0.82+, the legacy architecture has been completely removed from the codebase. The `newArchEnabled` flag is ignored.

**Fix:**
- Do not try to disable New Architecture in 0.82+
- If your dependencies require legacy architecture, stay on 0.81 (temporary, not recommended)
- Migrate all dependencies to New Architecture support before upgrading to 0.82+

## Error #4: Android Gradle build failures

**Full Error (examples):**
```
Could not find method reactNativeFlags() for arguments [...]
```
or
```
Execution failed for task ':app:configureNdkBuildRelease'
```

**Cause:** Outdated `build.gradle` configuration not compatible with New Architecture.

**Fix:**

1. Update `android/app/build.gradle`:
```groovy
android {
    defaultConfig {
        // Ensure this is present
        externalNativeBuild {
            cmake {
                abiFilters "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
            }
        }
    }
}
```

2. Update `android/gradle.properties`:
```properties
# New Architecture
newArchEnabled=true

# Hermes
hermesEnabled=true
```

3. Clean and rebuild:
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

## Error #5: iOS Pod install failures

**Full Error:**
```
[!] CocoaPods could not find compatible versions for pod "React-Fabric"
```

**Cause:** Pod cache or Podfile.lock is stale.

**Fix:**
```bash
cd ios
rm -rf Pods Podfile.lock
bundle exec pod install --repo-update
cd ..
npm run ios
```

If using Expo:
```bash
npx expo prebuild --clean
npx expo run:ios
```

## Error #6: "RCTAppDependencyProvider not found" (iOS Swift)

**Full Error:**
```
Cannot find 'RCTAppDependencyProvider' in scope
```

**Cause:** When migrating from Objective-C to Swift template (0.77+), the dependency provider must be explicitly initialized.

**Fix:**
Add to `AppDelegate.swift`:
```swift
import React
import ReactCoreModules

// In application(_:didFinishLaunchingWithOptions:)
RCTAppDependencyProvider.sharedInstance()
```

## Error #7: Redux crashes on startup

**Full Error:**
```
App crashes during Redux store creation
TypeError: Cannot read property 'dispatch' of undefined
```

**Cause:** Legacy `redux` + `redux-thunk` is incompatible with the New Architecture's JSI-based runtime.

**Fix:**
```bash
npm uninstall redux redux-thunk
npm install @reduxjs/toolkit react-redux
```

Migrate store:
```tsx
// BEFORE: Legacy Redux
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
const store = createStore(rootReducer, applyMiddleware(thunk));

// AFTER: Redux Toolkit
import { configureStore } from '@reduxjs/toolkit';
const store = configureStore({
  reducer: rootReducer,
  // Thunk middleware included by default
});
```

## Error #8: CodePush crashes on Android

**Full Error:**
```
Android crashes looking for bundle named null
```

**Cause:** Known incompatibility between CodePush and New Architecture on Android.

**Fix:**
- Avoid using CodePush with New Architecture
- Use EAS Update (Expo) or a custom OTA update mechanism instead
- Monitor [CodePush GitHub Issues](https://github.com/microsoft/react-native-code-push/issues) for official support

## Error #9: i18n-js translations not updating

**Symptoms:** Translations don't update when changing locale, or app crashes when accessing translations.

**Cause:** `i18n-js` has incomplete compatibility with New Architecture.

**Fix:**
```bash
npm uninstall i18n-js
npm install react-i18next i18next
```

## Diagnostic Commands

```bash
# Check which libraries support New Architecture
npx react-native-new-arch-check

# Check current React Native version
npx react-native --version

# Verify New Architecture is enabled
npx expo config --type introspect | grep newArchEnabled

# Clean all caches
watchman watch-del-all
rm -rf node_modules
npm install

# Android clean
cd android && ./gradlew clean && cd ..

# iOS clean
cd ios && rm -rf Pods Podfile.lock build && bundle exec pod install && cd ..
```

## Decision Tree

1. **Error mentions "Fabric"** → Library needs New Architecture support → Update library or use interop layer
2. **Error mentions "TurboModule"** → Native module needs migration → Update library or write custom TurboModule
3. **Error mentions "newArchEnabled"** → On 0.82+, cannot disable → Migrate dependencies first
4. **Gradle/CMake errors** → Update build configuration → See Error #4
5. **Pod errors** → Clean pods and reinstall → See Error #5
6. **Redux crashes** → Use Redux Toolkit → See Error #7
7. **CodePush crashes** → Switch to EAS Update → See Error #8

## Sources

- [New Architecture Migration Guide](https://reactnative.dev/docs/new-architecture-intro)
- [React Native 0.82 Release Notes](https://reactnative.dev/blog/2025/10/release-0.82)
- [React Native 0.84 Release Notes](https://reactnative.dev/blog/2026/02/11/react-native-0.84)
