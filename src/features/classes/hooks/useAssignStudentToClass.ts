import { useMutation, useQueryClient } from '@tanstack/react-query';

import { logger } from '@core/utils/logger';

import { classQueryKeys } from '../api/queryKeys';
import { useClassService } from './useClassService';

export const useAssignStudentToClass = () => {
  const queryClient = useQueryClient();
  const classService = useClassService();

  return useMutation({
    mutationFn: async ({ classId, studentId }: { classId: string; studentId: string }) => {
      logger.debug('[useAssignStudentToClass] Assigning student to class', { classId, studentId });
      
      await classService.assignStudentToClass(classId, studentId);
      
      logger.info('[useAssignStudentToClass] Student assigned successfully', { classId, studentId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: classQueryKeys.roster(variables.classId) });
      queryClient.invalidateQueries({ queryKey: ['attendanceSummary', variables.classId] });
    },
    onError: (error) => {
      logger.error('[useAssignStudentToClass] Failed to assign student', { error });
    },
  });
};
