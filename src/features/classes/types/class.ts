import { z } from 'zod';

export const CLASS_SCHEDULE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const classScheduleEntrySchema = z
  .object({
    dayOfWeek: z.enum(CLASS_SCHEDULE_DAYS),
    startTime: z.string().regex(timePattern, 'Start time must be in HH:MM format'),
    endTime: z.string().regex(timePattern, 'End time must be in HH:MM format'),
  })
  .refine((entry) => entry.endTime > entry.startTime, {
    message: 'End time must be after the start time',
    path: ['endTime'],
  });

export type ClassScheduleEntry = z.infer<typeof classScheduleEntrySchema>;

export const classSchema = z.object({
  id: z.string(),
  name: z.string(),
  instructorEmail: z.string().email(),
  instructorName: z
    .string()
    .optional()
    .default('')
    .transform((value) => value.trim()),
  minAttendancePercentage: z.number().min(0).max(1).default(0.5),
  schedule: z.array(classScheduleEntrySchema).default([]),
  capacity: z.number().int().positive().nullable().default(null),
  location: z.string().optional().default(''),
  iconName: z.string().optional().default(''),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});

export type ClassEntity = z.infer<typeof classSchema>;

export const createClassInputSchema = z.object({
  name: z.string().trim().min(3, 'Please provide a descriptive name'),
  instructorEmail: z.string().email('Instructor email must be valid'),
  instructorName: z.string().trim().min(2, 'Instructor name must be provided'),
  schedule: z.array(classScheduleEntrySchema).min(1, 'Add at least one meeting'),
  capacity: z
    .number({ invalid_type_error: 'Capacity must be a number' })
    .int('Capacity must be a whole number')
    .positive('Capacity must be greater than zero'),
  minAttendancePercentage: z
    .number({ invalid_type_error: 'Attendance threshold must be a number' })
    .min(0, 'Attendance threshold must be at least 0%')
    .max(1, 'Attendance threshold cannot exceed 100%'),
  location: z.string().trim().optional().default(''),
  iconName: z.string().optional().default(''),
});

export type CreateClassInput = z.infer<typeof createClassInputSchema>;
