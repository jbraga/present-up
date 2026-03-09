import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SQLiteProvider } from 'expo-sqlite';
import { PropsWithChildren, useMemo } from 'react';

import { DATABASE_NAME, initializeDatabase } from '@core/database/database';

import { ServicesProvider } from './ServicesProvider';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 1000 * 30,
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  });

export const AppProviders = ({ children }: PropsWithChildren) => {
  const queryClient = useMemo(createQueryClient, []);

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase}>
      <QueryClientProvider client={queryClient}>
        <ServicesProvider>{children}</ServicesProvider>
      </QueryClientProvider>
    </SQLiteProvider>
  );
};
