# Attendance View — Production-Ready PRD

## 1. Executive Summary

The Attendance tab is the core workflow for instructors taking daily attendance. The current implementation is partially functional but architecturally misaligned with the concept design and missing critical features for production use.

**Current state:** Class-centric (select one class → view its records by date).
**Target state:** Date-centric daily timeline (select a date → see all scheduled classes for that day, each with attendance status, organized by time).

---

## 2. Current State Audit

### 2.1 What Exists

| Component | Status | Notes |
|---|---|---|
| `ScreenHeader` | ✅ Working | Uses shared component, actions are no-ops |
| `DayPickerStrip` (inline) | ⚠️ Partial | Week navigation works, but no "today" jump button |
| `ClassDropdown` | ❌ Wrong pattern | Selects a single class — conflicts with date-centric concept |
| Timeline view | ⚠️ Partial | Groups records by status (Present/Absent/Excused) for one class on one date |
| `RecordAttendanceDialog` | ⚠️ Partial | Only records for today, sequential saves, styling issues |
| `AttendanceDetailModal` | ⚠️ Partial | Indentation issues, styling inconsistencies |
| Search action | ❌ No-op | `onPress: () => {}` |
| Calendar action | ❌ No-op | `onPress: () => {}` |
| Pull-to-refresh | ❌ Missing | No way to manually refresh data |
| Error states | ❌ Missing | No error handling UI |
| Summary stats | ❌ Missing | No daily attendance overview |

### 2.2 Architecture Gap

The concept design (`screen.png`) envisions a **daily timeline** where:
- Each **class scheduled for the selected day** appears as a timeline entry
- Entries are organized by **start time** (from class schedule)
- Each card shows: class name, attendance fraction, instructor, avatar stack, session status badge
- The view is **cross-class** — no class dropdown needed

In addition to the daily timeline, the view should support a **Month View**:
- Toggle between "Day" and "Month" modes via a Segmented Control.
- The Day Picker Strip becomes a **Month Picker Strip** (scrollable cards for Jan, Feb, Mar, etc., with year navigation).
- When a month is selected, the list shows **Monthly Class Summaries** (aggregated stats for that month per class).
- Tapping a Class Summary Card opens a modal or new view showing the **list of students and their individual monthly attendance stats** (reusing the Class Roster layout).

The current implementation fetches attendance records for **one class at a time** via `ClassDropdown`, then groups by status. This is fundamentally different from the concept.

### 2.3 Data Layer Assessment

| Capability | Available | Source |
|---|---|---|
| List all classes | ✅ | `useClassList()` |
| Class schedule (day + time) | ✅ | `ClassEntity.schedule[]` |
| Attendance records per class | ✅ | `useAttendanceRecords(classId)` |
| Attendance summary per class | ✅ | `useAttendanceSummary(classId)` |
| Student lookup by IDs | ✅ | `useStudentsByIds(ids)` |
| Class roster | ✅ | `useClassRoster(classId)` |
| Record attendance | ✅ | `RecordAttendanceDialog` / `useRecordAttendance()` |
| Batch record attendance | ❌ | Currently sequential in a loop |
| Date-specific attendance query | ❌ | Must filter client-side from full records |

---

## 3. Target Experience

### 3.1 Screen Flow

```
[ScreenHeader: "Attendance" + search + calendar actions]
[DayPickerStrip: horizontal week selector]
[Daily Timeline: all classes for selected day, sorted by start time]
  ├── [TimeCircle: 09:00] → [AttendanceTimelineCard: Advanced Mathematics]
  ├── [TimeCircle: 11:00] → [AttendanceTimelineCard: Quantum Physics Lab]
  └── [TimeCircle: 14:00] → [AttendanceTimelineCard: Art History]
```

### 3.2 Session Status Logic

Each timeline card shows a status badge:

| Status | Condition | Badge Color |
|---|---|---|
| **Completed** | Current time > class end time AND has attendance records | `success` bg, `success` text |
| **In Progress** | Current time between start and end time | `warning` bg, `warning` text |
| **Upcoming** | Current time < class start time | `surfaceDim` bg, `onSurfaceMuted` text |
| **Not Recorded** | Current time > class end time AND no attendance records | `error` bg, `error` text |

