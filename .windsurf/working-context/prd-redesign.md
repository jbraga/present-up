# PresentUp — UI Redesign PRD

## 1. Overview

### 1.1 Problem Statement

The current PresentUp app uses a "Valencian flag" color palette (blue `#0072BC`, red `#DA121A`, yellow `#FCDD09`) with MD3-inspired components that look more like a web dashboard than a native Android app. The UI lacks visual breathing room, uses inconsistent card styles, and the typography is generic (system font weights without a custom typeface).

### 1.2 Goal

Redesign every visible screen and component to match the PresentUp Design Identity defined in `.windsurf/working-context/design-identity.md`. The result should feel like a premium, native Android app with the Lexend font family, a single-blue color scheme (`#1C74E9`), airy spacing, and soft elevations.

### 1.3 Scope

- **In scope**: All UI components, screens, theme tokens, tab navigation, dialogs, forms, and empty states.
- **Out of scope**: Business logic, API layer, data models, navigation structure (routes stay the same), authentication flow logic, dark mode.

### 1.4 Reference Materials

| Document | Path | Purpose |
|---|---|---|
| Design Identity & Guidelines | `.windsurf/working-context/design-identity.md` | Single source of truth for all visual decisions |
| Classes Dashboard concept | `.windsurf/working-context/ux/classes/main-screen-concept.html` | Reference for dashboard layout, stat cards, class list cards |
| Attendance Timeline concept | `.windsurf/working-context/ux/attendance/attendance-screen-concept.html` | Reference for timeline layout, day picker, attendance cards |
| Create Class Form concept | `.windsurf/working-context/ux/forms/form-concept.html` | Reference for form inputs, schedule slots, toggle switches |
| Classes screenshot | `.windsurf/working-context/ux/classes/screen.png` | Visual reference |
| Attendance screenshot | `.windsurf/working-context/ux/attendance/screen.png` | Visual reference |
| Form screenshot | `.windsurf/working-context/ux/forms/screen.png` | Visual reference |

### 1.5 Technical Constraints

- **Framework**: React Native 0.81.5, Expo SDK 54, React 19.1
- **Navigation**: Expo Router with file-based routing (routes do NOT change)
- **State management**: Zustand + TanStack React Query (do NOT modify)
- **Font loading**: Lexend must be loaded via `expo-font` in the root layout before any screen renders
- **Performance**: Follow guidelines in `.windsurf/skills/react-native-optimizer/SKILL.md` — use `FlatList` for lists, `memo` for card components, avoid inline style objects in render
- **No new dependencies** unless explicitly listed in a phase

---

## 2. Current Architecture Inventory

### 2.1 File Map

Understanding what exists is critical. Every file listed below will be touched during this redesign.

**Theme (1 file)**:
| File | What It Does | Redesign Action |
|---|---|---|
| `src/theme/tokens.ts` | Defines `palette`, `spacing`, `shape`, `typography`, `elevation`, `stateLayer` | **REPLACE** entire palette, update typography to Lexend scale, update spacing/shape values |

**App Layout (3 files)**:
| File | What It Does | Redesign Action |
|---|---|---|
| `app/_layout.tsx` | Root layout, loads providers, Stack navigator | **MODIFY** — add Lexend font loading via `expo-font`, set background color |
| `app/(tabs)/_layout.tsx` | Tab navigator configuration | **REPLACE** — new tab bar styling per Design Identity Section 6.1 |
| `app/(tabs)/classes/_layout.tsx` | Stack layout for classes sub-routes | **MODIFY** — update header styling |

**Tab Screens (3 files)**:
| File | What It Does | Redesign Action |
|---|---|---|
| `app/(tabs)/classes/index.tsx` | Classes list with hero card, FAB, selection toolbar | **REPLACE** styles — new dashboard header, stat cards, class list |
| `app/(tabs)/attendance.tsx` | Calendar-based attendance view with detail modal | **REPLACE** styles — new timeline layout, day picker |
| `app/(tabs)/students.tsx` | Student directory with search, FAB, selection | **REPLACE** styles — new header, student cards, search input |

**Detail Screens (2 files)**:
| File | What It Does | Redesign Action |
|---|---|---|
| `app/(tabs)/classes/[classId].tsx` | Class detail with roster and attendance metrics | **REPLACE** styles — new section header, student rows |
| `app/students/[studentId].tsx` | Student detail screen | **REPLACE** styles |

