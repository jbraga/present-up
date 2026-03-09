# PresentUp — Local Database Migration Plan

## Overview

Replace Google Sheets as the data backend with a local SQLite database via `expo-sqlite`. This eliminates external API dependencies, removes rate limits, enables full CRUD operations (several are unimplemented in the Sheets service), and provides offline-first capability with ACID compliance.

## Current State

### Architecture

```
UI (React Native) → React Query → Feature Services → SheetsService interface → GoogleSheetsService / MockGoogleSheetsService
```

- **`SheetsService`** interface (`src/core/services/googleSheetsService.ts`) defines 16 methods — the sole boundary between the app and data storage.
- **`GoogleSheetsService`** — Production implementation. Hits Google Sheets API via OAuth token. Several methods are unimplemented (`updateClass`, `unassignStudentFromClass`, `deleteStudents`, `deleteClasses`).
- **`MockGoogleSheetsService`** — In-memory arrays/maps. Fully implemented. Used in dev mode.
- **Feature services** (`StudentService`, `ClassService`, `AttendanceService`) are thin wrappers that delegate directly to `SheetsService`.
- **`ServicesProvider`** — React context that instantiates mock or real service based on auth mode.

### Data Model (4 tables)

| Table | Columns | Notes |
|---|---|---|
| **classes** | id, name, instructorEmail, instructorName, minAttendancePercentage, schedule (JSON), capacity, location, iconName, imageUri, createdAt, updatedAt | Schedule is a JSON array of `{ dayOfWeek, startTime, endTime }` |
| **students** | id, firstName, lastName, preferredName, email, guardianEmail, phoneNumber, createdAt, updatedAt | |
| **class_roster** | classId, studentId, assignedAt | Junction table. Composite key: (classId, studentId) |
| **attendance_logs** | id, classId, studentId, date, status, notes, recordedBy | Status enum: `present`, `absent`, `excused` |

### Operations by Feature

**Classes:** fetchClasses, createClass, updateClass, deleteClasses
**Students:** fetchStudentsByQuery, fetchStudentsByIds, upsertStudent, deleteStudents
**Roster:** fetchClassRoster, assignStudentToClass, unassignStudentFromClass
**Attendance:** recordAttendance, fetchAttendanceSummary, fetchAttendanceRecords

---

## Target State

```
UI (React Native) → React Query → Feature Services → SheetsService interface → SQLiteService
```

The only change is the implementation behind the `SheetsService` interface. Everything upstream (hooks, screens, components) remains untouched.

### Why SQLite (via expo-sqlite)

| Criterion | SQLite | Supabase / Firestore | Google Sheets |
|---|---|---|---|
| Offline support | Native | Requires sync layer | None |
| ACID transactions | Yes | Yes (server-side) | No |
| Rate limits | None | Generous but present | 300 req/min |
| Infrastructure cost | $0 | Free tier, then paid | $0 |
| Server required | No | Yes (managed) | No (but API) |
| Full CRUD | Yes | Yes | Partial (append-only) |
| Schema enforcement | SQL constraints + FK | DB-level | None (client Zod only) |
| Setup complexity | `npx expo install expo-sqlite` | Account + project + config | OAuth + spreadsheet setup |
| Data stays on device | Yes | No (cloud) | No (cloud) |

**Decision:** SQLite is the right choice for this stage. It solves every pain point of Google Sheets without introducing server infrastructure. If the app later needs multi-device sync or multi-tenant support, a cloud backend can be added as a sync target on top of the local DB.

---

## Migration Phases

### Phase 1: Foundation — SQLite Setup & Schema

**Goal:** Install expo-sqlite, create the database helper, define the schema with proper constraints and indexes.

**Files to create:**
- `src/core/database/database.ts` — Database singleton, initialization, migration runner
- `src/core/database/schema.ts` — SQL DDL statements, version tracking
- `src/core/database/migrations/001_initial.ts` — Initial schema creation

**Schema DDL:**

```sql
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  instructor_email TEXT NOT NULL,
  instructor_name TEXT NOT NULL DEFAULT '',
  min_attendance_percentage REAL NOT NULL DEFAULT 0.5,
  schedule TEXT NOT NULL DEFAULT '[]',
  capacity INTEGER,
  location TEXT NOT NULL DEFAULT '',
  icon_name TEXT NOT NULL DEFAULT '',
  image_uri TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_classes_instructor ON classes(instructor_email);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  preferred_name TEXT,
  email TEXT,
  guardian_email TEXT,
  phone_number TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_students_name ON students(first_name, last_name);

CREATE TABLE IF NOT EXISTS class_roster (
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assigned_at TEXT,
  PRIMARY KEY (class_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_roster_class ON class_roster(class_id);
CREATE INDEX IF NOT EXISTS idx_roster_student ON class_roster(student_id);

CREATE TABLE IF NOT EXISTS attendance_logs (
  id TEXT PRIMARY KEY NOT NULL,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'excused')),
  notes TEXT,
  recorded_by TEXT NOT NULL,
  UNIQUE(class_id, student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance_logs(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance_logs(class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_logs(student_id);
```

