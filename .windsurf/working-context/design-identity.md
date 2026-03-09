# PresentUp — Design Identity & Guidelines

## 1. Design Philosophy

PresentUp follows a **"Premium Android Native"** aesthetic built on Material Design 3 principles. The interface prioritizes clarity, breathing room, and purposeful hierarchy. Every screen should feel like a polished native Android app — never a web page stuffed into a mobile frame.

Core principles:
- **Airy & uncluttered** — generous whitespace, soft elevations, no visual noise
- **Hierarchy through weight** — information importance conveyed via font weight and size, not color overload
- **Consistency over novelty** — every screen uses the same component library; zero one-off widgets
- **Touch-first** — large tap targets (minimum 48dp), clear interactive affordances, haptic feedback on key actions

## 2. Color System

All colors are defined once in `src/theme/tokens.ts` and referenced by semantic name — never raw hex values in component files.

### 2.1 Core Palette

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `primary` | `#1C74E9` | `rgb(28, 116, 233)` | Primary actions, active states, links, FAB |
| `onPrimary` | `#FFFFFF` | `rgb(255, 255, 255)` | Text/icons on primary surfaces |
| `primaryContainer` | `rgba(28, 116, 233, 0.05)` | — | Subtle primary tint for stat cards, active tab pill |
| `primaryContainerBorder` | `rgba(28, 116, 233, 0.10)` | — | Border on primary-tinted containers |

### 2.2 Surfaces

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `background` | `#F6F7F8` | `rgb(246, 247, 248)` | App-level background behind all content |
| `surface` | `#FFFFFF` | `rgb(255, 255, 255)` | Cards, sheets, modals, nav bar |
| `surfaceDim` | `#E2E8F0` | `rgb(226, 232, 240)` | Placeholder thumbnails, skeleton loaders |

### 2.3 Text

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `onSurface` | `#1E293B` | `rgb(30, 41, 59)` | Primary text (headings, names, values) |
| `onSurfaceVariant` | `#64748B` | `rgb(100, 116, 139)` | Secondary text (labels, subtitles, metadata) |
| `onSurfaceMuted` | `#94A3B8` | `rgb(148, 163, 184)` | Tertiary text (placeholders, disabled states) |

### 2.4 Semantic Status Colors

| Token | Hex | Usage |
|---|---|---|
| `success` | `#059669` | Attendance complete, present count |
| `warning` | `#D97706` | In-progress, excused |
| `error` | `#DC2626` | Absent, destructive actions |
| `info` | `#1C74E9` | Same as primary — informational badges |

### 2.5 Dark Mode (Future)

| Token | Hex | Usage |
|---|---|---|
| `background-dark` | `#111821` | App background |
| `surface-dark` | `#1E293B` | Cards, sheets |
| `onSurface-dark` | `#F1F5F9` | Primary text |
| `onSurfaceVariant-dark` | `#94A3B8` | Secondary text |

> Dark mode is out of scope for the initial redesign. The tokens above are reserved for future implementation. All current work targets light mode only.

## 3. Typography

The app uses **Lexend** exclusively. Lexend is loaded via `expo-font` and provides excellent readability on small screens.

### 3.1 Type Scale

| Style Name | Weight | Size | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `displayLarge` | Light (300) | 32px | 40px | -0.5 | — reserved — |
| `headlineMedium` | Light (300) | 24px | 32px | 0 | Screen titles ("Dashboard", "Attendance") |
| `titleLarge` | SemiBold (600) | 20px | 28px | 0 | Section headers ("Upcoming Classes") |
| `titleMedium` | Medium (500) | 16px | 24px | 0.15 | Card titles (class name, student name) |
| `titleSmall` | SemiBold (600) | 14px | 20px | 0.1 | Card metadata values |
| `bodyMedium` | Regular (400) | 14px | 20px | 0.25 | Body text, descriptions |
| `bodySmall` | Light (300) | 12px | 16px | 0.4 | Supporting text, hints |
| `labelLarge` | Medium (500) | 14px | 20px | 0.1 | Button text |
| `labelMedium` | Medium (500) | 12px | 16px | 0.5 | Eyebrow text, form labels, tab labels |
| `labelSmall` | Medium (500) | 10px | 16px | 0.5 | Tab bar labels, badge text |

### 3.2 Key Rules

- Screen titles use `headlineMedium` (Light 300) — NOT bold. This is the signature "premium" feel.
- Section headers use `titleLarge` (SemiBold 600) with tight tracking.
- Card titles use `titleMedium` (Medium 500) — a step lighter than old bold cards.
- Eyebrow labels (e.g. "WELCOME BACK", "TOTAL STUDENTS") use `labelMedium` in `onSurfaceVariant`, uppercase, `letterSpacing: 1.5`.
- Time/schedule labels use `labelSmall` in `primary`, uppercase, `letterSpacing: 1.0`.

