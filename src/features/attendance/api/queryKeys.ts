const ATTENDANCE_ROOT_KEY = ['attendance'] as const;

export const attendanceQueryKeys = {
  all: ATTENDANCE_ROOT_KEY,
  summary: (classId: string) => [...ATTENDANCE_ROOT_KEY, 'summary', classId] as const,
  records: (classId: string) => [...ATTENDANCE_ROOT_KEY, 'records', classId] as const,
};
