import { useMutation, useQueryClient } from '@tanstack/react-query';

import { logger } from '@core/utils/logger';

import { useClassService } from './useClassService';

export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  const classService = useClassService();

  return useMutation({
    mutationFn: async (input: {
      classId: string;
      name: string;
      instructorName: string;
      schedule: { dayOfWeek: string; startTime: string; endTime: string }[];
      capacity: number;
      minAttendancePercentage: number;
      location?: string;
      iconName?: string;
      imageUri?: string;
    }) => {
      logger.debug('[useUpdateClass] Updating class', { classId: input.classId, name: input.name });
      
      await classService.updateClass(
        input.classId,
        input.name,
        input.instructorName,
        input.schedule,
        input.capacity,
        input.minAttendancePercentage,
        input.location,
        input.iconName,
        input.imageUri
      );
      
      logger.info('[useUpdateClass] Class updated successfully', { classId: input.classId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
    onError: (error) => {
      logger.error('[useUpdateClass] Failed to update class', { error });
    },
  });
};
