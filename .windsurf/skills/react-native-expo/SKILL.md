---
name: react-native-expo
description: Build and migrate React Native 0.76-0.84+ apps with Expo SDK 52+. Covers mandatory New Architecture (0.82+), React 19 breaking changes (propTypes/forwardRef removal), Hermes V1, new CSS properties, Swift iOS template, and DevTools migration. Use when building Expo apps, migrating to New Architecture, or troubleshooting "Fabric component not found", "propTypes not a function", "TurboModule not registered", or Swift AppDelegate errors.
license: MIT
metadata:
  author: Ovachiever (LobeHub)
  tags: react-native, expo, new-architecture, react-19, migration, hermes, fabric, turbo-modules
---

# React Native Expo (0.76-0.84+ / SDK 52+)

Status: Production Ready
Last Updated: 2026-03-08
Dependencies: Node.js 18+, Expo CLI
Project Versions: react-native@0.81.5, expo@~54.0.23, react@19.1.0
Latest Available: react-native@0.84, expo@~54.x, react@19.1

## Quick Start (15 Minutes)

### 1. Create New Expo Project (RN 0.76+)

```bash
# Create new Expo app with React Native 0.76+
npx create-expo-app@latest my-app
cd my-app

# Install latest dependencies
npx expo install react-native@latest expo@latest
```

Why this matters:
- Expo SDK 52+ uses React Native 0.76+ with New Architecture enabled by default
- New Architecture is mandatory in React Native 0.82+ (cannot be disabled)
- Hermes is the only supported JavaScript engine (JSC removed from Expo Go)

### 2. Verify New Architecture is Enabled

```bash
# Check if New Architecture is enabled (should be true by default)
npx expo config --type introspect | grep newArchEnabled
```

CRITICAL:
- React Native 0.82+ requires New Architecture - legacy architecture completely removed
- If migrating from 0.75 or earlier, upgrade to 0.76-0.81 first to use the interop layer
- Never try to disable New Architecture in 0.82+ (build will fail)

### 3. Start Development Server

```bash
# Start Expo dev server
npx expo start

# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Press 'j' to open React Native DevTools (NOT Chrome debugger!)
```

CRITICAL:
- Old Chrome debugger removed in 0.79 - use React Native DevTools instead
- Metro terminal no longer streams `console.log()` - use DevTools Console
- Keyboard shortcuts 'a'/'i' work in CLI, not Metro terminal

## Critical Breaking Changes (Dec 2024+)

### New Architecture Mandatory (0.82+)

What Changed:
- 0.76-0.81: New Architecture default, legacy frozen (no new features)
- 0.82+: Legacy Architecture completely removed from codebase

Impact:

```properties
# This will FAIL in 0.82+:

# gradle.properties (Android)
newArchEnabled=false  # Ignored, build fails

# iOS
RCT_NEW_ARCH_ENABLED=0  # Ignored, build fails
```

Migration Path:
1. Upgrade to 0.76-0.81 first (if on 0.75 or earlier)
2. Test with New Architecture enabled
3. Fix incompatible dependencies (Redux, i18n, CodePush)
4. Then upgrade to 0.82+

### propTypes Removed (React 19 / RN 0.78+)

What Changed: React 19 removed `propTypes` completely. No runtime validation, no warnings - silently ignored.

Before (Old Code):

```tsx
import PropTypes from 'prop-types';

function MyComponent({ name, age }) {
  return <Text>{name} is {age}</Text>;
}

MyComponent.propTypes = {  // Silently ignored in React 19
  name: PropTypes.string.isRequired,
  age: PropTypes.number
};
```

After (Use TypeScript):

```tsx
type MyComponentProps = {
  name: string;
  age?: number;
};

function MyComponent({ name, age }: MyComponentProps) {
  return <Text>{name} is {age}</Text>;
}
```

Migration:

```bash
# Use React 19 codemod to remove propTypes
npx @codemod/react-19 upgrade
```

### forwardRef Deprecated (React 19)

What Changed: `forwardRef` no longer needed - pass `ref` as a regular prop.

Before (Old Code):

```tsx
import { forwardRef } from 'react';

const MyInput = forwardRef((props, ref) => {  // Deprecated
  return <TextInput ref={ref} {...props} />;
});
```

After (React 19):

```tsx
function MyInput({ ref, ...props }) {  // ref is a regular prop
  return <TextInput ref={ref} {...props} />;
}
```

### Swift iOS Template Default (0.77+)

What Changed: New projects use `AppDelegate.swift` instead of Objective-C `AppDelegate.mm`.

Migration (0.76 → 0.77): When upgrading existing projects, you MUST add this line:

```swift
// Add to AppDelegate.swift during migration
import React
import ReactCoreModules

RCTAppDependencyProvider.sharedInstance()  // CRITICAL: Must add this!
```

