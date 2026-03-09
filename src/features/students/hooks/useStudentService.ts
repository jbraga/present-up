import { useMemo } from 'react';

import { useServices } from '@application/providers/ServicesProvider';

import { StudentService } from '@features/students/services/studentService';

export const useStudentService = () => {
  const { dataService } = useServices();

  return useMemo(() => new StudentService(dataService), [dataService]);
};
