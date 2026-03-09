import { useMemo } from 'react';

import { useServices } from '@application/providers/ServicesProvider';

import { ClassService } from '@features/classes/services/classService';

export const useClassService = () => {
  const { dataService } = useServices();

  return useMemo(() => new ClassService(dataService), [dataService]);
};