## 4. Iconography

### 4.1 Icon Library

Use **Material Symbols Outlined** via `@expo/vector-icons` (`MaterialCommunityIcons` for React Native).

All icons use these default settings:
- Weight: 300
- Fill: 0 (outline only)
- Grade: 0
- Optical size: 24

Active/selected state icons use:
- Fill: 1 (filled)
- Weight: 400

### 4.2 Canonical Icon Map

These are the ONLY icons used across the app. No screen may introduce icons outside this set.

| Purpose | Icon Name | Context |
|---|---|---|
| Classes tab | `calendar-month` | Bottom nav |
| Students tab | `account-multiple` | Bottom nav |
| Attendance tab | `check-circle` | Bottom nav |
| Notifications | `bell-outline` | Header action |
| Search | `magnify` | Header action |
| Calendar picker | `calendar` | Header action |
| Back navigation | `arrow-left` | Form/detail headers |
| Overflow menu | `dots-vertical` | Form/detail headers |
| Time/schedule | `clock-outline` | Class card time row |
| Chevron right | `chevron-right` | List item disclosure |
| Add (FAB) | `plus` | Floating action button |
| Add slot | `plus-circle` | Schedule slot add |
| Edit | `pencil-outline` | Inline edit action |
| Delete | `delete-outline` | Inline delete action |
| Class icon | `school` | Form branding circle |
| Location | `map-marker` | Geofencing toggle |
| Close | `close` | Selection toolbar dismiss |

## 5. Layout & Spacing

### 5.1 Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `xs` | 4px | Micro gaps (icon-to-label inside tab) |
| `sm` | 8px | Tight gaps (between badge text lines) |
| `md` | 12px | Standard inner padding (cards, rows) |
| `lg` | 16px | Section gaps, card padding, horizontal page margin |
| `xl` | 24px | Large section spacing, header padding-top |
| `xxl` | 32px | Hero spacing, bottom padding for scroll content |

### 5.2 Page Layout

- **Horizontal page margin**: `lg` (16px) on both sides — consistent across ALL screens
- **Header top padding**: `xl` (24px) from safe area edge
- **Content starts**: `lg` (16px) below header
- **Bottom padding**: minimum `xxl` (32px) + nav bar height to prevent content being hidden behind nav

### 5.3 Grid

- Stat cards: 2-column grid with `lg` (16px) gap
- Form fields: single column, `lg` (16px) gap between fields; inline fields (e.g. capacity + threshold) use 2-column with `lg` gap
- Class list: single column, `lg` (16px) gap between cards

## 6. Component Specifications

Every component below is a reusable building block. No screen may create a one-off variant of these. If a screen needs a new pattern, add it here first.

### 6.1 Bottom Navigation Bar

The canonical navigation bar used on EVERY tab screen. It is the single source of truth for app-level navigation.

| Property | Value |
|---|---|
| Position | Fixed to bottom, full width |
| Background | `surface` with 80% opacity + `backdrop-blur(20px)` |
| Border | 1px top border, `rgba(226, 232, 240, 0.6)` |
| Height | Auto (content) + safe area bottom inset |
| Padding | `lg` horizontal, `md` top, safe-area-bottom bottom |
| Tab count | **3 tabs**: Classes, Students, Attendance |

**Tab item structure:**
- Icon (24dp) above label (10px `labelSmall`, uppercase, `letterSpacing: 1.0`)
- Gap between icon and label: `xs` (4px)
- Inactive: icon outline (fill 0), `onSurfaceMuted` color
- Active: icon inside a rounded-xl (12px radius) pill with `primaryContainer` background, icon filled (fill 1), `primary` color; label in `primary`

> Note: The Attendance screen concept from Google Stitch showed 4 tabs including "Settings". This is REJECTED for consistency. Settings will be accessible from a user/profile icon in the header or a separate route, not a tab.

### 6.2 Screen Header

Two variants exist. All screens must use one of them.

**Variant A — Dashboard Header (Classes tab only)**
```
[Eyebrow: "WELCOME BACK"]     [NotificationBell]
[Title: "Dashboard"]
```
- Eyebrow: `labelMedium`, `onSurfaceVariant`, uppercase, `letterSpacing: 1.5`, `fontWeight: 300`
- Title: `headlineMedium`, `onSurface`, `fontWeight: 300`
- Notification bell: 48x48dp circle, `surfaceDim` background, `onSurfaceVariant` icon; 8dp primary dot indicator