**Key decisions:**
- `snake_case` column names in SQL, mapped to `camelCase` in TypeScript by the service layer.
- `schedule` stored as JSON text (parsed by the service).
- `UNIQUE(class_id, student_id, date)` on attendance_logs enables upsert behavior (INSERT OR REPLACE).
- Foreign keys with `ON DELETE CASCADE` for referential integrity.
- Version-based migration system for future schema changes.

**Acceptance criteria:**
- `expo-sqlite` installed
- Database initializes on app start
- Schema created with all tables, indexes, and constraints
- Migration system supports versioned upgrades

---

### Phase 2: SQLiteService — Implement the Interface

**Goal:** Create `SQLiteService` that implements the existing `SheetsService` interface using SQLite queries.

**File to create:**
- `src/core/services/sqliteService.ts`

**Implementation notes per method:**

| Method | SQL Strategy |
|---|---|
| `fetchClasses(email)` | `SELECT * FROM classes WHERE instructor_email = ? COLLATE NOCASE` |
| `createClass(input)` | `INSERT INTO classes ...` with generated ID and timestamps |
| `updateClass(...)` | `UPDATE classes SET ... WHERE id = ?` |
| `deleteClasses(ids)` | `DELETE FROM classes WHERE id IN (...)` — cascade handles roster/attendance |
| `upsertStudent(input)` | `INSERT OR REPLACE INTO students ...` |
| `fetchStudentsByQuery(q)` | `SELECT * FROM students WHERE first_name || ' ' || last_name LIKE ? ORDER BY first_name, last_name LIMIT ? OFFSET ?` |
| `fetchStudentsByIds(ids)` | `SELECT * FROM students WHERE id IN (...)` |
| `deleteStudents(ids)` | `DELETE FROM students WHERE id IN (...)` — cascade handles roster/attendance |
| `assignStudentToClass` | `INSERT OR IGNORE INTO class_roster ...` |
| `unassignStudentFromClass` | `DELETE FROM class_roster WHERE class_id = ? AND student_id = ?` |
| `fetchClassRoster(classId)` | `SELECT student_id FROM class_roster WHERE class_id = ?` |
| `recordAttendance(...)` | `INSERT OR REPLACE INTO attendance_logs ...` (upsert on unique constraint) |
| `fetchAttendanceRecords(classId)` | `SELECT * FROM attendance_logs WHERE class_id = ?` |
| `fetchAttendanceSummary(classId)` | Aggregate query with `GROUP BY student_id`, `SUM(CASE ...)` for counts |

**`fetchAttendanceSummary` optimized query:**

```sql
SELECT
  class_id AS classId,
  student_id AS studentId,
  SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS sessionsAttended,
  SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS sessionsMissed,
  SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) AS sessionsExcused,
  COUNT(*) AS totalSessions,
  CAST(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS REAL) / COUNT(*) AS attendanceRate
FROM attendance_logs
WHERE class_id = ?
GROUP BY student_id
```

**Acceptance criteria:**
- All 16 `SheetsService` methods implemented (including the 4 that were unimplemented in Google Sheets)
- Row mapping produces the exact same TypeScript entity shapes as the existing mock
- Zod validation applied on output where the existing service does so

---

### Phase 3: Wire Up — Swap the Provider

**Goal:** Replace `GoogleSheetsService` with `SQLiteService` in `ServicesProvider`. Remove mock mode entirely — SQLite is now the single data source for all environments.

**Files to modify:**
- `src/application/providers/ServicesProvider.tsx` — Import `SQLiteService`, remove mock mode conditional, remove `MockGoogleSheetsService` import
- `src/core/config/env.ts` — Remove `SheetsConfig` and Google Sheets config

**New provider logic:**

```typescript
const sheetsService = useMemo<SheetsService>(() => {
  return new SQLiteService(database);
}, [database]);
```

**Database initialization:** The database instance should be created and initialized (schema migrations run) before the provider renders. Options:
1. **Eager init in `_layout.tsx`** — call `initDatabase()` before rendering, show splash until ready
2. **Lazy init in provider** — init on first access, block with loading state

