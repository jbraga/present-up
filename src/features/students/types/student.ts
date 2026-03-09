import { z } from 'zod';

export const studentSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  preferredName: z.string().optional(),
  email: z.string().email().optional(),
  guardianEmail: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});

export type StudentEntity = z.infer<typeof studentSchema>;

export const upsertStudentSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  preferredName: z.string().optional(),
  email: z.string().email().optional(),
  guardianEmail: z.string().email().optional(),
  phoneNumber: z.string().optional(),
});

export type UpsertStudentInput = z.infer<typeof upsertStudentSchema>;

export const searchStudentSchema = z.object({
  query: z.string(),
  limit: z.number().min(1).max(20).default(10),
  offset: z.number().min(0).default(0).optional(),
});

export type SearchStudentInput = z.infer<typeof searchStudentSchema>;
