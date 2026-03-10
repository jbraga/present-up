import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { ATTENDANCE_STATUS } from '@core/constants/attendance';
import { attendanceQueryKeys } from '@features/attendance/api/queryKeys';
import { useAttendanceService } from '@features/attendance/hooks/useAttendanceService';
import { AttendanceRecord } from '@features/attendance/types/attendance';
import { classQueryKeys } from '@features/classes/api/queryKeys';
import { useClassList } from '@features/classes/hooks/useClassList';
import { useClassService } from '@features/classes/hooks/useClassService';
import { ClassEntity } from '@features/classes/types/class';

const JS_DAY_TO_SCHEDULE_DAY = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type SessionStatus = 'completed' | 'in_progress' | 'upcoming' | 'not_recorded';

export type DailyTimelineEntry = {
  classId: string;
  className: string;
  instructorName: string;
  startTime: string;
  endTime: string;
  totalEnrolled: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  hasRecords: boolean;
  sessionStatus: SessionStatus;
  records: AttendanceRecord[];
  studentIds: string[];
};

export type DailyTimelineResult = {
  entries: DailyTimelineEntry[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
};

const computeSessionStatus = (
  startTime: string,
  endTime: string,
  hasRecords: boolean,
  selectedDateStr: string,
  todayStr: string,
): SessionStatus => {
  if (selectedDateStr < todayStr) {
    return hasRecords ? 'completed' : 'not_recorded';
  }

  if (selectedDateStr > todayStr) {
    return 'upcoming';
  }

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (nowMinutes >= endMinutes) {
    return hasRecords ? 'completed' : 'not_recorded';
  }

  if (nowMinutes >= startMinutes) {
    return 'in_progress';
  }

  return 'upcoming';
};

export const useDailyTimeline = (selectedDate: Date): DailyTimelineResult => {
  const classListQuery = useClassList();
  const classService = useClassService();
  const attendanceService = useAttendanceService();

  const classes = useMemo(() => classListQuery.data ?? [], [classListQuery.data]);
  const selectedDayName = JS_DAY_TO_SCHEDULE_DAY[selectedDate.getDay()];
  const selectedDateStr = dateKey(selectedDate);
  const todayStr = dateKey(new Date());

  const scheduledClasses = useMemo(() => {
    return classes
      .map((cls) => {
        const scheduleEntry = cls.schedule.find(
          (entry) => entry.dayOfWeek === selectedDayName,
        );
        if (!scheduleEntry) return null;
        return { cls, scheduleEntry };
      })
      .filter(Boolean) as { cls: ClassEntity; scheduleEntry: ClassEntity['schedule'][number] }[];
  }, [classes, selectedDayName]);

  const classIds = useMemo(
    () => scheduledClasses.map((sc) => sc.cls.id),
    [scheduledClasses],
  );

  const rosterQueries = useQueries({
    queries: classIds.map((classId) => ({
      queryKey: classQueryKeys.roster(classId),
      queryFn: () => classService.getClassRoster(classId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const recordQueries = useQueries({
    queries: classIds.map((classId) => ({
      queryKey: attendanceQueryKeys.records(classId),
      queryFn: () => attendanceService.getClassAttendanceRecords(classId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoading =
    classListQuery.isLoading ||
    rosterQueries.some((q) => q.isLoading) ||
    recordQueries.some((q) => q.isLoading);

  const isError =
    classListQuery.isError ||
    rosterQueries.some((q) => q.isError) ||
    recordQueries.some((q) => q.isError);

  const entries = useMemo(() => {
    return scheduledClasses
      .map((sc, index) => {
        const { cls, scheduleEntry } = sc;

        const roster = rosterQueries[index]?.data ?? [];
        const allRecords = recordQueries[index]?.data ?? [];

        const dateRecords = allRecords.filter(
          (record) => dateKey(record.date) === selectedDateStr,
        );

        const presentCount = dateRecords.filter(
          (r) => r.status === ATTENDANCE_STATUS.present,
        ).length;
        const absentCount = dateRecords.filter(
          (r) => r.status === ATTENDANCE_STATUS.absent,
        ).length;
        const excusedCount = dateRecords.filter(
          (r) => r.status === ATTENDANCE_STATUS.excused,
        ).length;

        const hasRecords = dateRecords.length > 0;

        return {
          classId: cls.id,
          className: cls.name,
          instructorName: cls.instructorName || '',
          startTime: scheduleEntry.startTime,
          endTime: scheduleEntry.endTime,
          totalEnrolled: roster.length,
          presentCount,
          absentCount,
          excusedCount,
          hasRecords,
          sessionStatus: computeSessionStatus(
            scheduleEntry.startTime,
            scheduleEntry.endTime,
            hasRecords,
            selectedDateStr,
            todayStr,
          ),
          records: dateRecords,
          studentIds: roster,
        } satisfies DailyTimelineEntry;
      })
      .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
  }, [scheduledClasses, rosterQueries, recordQueries, selectedDateStr, todayStr]);

  const refetch = () => {
    classListQuery.refetch();
    rosterQueries.forEach((q) => q.refetch());
    recordQueries.forEach((q) => q.refetch());
  };

  return { entries, isLoading, isError, refetch };
};
