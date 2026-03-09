import { useMutation, useQueryClient } from '@tanstack/react-query';

import { LOCAL_PROFILE } from '@core/constants/profile';
import { classQueryKeys } from '@features/classes/api/queryKeys';
import { useClassService } from '@features/classes/hooks/useClassService';
import { createClassInputSchema } from '@features/classes/types/class';

export const useCreateClass = () => {
  const service = useClassService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: unknown) => {
      const parsed = createClassInputSchema.parse({
        ...(typeof input === 'object' && input !== null ? input : {}),
        instructorEmail: LOCAL_PROFILE.email,
      });
      return service.createClass(parsed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classQueryKeys.list(LOCAL_PROFILE.email) });
    },
  });
};
