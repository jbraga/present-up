# Present Up

Present Up is an Expo + React Native app for tracking class attendance.

This MVP is optimized for instructors to:

- create and manage classes
- register and manage students
- assign students to classes
- record attendance by day
- review monthly attendance summaries
- generate/share monthly attendance reports

Data is stored locally using SQLite.

## Tech Stack

- Expo SDK 54 + React Native 0.81
- Expo Router
- TypeScript
- TanStack Query
- Expo SQLite
- React Native Paper-style design tokens (custom theme)
- Jest + React Native Testing Library

## Getting Started

```bash
npm install
npm run start
```

Then open with:

- `npm run ios`
- `npm run android`
- `npm run web`

## NPM Scripts

- `npm run start` — start Expo dev server
- `npm run ios` — run iOS target
- `npm run android` — run Android target
- `npm run web` — run web target
- `npm run lint` — run ESLint
- `npm run lint:fix` — apply safe ESLint fixes
- `npm run test` — run test suite once
- `npm run test:watch` — run tests in watch mode
- `npm run format` — check Prettier formatting
- `npm run format:write` — format codebase with Prettier

## Project Structure

```text
app/                  # Expo Router routes/screens
src/
  application/        # app-level providers
  core/               # constants, database, shared services, utils
  features/
    attendance/       # attendance flows, hooks, reporting
    classes/          # class CRUD + roster management
    students/         # student CRUD + search/list flows
  shared/             # reusable UI and hooks
  theme/              # design tokens
```

## Data Model (SQLite)

Main tables:

- `classes`
- `students`
- `class_roster`
- `attendance_logs`
- `schema_migrations`

Database migrations are executed on app startup.

## Notes

- Current profile is local-only (`src/core/constants/profile.ts`) for MVP workflows.
- No external API keys are required for local development.
