# Attendance Management App

React Native (Expo) application for instructors to manage classes, students, and attendance directly against a Google Sheets backend. The app enforces a 50% minimum attendance policy and surfaces at-risk students each month.

## Tech Stack

- React Native + Expo Router
- TypeScript
- Zustand for state management
- TanStack Query for data fetching and caching
- Expo Auth Session + Secure Store for Google OAuth
- Google Sheets API as the persistence layer
- Jest + React Native Testing Library for automated tests

## Getting Started

```bash
npm install
npm run start       # launches Expo dev server
```

### Required Environment Setup

1. **Google Cloud project**
    - Enable the Google Sheets API and Google Drive API.
    - Create OAuth client IDs for Android, iOS, and Web.
2. **Update `app.json`** with your credentials and sheet meta data:

    ```json
    "extra": {
       "environment": "development",
       "google": {
          "androidClientId": "<android-client-id>",
          "iosClientId": "<ios-client-id>",
          "webClientId": "<web-client-id>"
       },
       "sheets": {
          "spreadsheetId": "<spreadsheet-id>",
          "classesRange": "Classes!A:G",
          "studentsRange": "Students!A:I",
          "rosterRange": "ClassRoster!A:C",
          "attendanceRange": "Attendance!A:G"
       }
    }
    ```

3. **Spreadsheet structure** (first row = headers):

    - `Classes!A:G` → `ClassId,Name,InstructorEmail,MinAttendanceThreshold,Schedule,CreatedAt,UpdatedAt`
    - `Students!A:I` → `StudentId,FirstName,LastName,PreferredName,Email,GuardianEmail,PhoneNumber,CreatedAt,UpdatedAt`
    - `ClassRoster!A:C` → `ClassId,StudentId,AssignedAt`
    - `Attendance!A:G` → `RecordId,ClassId,StudentId,Date,Status,Notes,RecordedBy`

4. Configure OAuth redirect URIs for Expo (development) and standalone builds as described in the Expo [Google auth guide](https://docs.expo.dev/guides/google-authentication/).

## NPM Scripts

- `npm run start` – Expo dev server
- `npm run android` / `npm run ios` / `npm run web`
- `npm run lint` / `npm run lint:fix`
- `npm run test` / `npm run test:watch`
- `npm run format` / `npm run format:write`

## Architecture Overview

```
src/
   app/            # Global providers and navigation helpers
   core/           # Config, constants, errors, services shared across features
   features/
      auth/         # Google OAuth context, store, and hooks
      classes/      # Class domain logic, queries, UI
      students/     # Student management, auto-complete, persistence
      attendance/   # Attendance recording and reporting flows
   shared/         # Reusable hooks, utilities, and presentation components
```

- **State & Data**: Zustand handles auth session state. TanStack Query manages Google Sheets data with feature-specific keys.
- **Services**: `GoogleSheetsService` centralizes REST calls and parsing logic, wrapped by feature services (classes, attendance, students).
- **UI**: Feature-oriented components live near their logic. Dialogs and list components are reusable and testable.

## Testing

```
npm run test
```

Tests use Jest with `jest-expo` and React Native Testing Library (`src/features/classes/components/__tests__` contains the initial sample).

## Next Steps

- Configure actual Google credentials and sheet IDs.
- Expand test coverage across hooks and services.
- Implement offline caching or optimistic updates if instructors require offline access.
- Wire monthly automation that highlights students falling below the attendance threshold.