Source: [React Native 0.77 Release Notes](https://reactnative.dev/blog/2025/01/14/release-0.77)

### Metro Log Forwarding Removed (0.77+)

What Changed: Metro terminal no longer streams `console.log()` output.

Solution: Use React Native DevTools Console instead (press 'j' in CLI).

### Chrome Debugger Removed (0.79+)

What Changed: Old Chrome debugger (`chrome://inspect`) removed. Use React Native DevTools instead.

New Method (0.76+):

```bash
# Press 'j' in CLI or Dev Menu -> "Open React Native DevTools"
# Uses Chrome DevTools Protocol (CDP)
# Reliable breakpoints, watch values, stack inspection
# JS Console (replaces Metro logs)
```

Limitations:
- Third-party extensions not yet supported (Redux DevTools, etc.)
- Network inspector coming in 0.83

### JSC Engine Moved to Community (0.79+)

What Changed: JavaScriptCore (JSC) moved out of React Native core, Hermes is default.

```json
// If you still need JSC (rare):
{
  "dependencies": {
    "@react-native-community/javascriptcore": "^1.0.0"
  }
}
```

Expo Go: JSC completely removed from Expo Go (SDK 52+). Hermes only.

### Deep Imports Deprecated (0.80+)

What Changed: Importing from internal paths will break.

```tsx
// WRONG - Deep imports deprecated
import Button from 'react-native/Libraries/Components/Button';
import Platform from 'react-native/Libraries/Utilities/Platform';

// CORRECT - Import only from 'react-native'
import { Button, Platform } from 'react-native';
```

## New Features (Post-Dec 2024)

### CSS Properties (0.77+ New Architecture Only)

#### display: contents

Makes an element "invisible" but keeps its children in the layout:

```tsx
<View style={{ display: 'contents' }}>
  {/* This View disappears, but Text still renders */}
  <Text>I'm still here!</Text>
</View>
```

#### boxSizing

Control how width/height are calculated:

```tsx
// Default: padding/border inside box
<View style={{
  boxSizing: 'border-box',  // Default
  width: 100,
  padding: 10,
  borderWidth: 2
  // Total width: 100 (padding/border inside)
}} />

// Content-box: padding/border outside
<View style={{
  boxSizing: 'content-box',
  width: 100,
  padding: 10,
  borderWidth: 2
  // Total width: 124 (100 + 20 padding + 4 border)
}} />
```

#### mixBlendMode + isolation

Blend layers like Photoshop:

```tsx
<View style={{ backgroundColor: 'red' }}>
  <View style={{
    mixBlendMode: 'multiply',  // 16 modes available
    backgroundColor: 'blue'    // Result: purple (red x blue)
  }} />
</View>

// Prevent unwanted blending:
<View style={{ isolation: 'isolate' }}>
  {/* Blending contained within this view */}
</View>
```

Available modes: multiply, screen, overlay, darken, lighten, color-dodge, color-burn, hard-light, soft-light, difference, exclusion, hue, saturation, color, luminosity

#### outline Properties

Visual outline that doesn't affect layout (unlike border):

```tsx
<View style={{
  outlineWidth: 2,
  outlineStyle: 'solid',  // solid | dashed | dotted
  outlineColor: 'blue',
  outlineOffset: 4,        // Space between element and outline
  outlineSpread: 2         // Expand outline beyond offset
}} />
```

### Android XML Drawables (0.78+)

Use native Android vector drawables (XML) as Image sources:

```tsx
// Load XML drawable at build time
import MyIcon from './assets/my_icon.xml';

<Image source={MyIcon} style={{ width: 40, height: 40 }} />

// Or with require:
<Image
  source={require('./assets/my_icon.xml')}
  style={{ width: 40, height: 40 }}
/>
```

Benefits:
- Scalable vector graphics (resolution-independent)
- Smaller APK size vs PNG
- Off-thread decoding (better performance)

Constraints:
- Build-time resources only (no network loading)
- Android only (iOS still uses SF Symbols or PNG)

### React 19 New Hooks

#### useActionState (replaces form patterns)

```tsx
import { useActionState } from 'react';

function MyForm() {
  const [state, submitAction, isPending] = useActionState(
    async (prevState, formData) => {
      const result = await api.submit(formData);
      return result;
    },
    { message: '' }  // Initial state
  );

  return (
    <View>
      <TextInput name="email" />
      <Button
        disabled={isPending}
        title={isPending ? 'Submitting...' : 'Submit'}
        onPress={submitAction}
      />
      {state.message && <Text>{state.message}</Text>}
    </View>
  );
}
```

#### useOptimistic (optimistic UI updates)

```tsx
import { useOptimistic } from 'react';

function LikeButton({ postId, initialLikes }) {
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    initialLikes,
    (currentLikes, amount) => currentLikes + amount
  );

  async function handleLike() {
    addOptimisticLike(1);        // Update UI immediately
    await api.like(postId);       // Then update server
  }

  return (
    <Button onPress={handleLike} title={`${optimisticLikes}`} />
  );
}
```

#### use (read promises/contexts during render)

```tsx
import { use } from 'react';

function UserProfile({ userPromise }) {
  // Read promise directly during render (suspends if pending)
  const user = use(userPromise);
  return <Text>{user.name}</Text>;
}
```

### React Native DevTools (0.76+)

Access:
- Press `j` in CLI
- Or open Dev Menu -> "Open React Native DevTools"

Features:
- Reliable breakpoints (unlike old Chrome debugger)
- Watch values, call stack inspection
- JS Console (replaces Metro logs)
- Chrome DevTools Protocol (CDP) based
- Network inspector (coming in 0.83)
- Third-party extensions not yet supported

## Known Issues Prevention

This skill prevents 12 documented issues:

| # | Error | Cause | Prevention |
|---|-------|-------|------------|
| 1 | propTypes silently ignored | React 19 removed runtime validation | Use TypeScript |
| 2 | `forwardRef is deprecated` | React 19 allows ref as regular prop | Remove forwardRef wrapper |
| 3 | Build fails with `newArchEnabled=false` | Legacy architecture removed in 0.82+ | Migrate to New Architecture first |
| 4 | `Fabric component descriptor not found` | Component not New Architecture compatible | Update library or use interop layer (0.76-0.81) |
| 5 | `TurboModule not found` | Native module needs New Architecture support | Update library or use interop layer |
| 6 | `RCTAppDependencyProvider not found` | Migrating to Swift template | Add `RCTAppDependencyProvider.sharedInstance()` |
| 7 | `console.log()` not in terminal | Metro log forwarding removed (0.77) | Use DevTools Console (press 'j') |
| 8 | Chrome DevTools won't connect | Old debugger removed (0.79) | Use React Native DevTools |
| 9 | `Module not found: react-native/Libraries/...` | Deep imports deprecated (0.80) | Import from `'react-native'` only |
| 10 | Redux store crashes | Legacy redux incompatible with New Architecture | Use `@reduxjs/toolkit` |
| 11 | i18n translations not updating | `i18n-js` not compatible with New Architecture | Use `react-i18next` |
| 12 | CodePush crashes on Android | Known incompatibility with New Architecture | Avoid CodePush or wait for official support |

## Migration Guide: 0.72-0.75 -> 0.82+

### Step 1: Upgrade to Interop Layer First (0.76-0.81)

Why: Can't skip directly to 0.82 if using legacy architecture - you'll lose the interop layer.

```bash
# Check current version
npx react-native --version

# Upgrade to 0.81 first (last version with interop layer)
npm install react-native@0.81
npx expo install --fix
```

### Step 2: Enable New Architecture (if not already)

```bash
# Android (gradle.properties)
newArchEnabled=true

# iOS
RCT_NEW_ARCH_ENABLED=1
bundle exec pod install

# Rebuild
npm run ios
npm run android
```

### Step 3: Fix Incompatible Dependencies

```bash
# Replace Redux with Redux Toolkit
npm uninstall redux redux-thunk
npm install @reduxjs/toolkit react-redux

# Replace i18n-js with react-i18next
npm uninstall i18n-js
npm install react-i18next i18next

# Update React Navigation (if old version)
npm install @react-navigation/native@latest
```

### Step 4: Test Thoroughly

```bash
# Run on both platforms
npm run ios
npm run android

# Test all features:
# - Navigation
# - State management (Redux)
# - API calls
# - Deep linking
# - Push notifications
```

### Step 5: Migrate to React 19 (if upgrading to 0.78+)

```bash
# Run React 19 codemod
npx @codemod/react-19 upgrade

# Manually verify:
# - Remove all propTypes declarations
# - Remove forwardRef wrappers
# - Update to new hooks (useActionState, useOptimistic)
```

### Step 6: Upgrade to 0.82+

```bash
# Only after testing with New Architecture enabled!
npm install react-native@0.82
npx expo install --fix

# Rebuild
npm run ios
npm run android
```

### Step 7: Migrate iOS to Swift (if new project)

New projects (0.77+) use Swift by default. For existing projects:

```bash
# Follow upgrade helper
# https://react-native-community.github.io/upgrade-helper/
# Select: 0.76 -> 0.77
# CRITICAL: Add this line to AppDelegate.swift
RCTAppDependencyProvider.sharedInstance()
```

## Expo SDK 52+ Specifics

### Breaking Changes

JSC Removed from Expo Go:

```json
// This no longer works in Expo Go (SDK 52+):
{
  "jsEngine": "jsc"  // Ignored, Hermes only
}
```

Google Maps Removed from Expo Go (SDK 53+):

```bash
# Must use custom dev client for Google Maps
npx expo install expo-dev-client
npx expo run:android
```

### New Features (SDK 52)

expo/fetch (WinterCG-compliant):

```tsx
import { fetch } from 'expo/fetch';

// Standards-compliant fetch for Workers/Edge runtimes
const response = await fetch('https://api.example.com/data');
```

React Navigation v7:

```bash
npm install @react-navigation/native@^7.0.0
```

## Common Patterns

### Pattern 1: Conditional Rendering with New Hooks

```tsx
import { useActionState } from 'react';

function LoginForm() {
  const [state, loginAction, isPending] = useActionState(
    async (prevState, formData) => {
      try {
        const user = await api.login(formData);
        return { success: true, user };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    { success: false }
  );

  return (
    <View>
      <TextInput name="email" placeholder="Email" />
      <TextInput name="password" secureTextEntry />
      <Button
        disabled={isPending}
        title={isPending ? 'Logging in...' : 'Login'}
        onPress={loginAction}
      />
      {!state.success && state.error && (
        <Text style={{ color: 'red' }}>{state.error}</Text>
      )}
    </View>
  );
}
```

### Pattern 2: TypeScript Instead of propTypes

```tsx
type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
};

function Button({
  title,
  onPress,
  disabled = false,
  variant = 'primary'
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, styles[variant]]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}
```

### Pattern 3: New CSS for Visual Effects

```tsx
function GlowButton({ title, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#3b82f6',
        padding: 16,
        borderRadius: 8,
        outlineWidth: 2,
        outlineColor: '#60a5fa',
        outlineOffset: 4,
        mixBlendMode: 'screen',
        isolation: 'isolate'
      }}
    >
      <Text style={{ color: 'white', fontWeight: 'bold' }}>
        {title}
      </Text>
    </Pressable>
  );
}
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails with "Fabric component descriptor not found" | Library not compatible with New Architecture. Check library docs or use interop layer (0.76-0.81 only). |
| "propTypes is not a function" error | React 19 removed propTypes. Use TypeScript. Run `npx @codemod/react-19 upgrade`. |
| `console.log()` not showing in Metro terminal | Metro log forwarding removed in 0.77. Use DevTools Console (press 'j') or `npx expo start --client-logs` (temporary). |
| Swift AppDelegate errors during iOS build | Add `RCTAppDependencyProvider.sharedInstance()` to `AppDelegate.swift`. |
| Redux store crashes on startup | Use Redux Toolkit instead of legacy `redux` + `redux-thunk`. Install `@reduxjs/toolkit`. |
| Can't disable New Architecture in 0.82+ | Mandatory in 0.82+. If you need legacy, stay on 0.81 or earlier (not recommended). |

## Package Versions (Verified)

```json
{
  "dependencies": {
    "react": "19.1.0",
    "react-native": "0.81.5",
    "expo": "~54.0.23",
    "@react-navigation/native": "^7.1.8",
    "zustand": "^5.0.8",
    "@tanstack/react-query": "^5.90.7"
  },
  "devDependencies": {
    "@types/react": "~19.1.0",
    "typescript": "~5.9.2"
  }
}
```

## Complete Setup Checklist

- [ ] React Native 0.76+ or Expo SDK 52+ installed
- [ ] New Architecture enabled (automatic in 0.82+)
- [ ] Hermes engine enabled (default)
- [ ] React 19 migration complete (no propTypes, no forwardRef)
- [ ] TypeScript configured for type checking
- [ ] React Native DevTools accessible (press 'j')
- [ ] No deep imports (`react-native/Libraries/*`)
- [ ] Redux Toolkit (not legacy redux)
- [ ] `react-i18next` (not `i18n-js`)
- [ ] iOS builds successfully (Swift template if new project)
- [ ] Android builds successfully
- [ ] Dev server runs without errors
- [ ] All navigation/state management working

## Official Documentation

- React Native: https://reactnative.dev
- Expo: https://docs.expo.dev
- React 19: https://react.dev/blog/2024/04/25/react-19-upgrade-guide
- New Architecture: https://reactnative.dev/docs/new-architecture-intro
- Upgrade Helper: https://react-native-community.github.io/upgrade-helper/

## References

Detailed reference files in [references/](references/):

| File | Description |
|------|-------------|
| [react-19-migration.md](references/react-19-migration.md) | Detailed React 19 breaking changes and migration steps |
| [new-architecture-errors.md](references/new-architecture-errors.md) | Common build errors when enabling New Architecture |
| [expo-sdk-52-breaking.md](references/expo-sdk-52-breaking.md) | Expo SDK 52+ specific breaking changes |

## Attribution

Based on the react-native-expo skill by Ovachiever, adapted for Windsurf Cascade.
