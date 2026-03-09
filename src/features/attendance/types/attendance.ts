import { z } from 'zod';

import { ATTENDANCE_STATUS_VALUES } from '@core/constants/attendance';

export const attendanceRecordSchema = z.object({
  id: z.string(),
  classId: z.string(),
  studentId: z.string(),
  date: z.coerce.date(),
  status: z.enum(ATTENDANCE_STATUS_VALUES),
  notes: z.string().optional(),
  recordedBy: z.string().email(),
});

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;

export const recordAttendanceInputSchema = z.object({
  classId: z.string(),
  studentId: z.string(),
  date: z.coerce.date(),
  status: z.enum(ATTENDANCE_STATUS_VALUES),
  notes: z.string().optional(),
});

export type RecordAttendanceInput = z.infer<typeof recordAttendanceInputSchema>;

export const attendanceSummarySchema = z.object({
  classId: z.string(),
  studentId: z.string(),
  sessionsAttended: z.number().int().nonnegative(),
  sessionsMissed: z.number().int().nonnegative(),
  sessionsExcused: z.number().int().nonnegative(),
  totalSessions: z.number().int().nonnegative(),
  attendanceRate: z.number().min(0).max(1),
});

export type AttendanceSummary = z.infer<typeof attendanceSummarySchema>;
