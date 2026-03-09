import { useQuery } from '@tanstack/react-query';

import { LOCAL_PROFILE } from '@core/constants/profile';

import { classQueryKeys } from '@features/classes/api/queryKeys';
import { useClassService } from '@features/classes/hooks/useClassService';

export const useClassList = () => {
  const service = useClassService();
  const instructorEmail = LOCAL_PROFILE.email;

  return useQuery({
    queryKey: classQueryKeys.list(instructorEmail),
    queryFn: () => service.getClasses(instructorEmail),
  });
};
