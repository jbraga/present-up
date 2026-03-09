export const ATTENDANCE_STATUS = {
  present: 'PRESENT',
  absent: 'ABSENT',
  excused: 'EXCUSED',
} as const;

export const ATTENDANCE_STATUS_VALUES = Object.values(ATTENDANCE_STATUS) as [
  (typeof ATTENDANCE_STATUS)['present'],
  (typeof ATTENDANCE_STATUS)['absent'],
  (typeof ATTENDANCE_STATUS)['excused'],
];

export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

export const ATTENDANCE_THRESHOLD = 0.5;