**Feature Components (10 files)**:
| File | What It Does | Redesign Action |
|---|---|---|
| `src/features/classes/components/ClassCard.tsx` | Card for a class in the list | **REPLACE** — new horizontal layout per Design Identity 6.4 |
| `src/features/classes/components/ClassList.tsx` | FlatList wrapper for class cards | **MODIFY** — update spacing, separator style |
| `src/features/classes/components/ClassDropdown.tsx` | Class selector dropdown + modal | **REPLACE** styles — new trigger and sheet styling |
| `src/features/classes/components/CreateClassDialog.tsx` | Full-screen dialog with form for creating a class | **REPLACE** styles — new form inputs per Design Identity 6.7 |
| `src/features/classes/components/UpdateClassDialog.tsx` | Same as create but for editing | **REPLACE** styles — same as CreateClassDialog |
| `src/features/classes/components/AddStudentToClassDialog.tsx` | Dialog to search and add student to class | **REPLACE** styles |
| `src/features/classes/components/ClassStudentAttendanceRow.tsx` | Student attendance metrics row | **REPLACE** styles — new card with softer elevation |
| `src/features/attendance/components/RecordAttendanceDialog.tsx` | Dialog for recording daily attendance | **REPLACE** styles — new student row, status buttons |
| `src/features/students/components/CreateStudentDialog.tsx` | Dialog for adding/editing student | **REPLACE** styles — new form inputs |
| `src/shared/components/MockModeBanner.tsx` | Warning banner for mock mode | **MODIFY** — update colors to match new palette |

**Shared Components (1 file)**:
| File | What It Does | Redesign Action |
|---|---|---|
| `src/shared/components/MD3TextInput.tsx` | Text input with floating label | **REPLACE** — new input style per Design Identity 6.7 |

### 2.2 Current `tokens.ts` Palette Summary (to be replaced)

The current palette uses a "Valencian flag" theme:
- Primary: `#0072BC` (blue)
- Secondary: `#DA121A` (red) — used for FABs, badges
- Tertiary: `#FCDD09` (yellow) — used for color accents
- Surface: warm cream tones (`#FEFDFB`, `#FAF8F5`)
- Many accent colors (orange, purple, green)

The new palette from the Design Identity uses:
- Primary: `#1C74E9` (brighter blue)
- No secondary/tertiary brand colors — status colors (success/warning/error) handle everything else
- Surface: cool grey tones (`#F6F7F8`, `#FFFFFF`)
- Streamlined text hierarchy (3 levels instead of scattered variants)

---

## 3. Phased Implementation Plan

### Legend

- **CRITICAL** = breaking visual change, must be done first
- **Files** = exact paths that must be edited
- **Acceptance** = what "done" looks like for verification

---

### Phase 1: Foundation — Theme Tokens & Font Loading

**Goal**: Replace the entire design token system and load Lexend. After this phase, the app will look "broken" (wrong colors, wrong spacing) because all components reference tokens. This is intentional — Phases 2-5 fix every component.

**Priority**: CRITICAL — all other phases depend on this.

#### Task 1.1: Install Lexend font

**Files to create/modify**:
- Download Lexend font files (Light 300, Regular 400, Medium 500, SemiBold 600, Bold 700) in `.ttf` format
- Place them in `assets/fonts/` directory:
  - `assets/fonts/Lexend-Light.ttf`
  - `assets/fonts/Lexend-Regular.ttf`
  - `assets/fonts/Lexend-Medium.ttf`
  - `assets/fonts/Lexend-SemiBold.ttf`
  - `assets/fonts/Lexend-Bold.ttf`

**Files to modify**:
- `app/_layout.tsx`

**Changes to `app/_layout.tsx`**:
1. Import `useFonts` from `expo-font` and `SplashScreen` from `expo-splash-screen`
2. Call `SplashScreen.preventAutoHideAsync()` at module level
3. Load all 5 Lexend weights using `useFonts`:
```tsx
const [fontsLoaded] = useFonts({
  'Lexend-Light': require('../assets/fonts/Lexend-Light.ttf'),
  'Lexend-Regular': require('../assets/fonts/Lexend-Regular.ttf'),
  'Lexend-Medium': require('../assets/fonts/Lexend-Medium.ttf'),
  'Lexend-SemiBold': require('../assets/fonts/Lexend-SemiBold.ttf'),
  'Lexend-Bold': require('../assets/fonts/Lexend-Bold.ttf'),
});
```
4. Add `useEffect` that calls `SplashScreen.hideAsync()` when `fontsLoaded` is `true`
5. Return `null` if `fontsLoaded` is `false`
6. Keep ALL existing provider/navigation structure unchanged

**Acceptance**:
- App loads without crash
- Splash screen stays visible until fonts are loaded
- `console.log(fontsLoaded)` returns `true` after load

#### Task 1.2: Replace `tokens.ts` palette

**File**: `src/theme/tokens.ts`

**Action**: Replace the ENTIRE file content with the new token definitions. Preserve the export names (`palette`, `spacing`, `shape`, `typography`, `elevation`, `stateLayer`) so all existing imports continue to resolve.

