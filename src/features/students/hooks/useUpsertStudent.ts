import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentQueryKeys } from '@features/students/api/queryKeys';
import { useStudentService } from '@features/students/hooks/useStudentService';
import { upsertStudentSchema } from '@features/students/types/student';

export const useUpsertStudent = () => {
  const service = useStudentService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: unknown) => {
      const parsed = upsertStudentSchema.parse(input);
      return service.upsertStudent(parsed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentQueryKeys.all });
    },
  });
};