### 3.3 Timeline Card Content

Per design identity spec 6.5:
```
[Class Name]                              (titleMedium, 600)
[X/Y Present] • [Instructor Name]        (success/warning + bodySmall)
[Avatar stack]              [StatusBadge]
```

- `X` = students marked present for this class on this date
- `Y` = total enrolled students (from class roster)
- If no attendance recorded: `--/Y Present` in muted color
- Future cards: `opacity: 0.7`

### 3.4 Interaction: Tap Timeline Card

Tapping a card opens the `RecordAttendanceDialog` for that class, pre-populated with the selected date's existing records (if any). This enables both first-time recording and editing.

### 3.5 Search Action

Opens an inline search bar (similar to Students screen) that filters timeline cards by class name or instructor name.

### 3.6 Calendar Action

Opens a calendar modal/picker for jumping to a specific date, updating the DayPickerStrip to show that date's week.

---

## 4. Phased Implementation Plan

### Phase 1: Data Layer — Daily Timeline Hook

**Goal:** Create a hook that aggregates all classes and their attendance for a given date.

**Files to create:**
- `src/features/attendance/hooks/useDailyTimeline.ts`

**Behavior:**
1. Accept a `Date` parameter (selected date).
2. Use `useClassList()` to get all classes.
3. Filter classes whose `schedule[]` includes the selected day of the week.
4. For each matching class, fetch attendance records using `useQueries` with `attendanceQueryKeys.records(classId)`.
5. For each matching class, fetch roster using `useQueries` with `classQueryKeys.roster(classId)`.
6. Filter each class's records to only the selected date.
7. Sort classes by `schedule[].startTime` ascending.
8. Return an array of `DailyTimelineEntry` objects:

```typescript
type SessionStatus = 'completed' | 'in_progress' | 'upcoming' | 'not_recorded';

type DailyTimelineEntry = {
  classId: string;
  className: string;
  instructorName: string;
  startTime: string;       // "HH:MM" from schedule
  endTime: string;         // "HH:MM" from schedule
  totalEnrolled: number;   // roster count
  presentCount: number;    // records with PRESENT status on this date
  absentCount: number;
  excusedCount: number;
  hasRecords: boolean;
  sessionStatus: SessionStatus;
  records: AttendanceRecord[];
  studentIds: string[];    // roster student IDs for avatar display
};
```

**Acceptance criteria:**
- Returns empty array if no classes are scheduled for the selected day.
- `isLoading` is true while any sub-query is loading.
- `sessionStatus` is computed correctly based on current time vs schedule times.
- Records are filtered to the exact selected date (not just the date key match).

---

### Phase 2: Attendance Timeline Card Component

**Goal:** Create a reusable card component matching design identity spec 6.5.

**Files to create:**
- `src/features/attendance/components/AttendanceTimelineCard.tsx`

**Props:**
```typescript
type AttendanceTimelineCardProps = {
  entry: DailyTimelineEntry;
  studentLookup: Record<string, StudentEntity>;
  onPress: (classId: string) => void;
};
```

**Layout (per spec 6.5):**
- Time circle: 48×48dp, primary bg for past/current, surface bg for future, 4px background-color ring
- Content card: same border/shadow as ClassListCard
- Title: `titleMedium`, `fontWeight: 600`
- Attendance line: `[X/Y Present]` in success (≥80%) / warning (<80%) / muted (no records) + dot separator + instructor name
- Avatar stack: overlapping 24dp circles, max 5 + overflow "+N"
- Status badge: per session status logic (section 3.2)
- Future cards: `opacity: 0.7` on the content card

**Acceptance criteria:**
- Matches concept screenshot layout
- Adheres to design identity spec 6.5
- All text uses Lexend font family
- Touch target for card press is full card area (48dp minimum height)

---

### Phase 3: Rewrite Attendance Screen — Timeline Layout

**Goal:** Replace the current class-centric layout with the date-centric daily timeline.

**Files to modify:**
- `app/(tabs)/attendance.tsx` — major rewrite