**Variant B — Section Header (all other screens)**
```
[BackArrow?] [Title]          [Action1] [Action2?]
```
- Title: `headlineMedium`, `onSurface`, `fontWeight: 600` (bold for non-dashboard)
- Back arrow: only on pushed screens (detail, forms), not on root tab screens
- Actions: 48dp touch target icon buttons with `primary` tint on hover/press

**Variant B usage by screen:**
- Students tab: title "Students", no back arrow, no actions
- Attendance tab: title "Attendance", no back arrow, actions = [search, calendar]
- Class Detail: title = class name, back arrow, no actions
- Create/Edit Class: title "Create Class" / "Edit Class", back arrow, overflow menu

### 6.3 Stat Card

Used on the Dashboard screen for quick stats (Total Students, Avg Attendance).

| Property | Value |
|---|---|
| Layout | 2-column grid, equal width |
| Border radius | 16px (`shape.medium`) |
| Padding | `lg` (16px) all sides |
| Primary stat card | Background: `primaryContainer`, border: `primaryContainerBorder` |
| Neutral stat card | Background: `surfaceDim` at 30% opacity, border: `rgba(226, 232, 240, 0.6)` |
| Stat label | `labelSmall`, uppercase, `onSurfaceVariant` (primary variant uses `primary` at 70% opacity) |
| Stat value | `headlineMedium`, `fontWeight: 300`, `onSurface` |

### 6.4 Class List Card

The card used to represent a class in the Upcoming Classes list.

| Property | Value |
|---|---|
| Direction | Horizontal (row) |
| Border radius | 16px |
| Background | `surface` |
| Border | 1px `rgba(226, 232, 240, 0.6)` |
| Shadow | `shadowOffset: {0, 2}`, `shadowOpacity: 0.04`, `shadowRadius: 8`, elevation 1 |
| Padding | `lg` (16px) all sides |
| Gap | `lg` (16px) between thumbnail and content |

**Inner layout:**
```
[64x64 Thumbnail]  [Content Column]               [ChevronRight]
                    Title (titleMedium, 500)
                    Subtitle (bodySmall, 300, onSurfaceVariant)
                    [ClockIcon] TIME LABEL (labelSmall, primary, uppercase)
```

- Thumbnail: 64x64, `borderRadius: 12px`, `backgroundColor: surfaceDim`, `objectFit: cover`
- If no image available, show class initials in a colored circle (same as student avatar logic)
- Chevron: `onSurfaceMuted`, transitions to `primary` on press
- Press state: border color transitions to `primaryContainerBorder`

### 6.5 Attendance Timeline Card

Used on the Attendance tab to show a class's attendance for a selected day.

**Timeline structure:**
```
[TimeCircle]  ---gap---  [ContentCard]
     |
  timeline
   line
     |
[TimeCircle]  ---gap---  [ContentCard]
```

**Time circle:**
- Size: 48x48dp
- Active (past/current): `primary` background, white text, `fontWeight: 700`, 10px
- Inactive (future): `surface` background, `onSurfaceMuted` text, 1px `surfaceDim` border
- Ring: 4px ring in `background` color to visually separate from timeline line

**Timeline line:**
- 2px wide, `surfaceDim` color, positioned 23px from left edge

**Content card:**
- Same border radius, border, shadow as Class List Card (6.4)
- Future cards: `opacity: 0.7`
- Layout:
```
Title (titleMedium, 600)
[Present count (titleSmall, success/warning)] • [Instructor (bodySmall, onSurfaceVariant)]
[Avatar stack] [optional StatusBadge]
```

**Avatar stack:**
- Overlapping circles, 24dp each, -8dp overlap
- Individual: `surfaceDim` background, 8px initials, `fontWeight: 700`
- Overflow: `primaryContainer` background, `primary` text, shows "+N"

### 6.6 Day Picker Strip

Horizontal scrollable day selector used on the Attendance screen header area.

| Property | Value |
|---|---|
| Direction | Horizontal scroll, no scrollbar |
| Item width | 56dp minimum |
| Padding | `md` (12px) vertical |
| Border radius | 16px |
| Gap | `md` (12px) between items |

**Day item states:**
- Default: `surface` background, `surfaceDim` border, day name in `onSurfaceMuted` (10px, uppercase), date in `onSurface` (18px, `fontWeight: 700`)
- Selected: `primary` background, `primary` shadow (30% opacity + ring 4px `primaryContainer`), day name in white at 70% opacity, date in white

### 6.7 Form Input

Used in ALL form dialogs (Create Class, Create Student, Edit Class, etc.).