Recommendation: **Option 1** — initialize during the existing splash screen wait (alongside font loading).

**Acceptance criteria:**
- App starts using SQLite for all data operations in all environments
- Mock mode is fully removed — no conditional branching between mock and real services
- No changes required in any feature service, hook, or component

---

### Phase 4: Delete Mocks, Google OAuth & Auth Infrastructure

**Goal:** Remove all mock data, mock services, mock mode, Google OAuth code, and the entire auth gate. The app becomes a local-only tool with no sign-in requirement. SQLite is the sole data layer.

#### 4a: Identity Replacement Strategy

Google OAuth currently provides the instructor's email, used for:
- **Filtering classes** — `fetchClasses(instructorEmail)` returns only that instructor's classes
- **Creating classes** — `instructorEmail` is a required field on `ClassEntity`
- **Recording attendance** — `recordedBy` field on attendance logs

**Decision:** Since this is now a local-only app (single user, single device), the `instructorEmail` filter is unnecessary — all local classes belong to the user. The replacement strategy:

| Usage | Before (Google OAuth) | After (Local) |
|---|---|---|
| `fetchClasses(email)` | Filter by logged-in user's email | Return ALL classes (no filter) or use a local default email |
| `createClass({ instructorEmail })` | From Google profile | Use `'local@presentup.app'` constant or empty string |
| `recordAttendance({ recordedBy })` | From Google profile | Use `'local@presentup.app'` constant |
| `useAuthContext().user` | Google profile object | Replace with a static local profile or remove entirely |
| `useAuthContext().isAuthenticated` | OAuth token check | Always `true` (no auth gate) |
| Login screen / auth gate | Google Sign-In button | Remove entirely — app opens directly to tabs |

**Local profile constant:**
```typescript
// src/core/constants/profile.ts
export const LOCAL_PROFILE = {
  email: 'local@presentup.app',
  name: 'Instructor',
} as const;
```

#### 4b: Files to Delete

- `src/mocks/services/mockSheetsService.ts` — Entire mock service
- `src/mocks/` — Entire mocks directory
- `src/features/auth/context/AuthProvider.tsx` — Entire Google OAuth provider
- `src/features/auth/store/useAuthStore.ts` — Zustand auth store
- `src/features/auth/types/auth.ts` — InstructorProfile type (if only used for OAuth)
- `src/core/storage/secureStorage.ts` — If only used for OAuth token persistence
- Any login/auth-gate screens

#### 4c: Files to Modify

- `src/application/providers/AppProviders.tsx` — Remove `AuthProvider` wrapper
- `src/application/providers/ServicesProvider.tsx` — Remove `isMockMode`, `useAuthContext`, `useAuthStore` imports; SQLiteService needs no auth token
- `src/features/classes/hooks/useClassList.ts` — Remove `useAuthContext()`, pass no email or use `LOCAL_PROFILE.email`
- `src/features/classes/hooks/useCreateClass.ts` — Use `LOCAL_PROFILE.email` instead of `user.email`
- `src/features/attendance/hooks/useRecordAttendance.ts` — Use `LOCAL_PROFILE.email` for `recordedBy`
- `src/features/attendance/components/RecordAttendanceDialog.tsx` — Remove `useAuthContext()`, use local profile
- `app/(tabs)/attendance.tsx` — Remove `useAuthContext()` usage
- `app/(tabs)/classes/index.tsx` — Remove `useAuthContext()` usage
- `app/(tabs)/students/index.tsx` — Remove `useAuthContext()` usage
- `SQLiteService.fetchClasses()` — Remove email filter or make it optional (return all classes)

#### 4d: Verification

- `grep -r 'mock' src/ --include='*.ts' --include='*.tsx' -i` — zero hits for mock services
- `grep -r 'MockGoogleSheetsService' src/` — zero hits
- `grep -r 'useAuthContext' src/` — zero hits
- `grep -r 'useAuthStore' src/` — zero hits
- `grep -r 'expo-auth-session' src/` — zero hits
- `grep -r 'GoogleSignin\|google-signin' src/` — zero hits
- App opens directly to tabs with no login screen

**Acceptance criteria:**
- Zero mock service code in the codebase
- Zero Google OAuth code in the codebase
- No login screen — app opens directly to main tabs
- No `isMockMode` or `isAuthenticated` conditional branching
- All features work using the local profile constant
- App starts with an empty SQLite database on first launch

---

### Phase 5: Cleanup — Remove Google Sheets, Google Packages & Rename Interface

