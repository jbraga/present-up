import { useSQLiteContext } from 'expo-sqlite';
import { PropsWithChildren, createContext, useContext, useMemo } from 'react';

import { DataService } from '@core/services/dataService';
import { SQLiteService } from '@core/services/sqliteService';

export type ServicesContextValue = {
  dataService: DataService;
};

const ServicesContext = createContext<ServicesContextValue | undefined>(undefined);

export const ServicesProvider = ({ children }: PropsWithChildren) => {
  const db = useSQLiteContext();

  const dataService = useMemo<DataService>(() => {
    return new SQLiteService(db);
  }, [db]);

  const value = useMemo<ServicesContextValue>(() => ({ dataService }), [dataService]);

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
};

export const useServices = () => {
  const context = useContext(ServicesContext);

  if (!context) {
    throw new Error('useServices must be used within a ServicesProvider');
  }

  return context;
};