**New `palette` object** (replaces existing):
```ts
export const palette = {
  primary: '#1C74E9',
  onPrimary: '#FFFFFF',
  primaryContainer: 'rgba(28, 116, 233, 0.05)',
  onPrimaryContainer: '#1C74E9',
  primaryContainerBorder: 'rgba(28, 116, 233, 0.10)',

  background: '#F6F7F8',
  onBackground: '#1E293B',

  surface: '#FFFFFF',
  onSurface: '#1E293B',
  surfaceDim: '#E2E8F0',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F8FAFC',
  surfaceContainer: '#F1F5F9',
  surfaceContainerHigh: '#E2E8F0',
  surfaceContainerHighest: '#CBD5E1',
  surfaceVariant: '#F1F5F9',
  onSurfaceVariant: '#64748B',
  onSurfaceMuted: '#94A3B8',

  outline: '#CBD5E1',
  outlineVariant: 'rgba(226, 232, 240, 0.6)',

  success: '#059669',
  onSuccess: '#FFFFFF',
  successContainer: 'rgba(5, 150, 105, 0.10)',
  onSuccessContainer: '#059669',

  warning: '#D97706',
  onWarning: '#FFFFFF',
  warningContainer: 'rgba(217, 119, 6, 0.10)',
  onWarningContainer: '#D97706',

  error: '#DC2626',
  onError: '#FFFFFF',
  errorContainer: 'rgba(220, 38, 38, 0.10)',
  onErrorContainer: '#DC2626',

  scrim: 'rgba(0, 0, 0, 0.5)',
  shadow: '#000000',

  // REMOVED: secondary, tertiary, accent, gradient — these are no longer part of the design system
  // The following aliases exist ONLY for backward compatibility during migration.
  // Each phase MUST remove references to these and use the correct semantic token instead.
  secondary: '#1C74E9',
  onSecondary: '#FFFFFF',
  secondaryContainer: 'rgba(28, 116, 233, 0.05)',
  onSecondaryContainer: '#1C74E9',
  tertiary: '#D97706',
  onTertiary: '#FFFFFF',
  tertiaryContainer: 'rgba(217, 119, 6, 0.10)',
  onTertiaryContainer: '#D97706',
  primaryFixed: 'rgba(28, 116, 233, 0.15)',
  onPrimaryFixed: '#1C74E9',
  primaryFixedDim: '#1C74E9',
  onPrimaryFixedVariant: '#1C74E9',
  secondaryFixed: 'rgba(28, 116, 233, 0.10)',
  onSecondaryFixed: '#1C74E9',
  secondaryFixedDim: '#1C74E9',
  onSecondaryFixedVariant: '#1C74E9',
  tertiaryFixed: 'rgba(217, 119, 6, 0.10)',
  onTertiaryFixed: '#D97706',
  tertiaryFixedDim: '#D97706',
  onTertiaryFixedVariant: '#D97706',
  inverseSurface: '#1E293B',
  inverseOnSurface: '#F1F5F9',
  inversePrimary: '#93C5FD',
  surfaceBright: '#FFFFFF',
  accent: {
    blue: '#1C74E9',
    red: '#DC2626',
    yellow: '#D97706',
    orange: '#EA580C',
    purple: '#7C3AED',
    green: '#059669',
  },
  gradient: {
    primary: ['#1C74E9', '#1558B0'],
    secondary: ['#1C74E9', '#1558B0'],
    hero: ['#1C74E9', '#1558B0', '#0F3D7A'],
    warm: ['#D97706', '#B45309'],
    sunset: ['#DC2626', '#EA580C', '#D97706'],
  },
};
```

**New `spacing` object**:
```ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};
```
> Note: spacing values are UNCHANGED from current. This is intentional to minimize layout breakage.

**New `shape` object**:
```ts
export const shape = {
  extraSmall: 8,
  small: 12,
  medium: 16,
  large: 16,
  extraLarge: 28,
};
```
> Change: `large` changed from `24` to `16` to match the design concept's `rounded-2xl` (16px). `extraLarge` stays at `28` for modals/sheets.

