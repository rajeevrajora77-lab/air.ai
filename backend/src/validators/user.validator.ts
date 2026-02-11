import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be less than 50 characters')
      .regex(/^[a-zA-Z]+$/, 'First name must contain only letters')
      .optional(),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be less than 50 characters')
      .regex(/^[a-zA-Z]+$/, 'Last name must contain only letters')
      .optional(),
  }).refine((data) => data.firstName || data.lastName, {
    message: 'At least one field must be provided',
  }),
});

export const getUserParamsSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
});