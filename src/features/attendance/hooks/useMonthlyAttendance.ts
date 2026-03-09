import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { ATTENDANCE_STATUS } from '@core/constants/attendance';
import { attendanceQueryKeys } from '@features/attendance/api/queryKeys';
import { useAttendanceService } from '@features/attendance/hooks/useAttendanceService';
import { AttendanceRecord, AttendanceSummary } from '@features/attendance/types/attendance';
import { classQueryKeys } from '@features/classes/api/queryKeys';
import { useClassList } from '@features/classes/hooks/useClassList';
import { useClassService } from '@features/classes/hooks/useClassService';

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export type MonthlyClassSummary = {
  classId: string;
  className: string;
  instructorName: string;
  totalEnrolled: number;
  totalSessionsRecorded: number;
  attendanceRate: number;
  studentSummaries: Record<string, AttendanceSummary>;
  studentIds: string[];
  minAttendancePercentage: number;
  monthRecords: AttendanceRecord[];
};

export const useMonthlyAttendance = (selectedMonth: Date) => {
  const classListQuery = useClassList();
  const classService = useClassService();
  const attendanceService = useAttendanceService();

  const classes = useMemo(() => classListQuery.data ?? [], [classListQuery.data]);
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();

  const classIds = useMemo(() => classes.map((c) => c.id), [classes]);

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
    return classes.map((cls, index) => {
      const roster = rosterQueries[index]?.data ?? [];
      const allRecords = recordQueries[index]?.data ?? [];

      const monthRecords = allRecords.filter((record) => {
        const d = new Date(record.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });

      const distinctDates = new Set(monthRecords.map((r) => dateKey(r.date))).size;

      const presentCount = monthRecords.filter((r) => r.status === ATTENDANCE_STATUS.present).length;
      const absentCount = monthRecords.filter((r) => r.status === ATTENDANCE_STATUS.absent).length;
      const ratedSessions = presentCount + absentCount;
      const attendanceRate = ratedSessions > 0 ? presentCount / ratedSessions : 1;

      const studentSummaries: Record<string, AttendanceSummary> = {};
      for (const studentId of roster) {
        const studentRecords = monthRecords.filter((r) => r.studentId === studentId);
        const sp = studentRecords.filter((r) => r.status === ATTENDANCE_STATUS.present).length;
        const sa = studentRecords.filter((r) => r.status === ATTENDANCE_STATUS.absent).length;
        const se = studentRecords.filter((r) => r.status === ATTENDANCE_STATUS.excused).length;
        const st = studentRecords.length;

        studentSummaries[studentId] = {
          classId: cls.id,
          studentId,
          sessionsAttended: sp,
          sessionsMissed: sa,
          sessionsExcused: se,
          totalSessions: st,
          attendanceRate: sp + sa > 0 ? sp / (sp + sa) : 1,
        };
      }

      return {
        classId: cls.id,
        className: cls.name,
        instructorName: cls.instructorName || '',
        totalEnrolled: roster.length,
        totalSessionsRecorded: distinctDates,
        attendanceRate,
        studentSummaries,
        studentIds: roster,
        minAttendancePercentage: cls.minAttendancePercentage,
        monthRecords,
      } satisfies MonthlyClassSummary;
    });
  }, [classes, rosterQueries, recordQueries, year, month]);

  const refetch = () => {
    classListQuery.refetch();
    rosterQueries.forEach((q) => q.refetch());
    recordQueries.forEach((q) => q.refetch());
  };

  return { entries, isLoading, isError, refetch };
};