**New `typography` object**:
```ts
export const typography = {
  displayLarge: { fontSize: 57, lineHeight: 64, fontWeight: '300' as const, fontFamily: 'Lexend-Light', letterSpacing: -0.25 },
  displayMedium: { fontSize: 45, lineHeight: 52, fontWeight: '400' as const, fontFamily: 'Lexend-Regular', letterSpacing: 0 },
  displaySmall: { fontSize: 36, lineHeight: 44, fontWeight: '400' as const, fontFamily: 'Lexend-Regular', letterSpacing: 0 },
  headlineLarge: { fontSize: 32, lineHeight: 40, fontWeight: '300' as const, fontFamily: 'Lexend-Light', letterSpacing: -0.5 },
  headlineMedium: { fontSize: 24, lineHeight: 32, fontWeight: '300' as const, fontFamily: 'Lexend-Light', letterSpacing: 0 },
  headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '300' as const, fontFamily: 'Lexend-Light', letterSpacing: 0 },
  titleLarge: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const, fontFamily: 'Lexend-SemiBold', letterSpacing: 0 },
  titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const, fontFamily: 'Lexend-Medium', letterSpacing: 0.15 },
  titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const, fontFamily: 'Lexend-SemiBold', letterSpacing: 0.1 },
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const, fontFamily: 'Lexend-Medium', letterSpacing: 0.1 },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, fontFamily: 'Lexend-Medium', letterSpacing: 0.5 },
  labelSmall: { fontSize: 10, lineHeight: 16, fontWeight: '500' as const, fontFamily: 'Lexend-Medium', letterSpacing: 0.5 },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const, fontFamily: 'Lexend-Regular', letterSpacing: 0.5 },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, fontFamily: 'Lexend-Regular', letterSpacing: 0.25 },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '300' as const, fontFamily: 'Lexend-Light', letterSpacing: 0.4 },
};
```

**`elevation` and `stateLayer`**: Keep unchanged from current file. The shadow values are appropriate.

**Acceptance**:
- `tokens.ts` exports all the same named exports as before
- No TypeScript compilation errors in `tokens.ts`
- App renders (visually off is expected — components still reference old semantic names like `palette.tertiary` etc.)

---

### Phase 2: Tab Navigation & Screen Headers

**Goal**: Replace the tab bar and all screen headers so every screen has the correct navigation chrome.

#### Task 2.1: Redesign Tab Bar

**File**: `app/(tabs)/_layout.tsx`

**Changes**:
1. Update `tabBarStyle`:
   - `backgroundColor`: `'rgba(255, 255, 255, 0.80)'`
   - Remove colored `borderTopColor` — use `borderTopColor: 'rgba(226, 232, 240, 0.6)'`, `borderTopWidth: 1`
   - Remove primary-tinted shadow
   - Add `backdropFilter` equivalent: This is not directly available in RN StyleSheet; instead use a solid white with slight transparency. The blur effect is a visual target but a simple `rgba(255,255,255,0.9)` is acceptable for React Native.
   - `paddingTop: 8`, `paddingBottom: insets.bottom + 8`
   - Height: `60 + insets.bottom`
2. Update `tabBarLabelStyle`:
   - `fontFamily: 'Lexend-Medium'`
   - `fontSize: 10`
   - `letterSpacing: 1.0`
   - `textTransform: 'uppercase'`
   - Remove `marginTop`
3. Update `tabBarActiveTintColor` to `palette.primary` (`#1C74E9`)
4. Update `tabBarInactiveTintColor` to `palette.onSurfaceMuted` (`#94A3B8`)
5. For the active tab icon, wrap it in a `View` with:
   - `backgroundColor: palette.primaryContainer`
   - `borderRadius: 12`
   - `width: 40`, `height: 40`
   - `alignItems: 'center'`, `justifyContent: 'center'`
6. Update tab titles to English: "Classes", "Students", "Attendance"

**Acceptance**:
- 3 tabs visible at bottom: Classes, Attendance, Students
- Active tab has a subtle blue pill behind the icon
- Inactive tabs show outline icons in muted grey
- Tab bar has a frosted-glass look (white with slight transparency)
- Labels are uppercase, 10px, Lexend Medium

#### Task 2.2: Update Classes Screen Header

**File**: `app/(tabs)/classes/index.tsx`

**Changes to the header area** (the `heroCard` and greeting section):
1. Remove the current `heroCard` (solid primary blue card with icon)
2. Replace with the Dashboard Header (Design Identity 6.2 Variant A):
   - Eyebrow text: "BIENVENIDO" — `labelMedium`, `onSurfaceVariant`, uppercase, `letterSpacing: 1.5`, `fontWeight: '300'`, `fontFamily: 'Lexend-Light'`
   - Title: "Dashboard" — `headlineMedium`, `onSurface`, `fontWeight: '300'`, `fontFamily: 'Lexend-Light'`
   - Right side: notification bell icon in a 48x48 circle (`surfaceDim` background at 30% opacity), with an 8dp `primary` dot indicator
3. Keep the greeting name logic (if user has givenName, show it as "Bienvenido, {name}" in the eyebrow)
4. Update `safeArea` background from `palette.surface` to `palette.background`

**Acceptance**:
- "BIENVENIDO" or "BIENVENIDO, {NAME}" in small caps above "Dashboard"
- Notification bell with blue dot on the right
- No hero card

#### Task 2.3: Update Attendance Screen Header

**File**: `app/(tabs)/attendance.tsx`

**Changes**:
1. Replace the current header (`greeting` text + `ClassDropdown` + record button) with:
   - Section Header (Variant B): title "Attendance", `headlineMedium`, `fontWeight: '600'`, `fontFamily: 'Lexend-SemiBold'`
   - Right side: search icon + calendar icon (48dp touch targets)