| Property | Value |
|---|---|
| Height | 56dp minimum |
| Border radius | 12px |
| Border | 1px `surfaceDim` |
| Background | `surface` |
| Padding | 16px horizontal, 16dp vertical |
| Icon prefix | Material icon at 20dp, `onSurfaceMuted` color, positioned 16dp from left |
| Input padding-left (with icon) | 48dp (icon 20 + gap 12 + padding 16) |
| Focus state | 2px border `primary`, ring 2px `primaryContainer` |
| Label | `labelMedium`, `onSurfaceVariant`, positioned above input or floating |
| Placeholder | `bodyMedium`, `onSurfaceMuted` |
| Value | `bodyMedium`, `onSurface` |

### 6.8 Primary Action Button

Full-width button at the bottom of form screens.

| Property | Value |
|---|---|
| Width | Full width (stretch) |
| Height | 56dp |
| Border radius | 12px |
| Background | `primary` |
| Shadow | `primary` color at 30% opacity, offset `{0, 8}`, radius 20 |
| Text | `labelLarge`, white, `fontWeight: 700` |
| Press state | `scale(0.98)` animation |
| Disabled | 50% opacity |
| Icon (optional) | Trailing icon, 20dp, white |

### 6.9 Schedule Slot Card

Used in the Create/Edit Class form to show a schedule entry.

| Property | Value |
|---|---|
| Border radius | 16px |
| Border | 1px `surfaceDim` |
| Background | `surface` |
| Padding | `lg` (16px) |
| Hover/press | Border transitions to `primaryContainerBorder` |

**Inner layout:**
```
[TimeIcon in 40dp circle, primaryContainer bg]  [Days + Time]  [EditBtn] [DeleteBtn]
```

### 6.10 Toggle Switch

Used for boolean settings (e.g. Geofencing Attendance).

| Property | Value |
|---|---|
| Track width | 44dp |
| Track height | 24dp |
| Thumb diameter | 20dp |
| On state | Track: `primary`, thumb: white |
| Off state | Track: `surfaceDim`, thumb: white |
| Container | Card-like row: same as Schedule Slot layout but with [Icon circle] [Label + Description] [Toggle] |

### 6.11 Status Badge

Small pill used to indicate status (In Progress, Upcoming, Present count).

| Variant | Background | Text Color | Font |
|---|---|---|---|
| Success (completed) | `success` at 10% | `success` | `labelSmall`, `fontWeight: 500` |
| Warning (in progress) | `warning` at 10% | `warning` | `labelSmall`, `fontWeight: 500` |
| Neutral (upcoming) | `surfaceDim` at 50% | `onSurfaceMuted` | `labelSmall`, `fontWeight: 500`, uppercase |

### 6.12 Floating Action Button (FAB)

| Property | Value |
|---|---|
| Size | 56x56dp |
| Border radius | 16px (rounded-xl, NOT circle) |
| Background | `primary` |
| Shadow | `primary` at 30%, offset `{0, 8}`, radius 20 |
| Icon | `plus`, 28dp, white |
| Position | Fixed, 24dp from right edge, 24dp from bottom edge (above nav bar) |

### 6.13 Selection Toolbar

Appears at the top of a screen when items are long-pressed for multi-select.

| Property | Value |
|---|---|
| Background | `surface` |
| Border | 1px bottom `surfaceDim` |
| Height | 56dp |
| Layout | `[CloseIcon] [Count] ---spacer--- [DeleteIcon]` |
| Close icon | `close`, `onSurface` |
| Count | `titleMedium`, `onSurface`, `fontWeight: 600` |
| Delete | `delete-outline`, `onSurface` (turns `error` on press) |

### 6.14 Empty State

Centered content shown when a list has no data.

| Property | Value |
|---|---|
| Alignment | Center both axes |
| Icon | Relevant Material icon, 48dp, `onSurfaceMuted` |
| Title | `titleMedium`, `onSurface` |
| Subtitle | `bodyMedium`, `onSurfaceVariant`, center-aligned, max 280dp width |
| Gap | `md` between elements |

### 6.15 Modal / Dialog

Used for Create Class, Create Student, Record Attendance, etc.

| Property | Value |
|---|---|
| Backdrop | Black at 50% opacity |
| Container | `surface`, `borderRadius: 28px` (`shape.extraLarge`), padding `xl` |
| Max height | 80% of screen |
| Title | `titleLarge`, `onSurface`, `fontWeight: 700` |
| Actions row | Right-aligned, `[SecondaryButton] [PrimaryButton]` |
| Secondary button | Transparent bg, 2px `primary` border, `primary` text |
| Primary button | `primary` bg, white text, `borderRadius: 100` (pill) |

