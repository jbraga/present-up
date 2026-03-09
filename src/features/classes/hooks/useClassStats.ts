import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { attendanceQueryKeys } from '@features/attendance/api/queryKeys';
import { useAttendanceService } from '@features/attendance/hooks/useAttendanceService';
import { classQueryKeys } from '@features/classes/api/queryKeys';
import { useClassService } from '@features/classes/hooks/useClassService';
import { ClassEntity } from '@features/classes/types/class';

const JS_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export type ClassStats = {
  totalClasses: number;
  totalStudents: number;
  todaySessions: number;
  attendanceRate: number | null;
  isLoading: boolean;
};

export const useClassStats = (classes: ClassEntity[]): ClassStats => {
  const classService = useClassService();
  const attendanceService = useAttendanceService();

  const classIds = useMemo(() => classes.map((c) => c.id), [classes]);

  const rosterQueries = useQueries({
    queries: classIds.map((classId) => ({
      queryKey: classQueryKeys.roster(classId),
      queryFn: () => classService.getClassRoster(classId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const attendanceQueries = useQueries({
    queries: classIds.map((classId) => ({
      queryKey: attendanceQueryKeys.summary(classId),
      queryFn: () => attendanceService.getClassSummary(classId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoading =
    rosterQueries.some((q) => q.isLoading) || attendanceQueries.some((q) => q.isLoading);

  const totalClasses = classes.length;

  const totalStudents = useMemo(() => {
    const uniqueStudentIds = new Set<string>();
    rosterQueries.forEach((query) => {
      if (query.data) {
        query.data.forEach((studentId) => uniqueStudentIds.add(studentId));
      }
    });
    return uniqueStudentIds.size;
  }, [rosterQueries]);

  const todaySessions = useMemo(() => {
    const todayName = JS_DAY_NAMES[new Date().getDay()];
    return classes.filter((c) =>
      c.schedule.some((entry) => entry.dayOfWeek === todayName),
    ).length;
  }, [classes]);

  const attendanceRate = useMemo(() => {
    let totalAttended = 0;
    let totalSessions = 0;

    attendanceQueries.forEach((query) => {
      if (query.data) {
        query.data.forEach((summary) => {
          totalAttended += summary.sessionsAttended;
          totalSessions += summary.totalSessions;
        });
      }
    });

    if (totalSessions === 0) return null;
    return totalAttended / totalSessions;
  }, [attendanceQueries]);

  return {
    totalClasses,
    totalStudents,
    todaySessions,
    attendanceRate,
    isLoading,
  };
};