2. Below the header, add the Day Picker Strip (Design Identity 6.6):
   - Horizontal `ScrollView` with `horizontal`, `showsHorizontalScrollIndicator={false}`
   - 7 day items for the current week (Mon-Sun)
   - Selected day in `primary` background with shadow and ring
   - Default days in white with subtle border
3. Move the `ClassDropdown` below the day picker as a secondary filter
4. Keep the "Record Attendance" button but restyle it as a subtle secondary action, not a full-width primary button
5. Replace the calendar grid with the timeline layout (Design Identity 6.5):
   - Vertical timeline line (2px, `surfaceDim`, positioned 23px from left)
   - Each class session as a timeline entry: [TimeCircle] + [ContentCard]
   - ContentCard shows: class name, present count (green/amber), instructor, avatar stack, optional StatusBadge
6. Update `safeArea` background to `palette.background`

**Acceptance**:
- "Attendance" bold title with search + calendar icons
- Horizontal scrollable day strip below header
- Timeline layout with time circles and content cards
- No calendar grid

#### Task 2.4: Update Students Screen Header

**File**: `app/(tabs)/students.tsx`

**Changes**:
1. Replace current header (`greeting` + `subtitle` text) with:
   - Section Header (Variant B): title "Students", `headlineMedium`, `fontWeight: '600'`, `fontFamily: 'Lexend-SemiBold'`
   - No right-side actions on this screen
2. Keep the search input below the header, but restyle it per Design Identity 6.7 (with search icon prefix)
3. Update `safeArea` background to `palette.background`

**Acceptance**:
- "Students" bold title
- Styled search input with magnify icon
- Student list below

#### Task 2.5: Update Detail Screen Headers

**Files**:
- `app/(tabs)/classes/[classId].tsx`
- `app/(tabs)/classes/_layout.tsx`

**Changes**:
1. In `_layout.tsx`, update the Stack header styling:
   - `headerStyle.backgroundColor`: `palette.background`
   - `headerTintColor`: `palette.onSurface`
   - `headerTitleStyle`: `fontFamily: 'Lexend-SemiBold'`, `fontSize: 20`
   - `headerShadowVisible: false`
   - `headerBackTitleVisible: false`
2. In `[classId].tsx`, update background to `palette.background`

**Acceptance**:
- Class detail screen has a clean header with back arrow and class name
- No shadow under header
- Background is `#F6F7F8`

---

### Phase 3: Cards & List Components

**Goal**: Replace all card components to match the Design Identity's soft, airy card style.

#### Task 3.1: Redesign ClassCard

**File**: `src/features/classes/components/ClassCard.tsx`

**Replace the entire card layout** with the horizontal Class List Card (Design Identity 6.4):

**New structure**:
```
<Pressable style={cardStyle}>
  <View style={thumbnail}>
    {/* 64x64 rounded-xl placeholder or image */}
  </View>
  <View style={content}>
    <Text style={title}>{item.name}</Text>
    <Text style={subtitle}>{location} • {studentCount} Students</Text>
    <View style={timeRow}>
      <Icon name="clock-outline" size={14} color={palette.primary} />
      <Text style={timeLabel}>{schedule}</Text>
    </View>
  </View>
  <Icon name="chevron-right" size={24} color={palette.onSurfaceMuted} />
</Pressable>
```

**Style changes**:
- Remove `borderLeftWidth: 6` colored accent bar
- Remove `colorBar` absolutely positioned element
- Change to `flexDirection: 'row'`, `alignItems: 'center'`
- `borderRadius: 16` (from `shape.large`)
- `borderWidth: 1`, `borderColor: palette.outlineVariant`
- `backgroundColor: palette.surface`
- `padding: spacing.lg`
- `gap: spacing.lg`
- Shadow: `shadowOffset: {0, 2}`, `shadowOpacity: 0.04`, `shadowRadius: 8`, `elevation: 1`
- Remove the footer row with threshold percentage
- Remove the metadata rows (instructor, schedule as separate rows)
- Consolidate into the compact horizontal layout: thumbnail, title+subtitle+time, chevron
- Add thumbnail: 64x64, `borderRadius: 12`, `backgroundColor: palette.surfaceDim` — for now show class initials in a colored circle (reuse avatar color logic)
- Time label: `labelSmall`, `primary`, uppercase, `letterSpacing: 1.0`
- Press state: `borderColor` transitions to `palette.primaryContainerBorder`

**Keep**:
- `memo` wrapper
- `onPress`, `onLongPress`, `onEdit` props
- Selection mode logic (`isSelected`, `selectionMode`)

**Remove**:
- Edit button from card (move to detail screen or swipe action in future)
- Date display
- Threshold percentage display

**Acceptance**:
- Class cards are horizontal with thumbnail on the left
- Soft shadow, rounded corners, no colored accent bar
- Time shown in small blue uppercase text with clock icon
- Chevron on the right

