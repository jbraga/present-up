import { useQuery } from '@tanstack/react-query';

import { attendanceQueryKeys } from '@features/attendance/api/queryKeys';
import { useAttendanceService } from '@features/attendance/hooks/useAttendanceService';

export const useAttendanceSummary = (classId: string | null) => {
  const service = useAttendanceService();
  const queryKey = attendanceQueryKeys.summary(classId ?? 'unselected');

  return useQuery({
    queryKey,
    queryFn: () => (classId ? service.getClassSummary(classId) : Promise.resolve([])),
    enabled: Boolean(classId),
  });
};
