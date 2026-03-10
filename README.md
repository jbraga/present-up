# Present Up

Present Up is a local-first mobile app for class and attendance management built with Expo + React Native.

It helps instructors:

- manage classes and student records
- assign students to class rosters
- record attendance by day
- review monthly attendance summaries
- generate, download, and share monthly attendance reports

All data is stored locally in SQLite.

## Core Features

- Class management (create, edit, remove, roster assignment)
- Student management (create, edit, search, remove)
- Attendance tracking with daily and monthly views
- Monthly report generation (PDF) with localized labels
- In-app feedback using shared toast notifications
- Multi-language UI (`en`, `es`, `pt-BR`)

## Tech Stack

- Expo SDK 54
- React Native 0.81 + React 19
- Expo Router (file-based navigation)
- TypeScript (strict mode)
- TanStack Query
- Expo SQLite
- i18next + react-i18next + expo-localization
- Expo Print + Expo Sharing (report generation/sharing)
- Jest + React Native Testing Library

## App Architecture

### Routing

- `app/index.tsx` redirects to `/(tabs)/classes`
- Bottom tabs live in `app/(tabs)/_layout.tsx`
- Main tabs:
  - `classes`
  - `attendance`
  - `students`

### Providers

Root providers are composed in `app/_layout.tsx`:

1. `AppProviders` (`src/application/providers/AppProviders.tsx`)
   - `SQLiteProvider` with startup migration execution
   - `QueryClientProvider` (TanStack Query)
   - `ServicesProvider` (injects app data service)
2. `ToastProvider` (`src/shared/components/ToastProvider.tsx`)
3. `ThemeProvider` (React Navigation theme)

### Data Layer

- `ServicesProvider` exposes a `dataService` implementation (`SQLiteService`) via context
- Database bootstrapping runs in `initializeDatabase` and `runMigrations`
- Migrations are tracked in `schema_migrations`

## Project Structure

```text
app/
  _layout.tsx
  index.tsx
  (tabs)/
    _layout.tsx
    attendance/
    classes/
    students/

src/
  application/
    providers/
  core/
    constants/
    database/
    services/
    utils/
  features/
    attendance/
    classes/
    students/
  shared/
    components/
    hooks/
    localization/
    utils/
  theme/
```

## Localization

- i18n setup: `src/shared/localization/i18n.ts`
- Locale files:
  - `src/shared/localization/locales/en.json`
  - `src/shared/localization/locales/es.json`
  - `src/shared/localization/locales/pt-BR.json`
- Default language comes from device locale; fallback is English.

When adding user-facing text, add keys to all locale files and use `t('...')` from `useTranslation`.

## Shared UX Patterns

- Lightweight user feedback uses `ToastProvider` + `useToast`
- Destructive actions use `ConfirmationDialog` (bottom-sheet style)
- Visual consistency uses centralized design tokens in `src/theme/tokens.ts`

## Database Model

Primary tables:

- `classes`
- `students`
- `class_roster`
- `attendance_logs`
- `schema_migrations`

Migrations run automatically on app startup (`src/core/database/migrations.ts`).

## Path Aliases

TypeScript path aliases are configured in `tsconfig.json`:

- `@application/*`
- `@core/*`
- `@features/*`
- `@shared/*`
- `@theme/*`

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm
- Expo-compatible simulator/emulator or Expo Go

### Install & Run

```bash
npm install
npm run start
```

Then run a target:

- `npm run ios`
- `npm run android`
- `npm run web`

## Available Scripts

- `npm run start` — start Expo dev server
- `npm run ios` — run iOS target
- `npm run android` — run Android target
- `npm run web` — run web target
- `npm run lint` — run ESLint on `app` and `src`
- `npm run lint:fix` — apply ESLint auto-fixes
- `npm run test` — run tests once
- `npm run test:watch` — run tests in watch mode
- `npm run format` — check formatting with Prettier
- `npm run format:write` — format project with Prettier

## Quality Checks

Recommended before committing:

```bash
npm run lint
npx tsc --noEmit
npm run test
```

## Notes

- The app currently uses a local profile constant for MVP workflows (`src/core/constants/profile.ts`).
- No external API keys are required for local development.
