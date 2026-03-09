import { type SQLiteDatabase } from 'expo-sqlite';

import { ATTENDANCE_STATUS, AttendanceStatus } from '@core/constants/attendance';
import { logger } from '@core/utils/logger';

import {
    AttendanceRecord,
    AttendanceSummary,
} from '@features/attendance/types/attendance';
import {
    ClassEntity,
    ClassScheduleEntry,
    classScheduleEntrySchema,
    CreateClassInput,
} from '@features/classes/types/class';
import { StudentEntity, UpsertStudentInput } from '@features/students/types/student';

import { DataService } from './dataService';

type ClassRow = {
  id: string;
  name: string;
  instructor_email: string;
  instructor_name: string;
  min_attendance_percentage: number;
  schedule: string;
  capacity: number | null;
  location: string;
  icon_name: string;
  image_uri: string;
  created_at: string;
  updated_at: string | null;
};

type StudentRow = {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  guardian_email: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string | null;
};

type AttendanceRow = {
  id: string;
  class_id: string;
  student_id: string;
  date: string;
  status: string;
  notes: string | null;
  recorded_by: string;
};

type AttendanceSummaryRow = {
  class_id: string;
  student_id: string;
  sessions_attended: number;
  sessions_missed: number;
  sessions_excused: number;
  total_sessions: number;
  attendance_rate: number;
};

export class SQLiteService implements DataService {
  constructor(private readonly db: SQLiteDatabase) {}

  async fetchClasses(instructorEmail: string): Promise<ClassEntity[]> {
    const rows = await this.db.getAllAsync<ClassRow>(
      'SELECT * FROM classes WHERE instructor_email = ? COLLATE NOCASE',
      instructorEmail,
    );

    return rows.map((row) => this.mapClassRow(row));
  }

  async createClass(input: CreateClassInput): Promise<ClassEntity> {
    const id = `class_${Date.now()}`;
    const now = new Date().toISOString();

    await this.db.runAsync(
      `INSERT INTO classes (id, name, instructor_email, instructor_name, min_attendance_percentage, schedule, capacity, location, icon_name, image_uri, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      input.name,
      input.instructorEmail,
      input.instructorName,
      input.minAttendancePercentage,
      JSON.stringify(input.schedule ?? []),
      input.capacity ?? null,
      input.location ?? '',
      input.iconName ?? '',
      input.imageUri ?? '',
      now,
      now,
    );

    const row = await this.db.getFirstAsync<ClassRow>(
      'SELECT * FROM classes WHERE id = ?',
      id,
    );

    if (!row) {
      throw new Error(`Failed to create class: row not found after insert (id=${id})`);
    }

    return this.mapClassRow(row);
  }

  async updateClass(
    classId: string,
    name: string,
    instructorName: string,
    schedule: { dayOfWeek: string; startTime: string; endTime: string }[],
    capacity: number,
    minAttendancePercentage: number,
    location?: string,
    iconName?: string,
    imageUri?: string,
  ): Promise<void> {
    const now = new Date().toISOString();

    const result = await this.db.runAsync(
      `UPDATE classes
       SET name = ?, instructor_name = ?, schedule = ?, capacity = ?,
           min_attendance_percentage = ?, location = ?, icon_name = ?,
           image_uri = ?, updated_at = ?
       WHERE id = ?`,
      name,
      instructorName,
      JSON.stringify(schedule),
      capacity,
      minAttendancePercentage,
      location ?? '',
      iconName ?? '',
      imageUri ?? '',
      now,
      classId,
    );

    if (result.changes === 0) {
      throw new Error(`Class with id ${classId} not found`);
    }
  }

  async deleteClasses(classIds: string[]): Promise<void> {
    if (!classIds.length) return;

    const placeholders = classIds.map(() => '?').join(', ');
    await this.db.runAsync(
      `DELETE FROM classes WHERE id IN (${placeholders})`,
      ...classIds,
    );
  }

  async upsertStudent(input: UpsertStudentInput): Promise<StudentEntity> {
    const now = new Date().toISOString();
    const isUpdate = Boolean(input.id);
    const id = input.id ?? `student_${Date.now()}`;

    if (isUpdate) {
      await this.db.runAsync(
        `UPDATE students
         SET first_name = ?, last_name = ?, preferred_name = ?, email = ?,
             guardian_email = ?, phone_number = ?, updated_at = ?
         WHERE id = ?`,
        input.firstName,
        input.lastName,
        input.preferredName ?? null,
        input.email ?? null,
        input.guardianEmail ?? null,
        input.phoneNumber ?? null,
        now,
        id,
      );
    } else {
      await this.db.runAsync(
        `INSERT INTO students (id, first_name, last_name, preferred_name, email, guardian_email, phone_number, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        input.firstName,
        input.lastName,
        input.preferredName ?? null,
        input.email ?? null,
        input.guardianEmail ?? null,
        input.phoneNumber ?? null,
        now,
        now,
      );
    }

    const row = await this.db.getFirstAsync<StudentRow>(
      'SELECT * FROM students WHERE id = ?',
      id,
    );

    if (!row) {
      throw new Error(`Failed to upsert student: row not found after write (id=${id})`);
    }

    return this.mapStudentRow(row);
  }

  async fetchStudentsByQuery(query: string, limit = 10, offset = 0): Promise<StudentEntity[]> {
    const normalized = query.trim().toLowerCase();

    let rows: StudentRow[];

    if (!normalized) {
      rows = await this.db.getAllAsync<StudentRow>(
        'SELECT * FROM students ORDER BY first_name, last_name LIMIT ? OFFSET ?',
        limit,
        offset,
      );
    } else {
      const pattern = `%${normalized}%`;
      rows = await this.db.getAllAsync<StudentRow>(
        `SELECT * FROM students
         WHERE LOWER(first_name || ' ' || last_name) LIKE ?
            OR LOWER(COALESCE(preferred_name, '')) LIKE ?
         ORDER BY first_name, last_name
         LIMIT ? OFFSET ?`,
        pattern,
        pattern,
        limit,
        offset,
      );
    }

    return rows.map((row) => this.mapStudentRow(row));
  }

