import { useMutation, useQueryClient } from '@tanstack/react-query';

import { logger } from '@core/utils/logger';

import { classQueryKeys } from '../api/queryKeys';
import { useClassService } from './useClassService';

export const useUnassignStudentFromClass = () => {
  const queryClient = useQueryClient();
  const classService = useClassService();

  return useMutation({
    mutationFn: async ({ classId, studentId }: { classId: string; studentId: string }) => {
      logger.debug('[useUnassignStudentFromClass] Unassigning student from class', { classId, studentId });
      
      await classService.unassignStudentFromClass(classId, studentId);
      
      logger.info('[useUnassignStudentFromClass] Student unassigned successfully', { classId, studentId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: classQueryKeys.roster(variables.classId) });
      queryClient.invalidateQueries({ queryKey: ['attendanceSummary', variables.classId] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error) => {
      logger.error('[useUnassignStudentFromClass] Failed to unassign student', { error });
    },
  });
};