#### Task 3.2: Update ClassList

**File**: `src/features/classes/components/ClassList.tsx`

**Changes**:
- `listContent.gap`: `spacing.lg` (16px)
- Remove `separator` component (gap handles spacing)
- `listContent.paddingHorizontal`: 0 (parent handles horizontal padding)
- `listContent.paddingBottom`: `spacing.xxl + 80` (FAB + nav clearance)

**Acceptance**:
- Cards spaced evenly with no visible separator lines

#### Task 3.3: Add Stat Cards to Dashboard

**File**: `app/(tabs)/classes/index.tsx`

**Changes**:
1. Add a 2-column stat cards section between the header and "Upcoming Classes" section title
2. Stat card 1 (primary tint): "TOTAL STUDENTS" label + count value
3. Stat card 2 (neutral): "AVG ATTENDANCE" label + percentage value
4. Stats data: derive from `classListQuery.data` — total student count across all classes (sum capacity or roster), average attendance percentage (can be placeholder "92%" for now if no real data hook exists)
5. Style per Design Identity 6.3

**Also add section header** for "Upcoming Classes":
- Row with "Upcoming Classes" (`titleLarge`) on left, "View Calendar" (`labelLarge`, `primary`) on right
- `marginTop: spacing.xl` above, `marginBottom: spacing.lg` below

**Acceptance**:
- Two stat cards in a row: blue-tinted "Total Students" and neutral "Avg Attendance"
- "Upcoming Classes" section header with "View Calendar" link
- Class list below

#### Task 3.4: Redesign Student Card

**File**: `app/(tabs)/students.tsx` (the `StudentCard` component defined inline)

**Changes**:
- Match card style to Class List Card (Design Identity 6.4) but without thumbnail/chevron:
  - `borderRadius: 16`
  - `borderWidth: 1`, `borderColor: palette.outlineVariant`
  - `backgroundColor: palette.surface`
  - `padding: spacing.lg`
  - Shadow: same soft shadow
- Keep avatar circle with initials
- Avatar size: 48dp (keep current)
- Student name: `titleMedium`
- Email/meta: `bodySmall`, `onSurfaceVariant`

**Acceptance**:
- Student cards have the same soft card style as class cards
- Avatar, name, meta info aligned horizontally

#### Task 3.5: Redesign ClassStudentAttendanceRow

**File**: `src/features/classes/components/ClassStudentAttendanceRow.tsx`

**Changes**:
- Update card style to match the new card pattern:
  - `borderRadius: 16`
  - `borderWidth: 1`, `borderColor: palette.outlineVariant`
  - `backgroundColor: palette.surface`
  - Soft shadow
- Update metric colors to use new semantic tokens:
  - Attended: `palette.success`
  - Missed: `palette.error`
  - Excused: `palette.warning`
  - Rate: `palette.primary`
- Update standing badge to use StatusBadge pattern (Design Identity 6.11)

**Acceptance**:
- Student attendance rows use the new card style
- Metric values use correct semantic colors
- Standing text uses badge-like styling

---

### Phase 4: Forms & Dialogs

**Goal**: Restyle all form inputs, dialogs, and modal sheets to match the Design Identity.

#### Task 4.1: Redesign MD3TextInput

**File**: `src/shared/components/MD3TextInput.tsx`

**Replace the entire component styling** per Design Identity 6.7:
- `borderRadius: 12` (not 4)
- `borderWidth: 1`, `borderColor: palette.surfaceDim` (not `palette.outline`)
- `backgroundColor: palette.surface`
- `minHeight: 56`
- `paddingHorizontal: 16`, `paddingVertical: 16`
- Focus: `borderWidth: 2`, `borderColor: palette.primary`
- Floating label: `labelMedium`, `onSurfaceVariant`; focused: `primary`
- Label background on float: `palette.surface` (not hardcoded `#FFFFFF`)
- Input text: `bodyMedium`, `onSurface`, `fontFamily: 'Lexend-Regular'`
- Placeholder: `bodyMedium`, `onSurfaceMuted`
- Add optional `iconLeft` prop: Material icon name, rendered at 20dp, `onSurfaceMuted`, left-positioned
  - When `iconLeft` is provided, add `paddingLeft: 48` to input

**Acceptance**:
- All text inputs across the app have rounded 12px corners
- Inputs have a clean, spacious feel with 56dp height
- Floating labels work correctly
- Optional icon prefix renders when provided

#### Task 4.2: Redesign CreateClassDialog

**File**: `src/features/classes/components/CreateClassDialog.tsx`

**Changes**:
1. Add a branding section at top of form (per form concept):
   - 80dp circle with `primaryContainer` background
   - `school` icon inside, 36dp, `primary` color
   - Description text below: `bodyMedium`, `onSurfaceVariant`, center-aligned