  async fetchStudentsByIds(studentIds: string[]): Promise<StudentEntity[]> {
    if (!studentIds.length) return [];

    const placeholders = studentIds.map(() => '?').join(', ');
    const rows = await this.db.getAllAsync<StudentRow>(
      `SELECT * FROM students WHERE id IN (${placeholders})`,
      ...studentIds,
    );

    return rows.map((row) => this.mapStudentRow(row));
  }

  async deleteStudents(studentIds: string[]): Promise<void> {
    if (!studentIds.length) return;

    const placeholders = studentIds.map(() => '?').join(', ');
    await this.db.runAsync(
      `DELETE FROM students WHERE id IN (${placeholders})`,
      ...studentIds,
    );
  }

  async assignStudentToClass(classId: string, studentId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      'INSERT OR IGNORE INTO class_roster (class_id, student_id, assigned_at) VALUES (?, ?, ?)',
      classId,
      studentId,
      now,
    );
  }

  async unassignStudentFromClass(classId: string, studentId: string): Promise<void> {
    await this.db.runAsync(
      'DELETE FROM class_roster WHERE class_id = ? AND student_id = ?',
      classId,
      studentId,
    );
  }

  async fetchClassRoster(classId: string): Promise<string[]> {
    const rows = await this.db.getAllAsync<{ student_id: string }>(
      'SELECT student_id FROM class_roster WHERE class_id = ?',
      classId,
    );

    return rows.map((row) => row.student_id);
  }

  async recordAttendance(
    classId: string,
    studentId: string,
    date: Date,
    status: AttendanceStatus,
    recordedBy: string,
    notes?: string,
  ): Promise<void> {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const year = normalizedDate.getFullYear();
    const month = String(normalizedDate.getMonth() + 1).padStart(2, '0');
    const day = String(normalizedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const id = `attendance_${Date.now()}`;

    await this.db.runAsync(
      `INSERT INTO attendance_logs (id, class_id, student_id, date, status, notes, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(class_id, student_id, date) DO UPDATE SET
         status = excluded.status,
         notes = excluded.notes,
         recorded_by = excluded.recorded_by`,
      id,
      classId,
      studentId,
      dateStr,
      status,
      notes ?? null,
      recordedBy,
    );
  }

  async fetchAttendanceRecords(classId: string): Promise<AttendanceRecord[]> {
    const rows = await this.db.getAllAsync<AttendanceRow>(
      'SELECT * FROM attendance_logs WHERE class_id = ?',
      classId,
    );

    return rows.map((row) => this.mapAttendanceRow(row));
  }

  async fetchAttendanceSummary(classId: string): Promise<AttendanceSummary[]> {
    const rows = await this.db.getAllAsync<AttendanceSummaryRow>(
      `SELECT
         class_id,
         student_id,
         SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS sessions_attended,
         SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS sessions_missed,
         SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS sessions_excused,
         COUNT(*) AS total_sessions,
         CASE
           WHEN SUM(CASE WHEN status IN (?, ?) THEN 1 ELSE 0 END) = 0 THEN 1.0
           ELSE CAST(SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS REAL) / SUM(CASE WHEN status IN (?, ?) THEN 1 ELSE 0 END)
         END AS attendance_rate
       FROM attendance_logs
       WHERE class_id = ?
       GROUP BY student_id`,
      ATTENDANCE_STATUS.present,
      ATTENDANCE_STATUS.absent,
      ATTENDANCE_STATUS.excused,
      ATTENDANCE_STATUS.present,
      ATTENDANCE_STATUS.absent,
      ATTENDANCE_STATUS.present,
      ATTENDANCE_STATUS.present,
      ATTENDANCE_STATUS.absent,
      classId,
    );

    return rows.map((row) => ({
      classId: row.class_id,
      studentId: row.student_id,
      sessionsAttended: row.sessions_attended,
      sessionsMissed: row.sessions_missed,
      sessionsExcused: row.sessions_excused,
      totalSessions: row.total_sessions,
      attendanceRate: row.attendance_rate,
    }));
  }

  private mapClassRow(row: ClassRow): ClassEntity {
    return {
      id: row.id,
      name: row.name,
      instructorEmail: row.instructor_email,
      instructorName: row.instructor_name,
      minAttendancePercentage: row.min_attendance_percentage,
      schedule: this.parseSchedule(row.schedule),
      capacity: row.capacity,
      location: row.location,
      iconName: row.icon_name,
      imageUri: row.image_uri,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }

  private mapStudentRow(row: StudentRow): StudentEntity {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      preferredName: row.preferred_name || undefined,
      email: row.email || undefined,
      guardianEmail: row.guardian_email || undefined,
      phoneNumber: row.phone_number || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }

  private mapAttendanceRow(row: AttendanceRow): AttendanceRecord {
    return {
      id: row.id,
      classId: row.class_id,
      studentId: row.student_id,
      date: new Date(row.date),
      status: row.status as AttendanceRecord['status'],
      notes: row.notes || undefined,
      recordedBy: row.recorded_by,
    };
  }

  private parseSchedule(raw: string): ClassScheduleEntry[] {
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((entry) => classScheduleEntrySchema.safeParse(entry))
        .filter((result): result is { success: true; data: ClassScheduleEntry } => result.success)
        .map((result) => result.data);
    } catch (error) {
      logger.warn('[SQLiteService] Failed to parse class schedule', { error });
      return [];
    }
  }
}
