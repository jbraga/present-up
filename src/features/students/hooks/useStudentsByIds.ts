import { useQuery } from '@tanstack/react-query';

import { studentQueryKeys } from '@features/students/api/queryKeys';
import { useStudentService } from '@features/students/hooks/useStudentService';

export const useStudentsByIds = (studentIds: string[]) => {
  const service = useStudentService();
  const sortedIds = [...new Set(studentIds)].sort();

  return useQuery({
    queryKey: studentQueryKeys.byIds(sortedIds),
    queryFn: () => service.fetchStudentsByIds(sortedIds),
    enabled: sortedIds.length > 0,
  });
};