2. Update all `MD3TextInput` usage to include `iconLeft` where appropriate:
   - Class name: `iconLeft="book"`
   - Instructor: `iconLeft="account"`
   - Capacity: `iconLeft="account-multiple"`
   - Min Attendance: `iconLeft="chart-line"`
3. Update schedule section:
   - "Add Slot" button: text + `plus-circle` icon, `primary` color, `labelLarge`
   - Schedule slot cards: per Design Identity 6.9
   - 40dp circle with clock icon, `primaryContainer` background
   - Day + time text
   - Edit and delete icon buttons
4. Replace dialog button styles with Design Identity 6.15 modal actions
5. Update day picker modal and time picker modal backgrounds and card styles

**Bottom action area** (for when dialog becomes a full screen in the future):
- Full-width primary button per Design Identity 6.8
- "Create Class" text + `plus-circle` trailing icon

**Acceptance**:
- Form has branding icon at top
- All inputs have left icons
- Schedule slots look like the design concept
- Dialog has pill-shaped action buttons

#### Task 4.3: Redesign CreateStudentDialog

**File**: `src/features/students/components/CreateStudentDialog.tsx`

**Changes**:
- Same dialog shell styling as CreateClassDialog (Design Identity 6.15)
- Add icon prefixes to inputs:
  - First name: `iconLeft="account"`
  - Last name: `iconLeft="account"`
  - Email: `iconLeft="email"`
  - Guardian email: `iconLeft="email"`
  - Phone: `iconLeft="phone"`
- Update button styles to match

**Acceptance**:
- Student dialog matches class dialog styling
- Inputs have icon prefixes

#### Task 4.4: Redesign RecordAttendanceDialog

**File**: `src/features/attendance/components/RecordAttendanceDialog.tsx`

**Changes**:
1. Update container to Design Identity 6.15 modal style
2. Update student row styling:
   - `borderRadius: 16`, `backgroundColor: palette.surfaceContainerLow`, `padding: spacing.lg`
3. Update status buttons:
   - Present (✓): green tint → use `palette.successContainer` bg, `palette.success` active bg
   - Absent (✕): red tint → use `palette.errorContainer` bg, `palette.error` active bg
   - Excused (J): orange tint → use `palette.warningContainer` bg, `palette.warning` active bg
   - All buttons: 44dp circles, 2px border transparent
4. Update legend to use new semantic colors
5. Update action buttons to match Design Identity 6.15
6. Replace hardcoded color values (`#16a34a`, `#dc2626`, `#f97316`) with `palette.success`, `palette.error`, `palette.warning`

**Acceptance**:
- Attendance dialog uses the new palette
- No hardcoded hex colors in the file
- Status buttons use semantic token colors

#### Task 4.5: Redesign remaining dialogs

**Files**:
- `src/features/classes/components/UpdateClassDialog.tsx`
- `src/features/classes/components/AddStudentToClassDialog.tsx`
- `src/features/classes/components/ClassDropdown.tsx`

**Changes**: Apply the same Design Identity 6.15 modal style to all three. Update borders, backgrounds, button styles, and typography to use new tokens.

**Acceptance**:
- All dialogs in the app have identical modal chrome
- Consistent rounded corners, backdrop, and button styling

---

### Phase 5: Screens Polish & Cleanup

**Goal**: Final pass on every screen to ensure pixel-perfect alignment with the design concepts. Remove backward-compatibility aliases from tokens.

#### Task 5.1: Polish Classes Dashboard

**File**: `app/(tabs)/classes/index.tsx`

**Changes**:
1. Verify all backgrounds use `palette.background` (not `palette.surface`)
2. Verify stat cards render correctly
3. Verify "Upcoming Classes" header is present
4. Update FAB: `borderRadius: 16` (not circle), `primary` background, plus icon, positioned per Design Identity 6.12
5. Verify selection toolbar matches Design Identity 6.13
6. Remove any remaining `palette.tertiary`, `palette.secondary` references — replace with appropriate semantic tokens
7. Update MockModeBanner to use new palette (warning-tinted)

**Acceptance**:
- Dashboard matches `.windsurf/working-context/ux/classes/screen.png` layout
- FAB is rounded-xl, not circle
- No references to old palette tokens

#### Task 5.2: Polish Attendance Screen

**File**: `app/(tabs)/attendance.tsx`

**Changes**:
1. Complete the timeline implementation from Task 2.3
2. Ensure day picker strip scrolls correctly with snap behavior
3. Verify attendance cards show correct status colors
4. Verify empty state uses Design Identity 6.14
5. Update detail modal to use bottom sheet style (Design Identity 6.15 variant)
6. Remove calendar grid entirely (replaced by timeline)

