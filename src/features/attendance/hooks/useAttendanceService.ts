import { useMemo } from 'react';

import { useServices } from '@application/providers/ServicesProvider';

import { AttendanceService } from '@features/attendance/services/attendanceService';

export const useAttendanceService = () => {
  const { dataService } = useServices();

  return useMemo(() => new AttendanceService(dataService), [dataService]);
};
