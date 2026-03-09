const CLASSES_ROOT_KEY = ['classes'] as const;

export const classQueryKeys = {
  all: CLASSES_ROOT_KEY,
  list: (instructorEmail: string) => [...CLASSES_ROOT_KEY, 'list', instructorEmail] as const,
  roster: (classId: string) => [...CLASSES_ROOT_KEY, 'roster', classId] as const,
};