**Acceptance**:
- Attendance screen matches `.windsurf/working-context/ux/attendance/screen.png` layout
- Timeline with time circles and content cards
- Day picker with selected state
- Detail modal slides up as bottom sheet

#### Task 5.3: Polish Students Screen

**File**: `app/(tabs)/students.tsx`

**Changes**:
1. Verify search input has icon prefix
2. Verify student cards match new style
3. Update FAB style per Design Identity 6.12
4. Verify empty state per Design Identity 6.14
5. Update `getAvatarColor` to use the new accent palette (`palette.accent.*`)
6. Remove any references to old palette tokens

**Acceptance**:
- Student cards are soft and airy
- Search has icon prefix
- Avatar colors use the new accent palette

#### Task 5.4: Polish Class Detail Screen

**File**: `app/(tabs)/classes/[classId].tsx`

**Changes**:
1. Update section header style
2. Update badge style
3. Update empty state
4. Verify student attendance rows match new style
5. Update FAB style

**Acceptance**:
- Class detail uses consistent card and header styles
- Badge is a subtle pill

#### Task 5.5: Clean up backward-compatibility aliases

**File**: `src/theme/tokens.ts`

**Changes**:
1. Search the entire codebase for any remaining references to:
   - `palette.secondary` (should be `palette.primary` for actions, or `palette.error` for destructive)
   - `palette.tertiary` (should be `palette.warning`)
   - `palette.accent.*` (should use semantic status colors)
   - `palette.primaryContainer` usage should reference the rgba-based tokens
   - Any hardcoded hex colors in style objects
2. Remove the backward-compatibility alias block from `tokens.ts`
3. Verify the app compiles and renders correctly without the aliases

**Acceptance**:
- `grep -rn "palette\.secondary\|palette\.tertiary" src/ app/` returns zero results (other than tokens.ts accent aliases if intentionally kept)
- No hardcoded color hex values in any `.tsx` component files
- App compiles and renders correctly

#### Task 5.6: Auth Gate Screens

**Files**:
- `app/(tabs)/classes/index.tsx` (auth gate section)
- `app/(tabs)/attendance.tsx` (auth gate section)
- `app/(tabs)/students.tsx` (auth gate section)

**Changes**:
- Update all three auth gate views to use Design Identity 6.16 style
- Center-aligned layout with `xl` padding
- Title: `titleLarge`, `onSurface`
- Subtitle: `bodyMedium`, `onSurfaceVariant`
- Button: pill shape (`borderRadius: 100`), `primary` background
- Background: `palette.background`

**Acceptance**:
- All three auth gates look identical
- Clean, centered, minimal design

---

## 4. Verification Checklist

After all phases are complete, verify every item:

- [ ] App loads Lexend font and splash screen works
- [ ] All text renders in Lexend (no system font fallback visible)
- [ ] Tab bar has 3 tabs: Classes, Students, Attendance
- [ ] Active tab has blue pill behind icon
- [ ] Classes dashboard: eyebrow + title + bell, stat cards, section header, class list
- [ ] Class cards: horizontal layout, thumbnail, title, subtitle, time, chevron
- [ ] Attendance: bold title + icons, day picker strip, timeline layout
- [ ] Students: bold title, search with icon, student cards
- [ ] Class detail: clean header, roster list, FAB
- [ ] All forms: rounded 12px inputs, icon prefixes, branding icons
- [ ] All dialogs: consistent modal chrome with pill buttons
- [ ] FABs: rounded-xl (16px), not circular
- [ ] No hardcoded hex colors in component files
- [ ] No references to old palette tokens (secondary/tertiary in old semantic meaning)
- [ ] Empty states use centered icon + title + subtitle pattern
- [ ] Auth gates are clean and centered
- [ ] Pull-to-refresh works on all list screens
- [ ] Selection mode works on Classes and Students screens
- [ ] App compiles with zero TypeScript errors
- [ ] App runs on Android emulator without crashes

## 5. Dependencies to Install

| Package | Version | Purpose | Phase |
|---|---|---|---|
| `expo-font` | already installed | Load Lexend font files | Phase 1 |
| `expo-splash-screen` | already installed | Hold splash while fonts load | Phase 1 |

No new npm packages are required. Lexend `.ttf` files must be downloaded and placed in `assets/fonts/`.

## 6. Risk Mitigation

| Risk | Mitigation |
|---|---|
| Font not loading on Android | Test on Android emulator after Phase 1. Use `expo-font` `useFonts` hook which handles platform differences. |
| Backward-compat aliases cause confusion | Each phase removes references to old tokens from the files it touches. Phase 5.5 is a final sweep. |
| Timeline layout performance | Use `FlatList` for timeline items, not `ScrollView` with `.map()`. Follow `react-native-optimizer` skill for list performance. |
| Large diff size per phase | Each phase is self-contained. A PR can be opened per phase. Phases 1-2 are the biggest visual changes; 3-5 are refinements. |
