import { AttendanceStatus } from '@core/constants/attendance';

import { AttendanceRecord, AttendanceSummary } from '@features/attendance/types/attendance';
import { ClassEntity, CreateClassInput } from '@features/classes/types/class';
import { StudentEntity, UpsertStudentInput } from '@features/students/types/student';

export interface DataService {
  fetchClasses: (instructorEmail: string) => Promise<ClassEntity[]>;
  createClass: (input: CreateClassInput) => Promise<ClassEntity>;
  updateClass: (
    classId: string,
    name: string,
    instructorName: string,
    schedule: Array<{ dayOfWeek: string; startTime: string; endTime: string }>,
    capacity: number,
    minAttendancePercentage: number,
    location?: string,
    iconName?: string,
    imageUri?: string,
  ) => Promise<void>;
  upsertStudent: (input: UpsertStudentInput) => Promise<StudentEntity>;
  assignStudentToClass: (classId: string, studentId: string) => Promise<void>;
  unassignStudentFromClass: (classId: string, studentId: string) => Promise<void>;
  recordAttendance: (
    classId: string,
    studentId: string,
    date: Date,
    status: AttendanceStatus,
    recordedBy: string,
    notes?: string,
  ) => Promise<void>;
  fetchAttendanceSummary: (classId: string) => Promise<AttendanceSummary[]>;
  fetchAttendanceRecords: (classId: string) => Promise<AttendanceRecord[]>;
  fetchClassRoster: (classId: string) => Promise<string[]>;
  fetchStudentsByQuery: (query: string, limit?: number, offset?: number) => Promise<StudentEntity[]>;
  fetchStudentsByIds: (studentIds: string[]) => Promise<StudentEntity[]>;
  deleteStudents: (studentIds: string[]) => Promise<void>;
  deleteClasses: (classIds: string[]) => Promise<void>;
}
