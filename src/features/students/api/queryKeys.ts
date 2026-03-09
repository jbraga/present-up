const STUDENTS_ROOT_KEY = ['students'] as const;

export const studentQueryKeys = {
  all: STUDENTS_ROOT_KEY,
  list: (query: string) => [...STUDENTS_ROOT_KEY, 'list', query] as const,
  search: (query: string) => [...STUDENTS_ROOT_KEY, 'search', query] as const,
  byIds: (ids: string[]) => [...STUDENTS_ROOT_KEY, 'byIds', ...ids] as const,
};
