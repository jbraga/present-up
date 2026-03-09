import { useQuery } from '@tanstack/react-query';

import { classQueryKeys } from '@features/classes/api/queryKeys';
import { useClassService } from '@features/classes/hooks/useClassService';

export const useClassRoster = (classId: string | null) => {
  const service = useClassService();

  return useQuery({
    queryKey: classQueryKeys.roster(classId ?? 'unselected'),
    queryFn: () => service.getClassRoster(classId ?? ''),
    enabled: Boolean(classId),
  });
};