### 6.16 Bottom Sheet

A slide-up panel anchored to the bottom of the screen used for contextual actions that require focus but not a full-screen takeover (e.g. Record Attendance, Add Student to Class, Monthly Roster).

**Implementation:** `src/shared/components/BottomSheet.tsx` — all bottom sheet dialogs MUST use this shared component. No screen may create an inline bottom sheet.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `visible` | `boolean` | Controls visibility |
| `onClose` | `() => void` | Called on backdrop press and hardware back |
| `children` | `ReactNode` | Sheet content (header, list, buttons, etc.) |

**Structural layout (top to bottom):**

```
[Scrim backdrop]          ← palette.scrim, tap-to-dismiss
  [Overlay spacer]        ← flex: 1 pushes sheet to bottom
  [Sheet container]
    [Drag handle]         ← 48×4 pill, palette.outlineVariant
    {children}            ← consumer content
```

**Sheet container styles:**

| Property | Value |
|---|---|
| Background | `palette.surface` |
| Border radius | `shape.extraLarge` (28px) top-left and top-right only |
| Max height | 88% of screen |
| Horizontal padding | `spacing.lg` (16px) |
| Bottom padding | `max(safeAreaInsets.bottom, spacing.xl)` |
| Gap between children | `spacing.md` (12px) |
| Overflow | `hidden` |
| Shadow | `palette.shadow`, opacity 0.2, offset {0, -4}, radius 16, elevation 10 |

**Drag handle:**

| Property | Value |
|---|---|
| Width | 48px |
| Height | 4px |
| Border radius | 999 (pill) |
| Color | `palette.outlineVariant` |
| Margin | `spacing.sm` top, `spacing.xs` bottom |
| Alignment | Center (self) |

**Keyboard behavior:**

- Wrapped in `KeyboardAvoidingView` with `behavior="padding"` on iOS.
- `keyboardVerticalOffset: 0` on both platforms.

**Animation:**

- `animationType="slide"` (native slide-up).
- Backdrop uses `palette.scrim` (matches token system, not raw rgba).

**Consumer header pattern (recommended but not enforced):**

Most bottom sheets follow this header structure:

```
[Eyebrow label]    ← labelSmall, primary, Lexend-Bold, uppercase, letterSpacing: 1
[Title]            ← titleMedium, onSurface, Lexend-Bold
```

Centered in the header row with `flex: 1` and `alignItems: 'center'`.

**Consumers:**

| Dialog | Eyebrow | Has Search | Has Submit Button |
|---|---|---|---|
| `RecordAttendanceDialog` | "SESSION ACTIVE" | Yes | Yes |
| `MonthlyClassRosterDialog` | "MONTHLY ROSTER" | Yes | No |
| `AddStudentToClassDialog` | "ADD STUDENTS" | Yes | No |

### 6.17 Auth Gate Screen

Full-screen centered content shown when user is not authenticated.

| Property | Value |
|---|---|
| Layout | Center both axes, `xl` horizontal padding |
| Title | `titleLarge`, `onSurface`, center-aligned |
| Subtitle | `bodyMedium`, `onSurfaceVariant`, center-aligned |
| Button | Primary Action Button variant (pill shape, `borderRadius: 100`) |

## 7. Motion & Animation

| Interaction | Animation |
|---|---|
| Card press | `scale(0.98)`, 100ms ease-out |
| Tab switch | Cross-fade, 200ms |
| Modal open | Fade backdrop 200ms + slide-up sheet 300ms spring |
| Modal close | Reverse of open |
| FAB press | `scale(0.95)` + haptic impact (light) |
| Pull-to-refresh | Native `RefreshControl` with `primary` tint |
| List item appear | No animation (instant render for performance per react-native-optimizer skill) |

## 8. Accessibility

- Minimum touch target: 48x48dp on all interactive elements
- Color contrast: all text meets WCAG 2.1 AA (4.5:1 for body, 3:1 for large text)
- All pressable elements have `accessibilityRole="button"`
- All icons paired with text labels (no icon-only buttons without `accessibilityLabel`)
- `android_ripple` on all Pressable components for Android tactile feedback

## 9. File Architecture for Theme

All design tokens live in `src/theme/tokens.ts`. The redesign replaces the current Valencian flag palette with the PresentUp palette defined in Section 2.

```
src/theme/
  tokens.ts          ← single source of truth for palette, spacing, shape, typography, elevation
```

Components reference tokens by import:
```tsx
import { palette, spacing, shape, typography, elevation } from '@theme/tokens';
```

No component file may contain raw color hex values. All colors come from `palette.*`.
