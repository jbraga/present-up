import { useQuery } from '@tanstack/react-query';

import { studentQueryKeys } from '@features/students/api/queryKeys';
import { useStudentService } from '@features/students/hooks/useStudentService';

export const useStudentSearch = (query: string, limit = 10) => {
  const service = useStudentService();

  return useQuery({
    queryKey: studentQueryKeys.search(query),
    queryFn: () => service.searchStudents({ query, limit }),
    enabled: query.trim().length > 1,
  });
};
