import { useMutation, useQueryClient } from '@tanstack/react-query';

import { LOCAL_PROFILE } from '@core/constants/profile';
import { attendanceQueryKeys } from '@features/attendance/api/queryKeys';
import { useAttendanceService } from '@features/attendance/hooks/useAttendanceService';
import { recordAttendanceInputSchema } from '@features/attendance/types/attendance';

export const useRecordAttendance = () => {
  const service = useAttendanceService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: unknown) => {
      const parsed = recordAttendanceInputSchema.parse(input);
      return service.recordAttendance({ ...parsed, instructorEmail: LOCAL_PROFILE.email });
    },
    onSuccess: (_, variables) => {
      const classId = (variables as { classId: string }).classId;
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.summary(classId) });
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.records(classId) });
    },
  });
};
