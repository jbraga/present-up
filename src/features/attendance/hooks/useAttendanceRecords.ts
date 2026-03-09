import { useQuery } from '@tanstack/react-query';

import { useAttendanceService } from '@features/attendance/hooks/useAttendanceService';

import { attendanceQueryKeys } from '@features/attendance/api/queryKeys';

export const useAttendanceRecords = (classId: string | null) => {
  const service = useAttendanceService();

  return useQuery({
  queryKey: attendanceQueryKeys.records(classId ?? 'unselected'),
  queryFn: () => service.getClassAttendanceRecords(classId ?? ''),
    enabled: Boolean(classId),
  });
};
