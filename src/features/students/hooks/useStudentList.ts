import { useInfiniteQuery } from '@tanstack/react-query';

import { studentQueryKeys } from '@features/students/api/queryKeys';
import { useStudentService } from '@features/students/hooks/useStudentService';

const PAGE_SIZE = 10;

export const useStudentList = (query: string) => {
  const service = useStudentService();
  // Use empty string for "all students" query to match mock service behavior
  const searchQuery = query.trim().length > 0 ? query : '';

  return useInfiniteQuery({
    queryKey: studentQueryKeys.list(searchQuery),
    queryFn: ({ pageParam = 0 }) => 
      service.searchStudents({ query: searchQuery, limit: PAGE_SIZE, offset: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.flatMap(page => page).length;
      return lastPage.length === PAGE_SIZE ? loadedCount : undefined;
    },
    initialPageParam: 0,
    staleTime: 0, // Always refetch on mount
  });
};
