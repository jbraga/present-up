import { DataService } from '@core/services/dataService';
import { logger } from '@core/utils/logger';

import { AttendanceStatus } from '@core/constants/attendance';
import { AttendanceRecord, RecordAttendanceInput } from '@features/attendance/types/attendance';

export class AttendanceService {
  constructor(private readonly dataService: DataService) {}

  getClassSummary(classId: string) {
    return this.dataService.fetchAttendanceSummary(classId);
  }

  recordAttendance(input: RecordAttendanceInput & { instructorEmail: string }) {
    return this.dataService.recordAttendance(
      input.classId,
      input.studentId,
      input.date,
      input.status as AttendanceStatus,
      input.instructorEmail,
      input.notes,
    );
  }

  getClassAttendanceRecords(classId: string): Promise<AttendanceRecord[]> {
    logger.debug('[AttendanceService] Fetching class attendance records', { classId });
    return this.dataService.fetchAttendanceRecords(classId);
  }
}