**Changes:**
1. **Remove** `ClassDropdown` from the screen.
2. **Remove** the current status-grouped timeline (Present/Absent/Excused cards).
3. **Remove** `selectedClassId` state — no longer needed for the main view.
4. **Add** `useDailyTimeline(selectedDate)` hook.
5. **Add** `useStudentsByIds()` for all student IDs across all timeline entries.
6. **Render** `AttendanceTimelineCard` for each `DailyTimelineEntry`, wrapped in the timeline line structure.
7. **Add** pull-to-refresh via `RefreshControl` on the ScrollView.
8. **Update** empty state to say "No classes scheduled for this day" when no classes match.
9. **Keep** the `RecordAttendanceDialog` — triggered by tapping a timeline card.
10. **Keep** `DayPickerStrip` — already functional for date selection.

**Record button behavior change:**
- Current: Single "Record Attendance" button at bottom for the selected class.
- New: Tapping any timeline card opens the RecordAttendanceDialog for that specific class.
- Remove the fixed bottom "Record Attendance" button (it's redundant when every card is tappable).

**Acceptance criteria:**
- Screen shows all scheduled classes for the selected day.
- Classes are sorted by start time.
- Tapping a card opens RecordAttendanceDialog for that class.
- Pull-to-refresh works and reloads all data.
- DayPickerStrip navigation still works (prev/next week, tap day).
- No more ClassDropdown on screen.
- Loading, empty, and error states are handled.

---

### Phase 4: RecordAttendanceDialog Improvements

**Goal:** Fix known issues, support arbitrary dates, improve UX.

**Files to modify:**
- `src/features/attendance/components/RecordAttendanceDialog.tsx`

**Changes:**

1. **Accept a `date` prop** — currently hardcoded to today. The dialog should accept the selected date from the timeline so instructors can record/edit attendance for past dates.

2. **Title fontWeight fix** — change from `600` to `700` per spec 6.15.

3. **Replace text symbols with icons** — change `✓`, `✕`, `J` to `MaterialCommunityIcons`:
   - Present: `check` icon
   - Absent: `close` icon
   - Excused: `clock-outline` icon

4. **Fix hardcoded color** — legend uses `#16a34a` instead of `palette.success`.

5. **Add student avatars** — show initials avatar (primaryContainer style) next to each student name for visual consistency with the rest of the app.

6. **Batch save optimization** — currently saves records in a sequential `for` loop. Convert to `Promise.all()` for parallel execution (acceptable since each record is independent).

7. **Success feedback** — show a brief toast or visual confirmation after saving (currently just closes silently).

8. **Pre-populate existing records** — when opening for a date that already has records, load existing statuses. This already partially works but needs verification for non-today dates.

**Acceptance criteria:**
- Dialog works for any date, not just today.
- All styling matches design spec 6.15.
- Icons replace text symbols.
- Parallel save completes faster than sequential.
- Existing records load correctly for any date.

---

### Phase 5: Search & Calendar Actions

**Goal:** Wire up the currently no-op header action buttons.

#### 5a. Search

**Files to create/modify:**
- `app/(tabs)/attendance.tsx` — add search state and filtering

**Behavior:**
1. Tapping the search icon toggles an inline `SearchInput` (reuse shared component) below the header.
2. Search filters the timeline cards by class name or instructor name (case-insensitive substring match).
3. Closing search (X button or empty query) restores the full timeline.

#### 5b. Calendar

**Files to create/modify:**
- `app/(tabs)/attendance.tsx` — add calendar modal state
- Consider using `react-native-calendars` or a simple custom month grid

**Behavior:**
1. Tapping the calendar icon opens a modal with a month calendar view.
2. Dates that have attendance records are marked with a dot indicator.
3. Selecting a date:
   - Updates `selectedDateKey`
   - Updates `selectedWeekStart` to show that date's week in the DayPickerStrip
   - Closes the calendar modal
4. Month navigation (prev/next) is available within the modal.

**Acceptance criteria:**
- Search filters timeline in real-time as the user types.
- Calendar modal allows jumping to any date.
- DayPickerStrip stays in sync with calendar selection.

---

### Phase 6: Detail Modal & Polish

**Goal:** Clean up the AttendanceDetailModal and overall polish.

**Files to modify:**
- `app/(tabs)/attendance.tsx` — AttendanceDetailModal section

**Changes:**

1. **Fix indentation** — line 730 has inconsistent indentation in the modal overlay.
2. **Add student avatars to detail modal** — group rows currently show plain text names. Add the `primaryContainer` initials avatar for consistency.
3. **Add attendance percentage** — show an overall percentage for the selected date at the top of the detail modal.
4. **Error state UI** — add an error state component for when data fetching fails.
5. **Today shortcut** — add a "Today" button or pill in the DayPickerStrip that quickly jumps back to the current date.
6. **Haptic feedback** — add light haptic impact on status button toggles in RecordAttendanceDialog (per motion spec).

**Acceptance criteria:**
- Detail modal matches design spec 6.15 (maxHeight 80%, title fontWeight 700).
- All student references show avatars.
- Error states are handled gracefully with retry options.
- "Today" shortcut is always accessible.

---

## 5. Out of Scope

These items are explicitly excluded from this PRD:

- **Attendance reports/exports** — future feature, not part of this view
- **Bulk attendance from the Classes tab** — separate flow
- **Push notifications** — separate infrastructure concern
- **Offline support** — requires separate caching strategy
- **Multi-instructor views** — current app is single-instructor

---

## 6. Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                  AttendanceScreen                     │
│                                                       │
│  selectedDate ──► useDailyTimeline(date) ◄── useClassList()
│                        │                              │
│                        ├── useQueries(roster per class)
│                        ├── useQueries(records per class)
│                        │                              │
│                        ▼                              │
│              DailyTimelineEntry[]                     │
│                        │                              │
│            ┌───────────┼───────────┐                 │
│            ▼           ▼           ▼                 │
│     TimelineCard  TimelineCard  TimelineCard         │
│         │                                             │
│         ▼ (on tap)                                   │
│  RecordAttendanceDialog(classId, date)               │
│         │                                             │
│         ▼ (on save)                                  │
│  invalidateQueries → refetch → UI updates            │
└─────────────────────────────────────────────────────┘
```

---

## 7. Testing Strategy

| Phase | Verification |
|---|---|
| Phase 1 | `npx tsc --noEmit`; manual test with mock data — verify correct filtering by day and date |
| Phase 2 | Visual inspection against `screen.png` concept; verify all design tokens match spec 6.5 |
| Phase 3 | Full flow: navigate dates, see timeline update, tap card → dialog opens for correct class |
| Phase 4 | Record attendance for past dates; verify parallel save; verify pre-population |
| Phase 5 | Search filters correctly; calendar jumps to correct date and syncs DayPickerStrip |
| Phase 6 | Detail modal styling; error states; haptic feedback on iOS device |

After each phase: `npx tsc --noEmit` must pass with zero errors.

---

## 8. Risk Assessment

| Risk | Mitigation |
|---|---|
| **Performance with many classes** | `useQueries` with `staleTime: 5min` caching; limit avatar stack to 5 |
| **Date timezone issues** | Use local date components (year/month/day) consistently; avoid `toISOString()` |
| **Breaking existing RecordAttendanceDialog** | Phase 4 is additive (new `date` prop with default); existing callers unaffected |
| **Calendar library dependency** | Prefer custom simple month grid to avoid new dependency; evaluate `react-native-calendars` only if custom is too complex |

---

## 9. Dependencies

- **No new npm packages required** for Phases 1–4 and 6.
- **Phase 5b (Calendar):** Evaluate whether a custom component suffices or if `react-native-calendars` is needed. Decision deferred to implementation.

---

## 10. Reference Files

| File | Purpose |
|---|---|
| `.windsurf/working-context/design-identity.md` §6.5 | Attendance Timeline Card spec |
| `.windsurf/working-context/design-identity.md` §6.6 | Day Picker Strip spec |
| `.windsurf/working-context/design-identity.md` §6.15 | Modal/Dialog spec |
| `.windsurf/working-context/ux/attendance/screen.png` | Visual concept |
| `.windsurf/working-context/ux/attendance/attendance-screen-concept.html` | HTML prototype |
| `app/(tabs)/attendance.tsx` | Current implementation |
| `src/features/attendance/components/RecordAttendanceDialog.tsx` | Current dialog |
| `src/features/attendance/types/attendance.ts` | Data schemas |
| `src/features/classes/types/class.ts` | Class entity with schedule |