**Goal:** Remove all Google Sheets code, Google OAuth packages, config, environment variables, and rename the service interface.

**Files to delete:**
- `src/core/services/googleSheetsService.ts` — Entire file (extract `SheetsService` interface to its own file first)
- `src/core/constants/google.ts` — Google API base URL constant
- `src/features/auth/` — Entire auth feature directory (if not already deleted in Phase 4)

**Files to create:**
- `src/core/services/dataService.ts` — The extracted `DataService` interface (renamed from `SheetsService`)

**Files to modify:**
- `src/core/config/env.ts` — Remove `SheetsConfig`, `GoogleOAuthConfig`, `getSheetsConfig()`, `getGoogleOAuthConfig()`. Simplify to only contain non-Google config.
- `app.config.ts` or `app.json` — Remove `sheets` and `google` extra config sections
- `src/application/providers/ServicesProvider.tsx` — Remove `GoogleSheetsService` import, rename `sheetsService` → `dataService`
- `src/application/providers/AppProviders.tsx` — Remove `AuthProvider` if not already done in Phase 4
- `.env` / `.env.example` — Remove spreadsheet ID, range variables, Google OAuth client IDs
- All feature services (`studentService.ts`, `classService.ts`, `attendanceService.ts`) — Update import from `SheetsService` → `DataService`, rename constructor param
- All hooks that reference `sheetsService` — Update to `dataService`

**Packages to uninstall:**
- `expo-auth-session` — Google OAuth flow
- `expo-web-browser` — OAuth redirect handling (check if used elsewhere first)
- `@react-native-google-signin/google-signin` — If present in package.json
- Any other Google-specific packages no longer needed

**Interface rename (required):**
- `SheetsService` → `DataService`
- `sheetsService` → `dataService` throughout
- `ServicesContextValue.sheetsService` → `ServicesContextValue.dataService`

This is a systematic find-and-replace across ~15-20 files.

**Acceptance criteria:**
- Zero references to Google Sheets in the codebase
- Zero references to Google OAuth, Google Sign-In, or `expo-auth-session` in the codebase
- Zero references to `SheetsService` or `sheetsService` — all renamed to `DataService`/`dataService`
- Google-related npm packages uninstalled
- `expo-sqlite` is the sole data layer
- App compiles with zero TypeScript errors and all operations work
- No login screen or auth gate remains

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Data loss on app uninstall | SQLite lives on-device. Document this. Future: add cloud backup/export. |
| Schema migration bugs | Version-based migrations with rollback support. Test each migration in isolation. |
| expo-sqlite API changes | Pin the package version. expo-sqlite is stable and well-maintained. |
| Performance with large datasets | SQLite handles millions of rows. Indexes on all query columns. Not a concern at this scale. |
| Multi-device sync | Out of scope for Phase 1. Can be layered on later (e.g., Supabase sync, CouchDB). |

## Dependency Changes

| Action | Package | Version |
|---|---|---|
| **Install** | `expo-sqlite` | Latest compatible with current Expo SDK |
| **Remove (Phase 5)** | Google Sheets API usage | — |
| **Remove (Phase 5)** | `expo-auth-session` | Google OAuth flow |
| **Remove (Phase 5)** | `expo-web-browser` | OAuth redirect handling (verify no other usage) |
| **Remove (Phase 5)** | `@react-native-google-signin/google-signin` | Google Sign-In (if present) |

## Estimated Effort

| Phase | Effort | Dependencies |
|---|---|---|
| Phase 1: Foundation | ~2 hours | None |
| Phase 2: SQLiteService | ~3 hours | Phase 1 |
| Phase 3: Wire Up | ~1 hour | Phase 2 |
| Phase 4: Delete Mocks + OAuth + Auth | ~3 hours | Phase 3 |
| Phase 5: Cleanup + Uninstall Packages | ~2 hours | Phase 4 confirmed working |
| **Total** | **~11 hours** | |

## Success Criteria

- [ ] All existing app functionality works identically with SQLite
- [ ] All 16 `SheetsService` methods are fully implemented (vs. 12 with Google Sheets)
- [ ] Zero TypeScript errors
- [ ] Database schema has proper constraints, indexes, and foreign keys
- [ ] Migration system supports future schema changes
- [ ] Zero mock service code or mock mode conditionals remain in the codebase
- [ ] No Google Sheets code remains in the codebase
- [ ] No Google OAuth code, auth gate, or login screen remains
- [ ] Google-related npm packages fully uninstalled
- [ ] `SheetsService` renamed to `DataService` throughout
- [ ] App opens directly to main tabs with no sign-in requirement
