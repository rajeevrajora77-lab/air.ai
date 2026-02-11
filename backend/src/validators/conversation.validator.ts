import { z } from 'zod';

export const createConversationSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(255, 'Title must be less than 255 characters'),
  }),
});

export const updateConversationSchema = z.object({
  params: z.object({
    conversationId: z.string().uuid('Invalid conversation ID'),
  }),
  body: z.object({
    title: z
      .string()
      .min(1, 'Title must not be empty')
      .max(255, 'Title must be less than 255 characters')
      .optional(),
    isArchived: z.boolean().optional(),
  }).refine((data) => data.title !== undefined || data.isArchived !== undefined, {
    message: 'At least one field must be provided',
  }),
});

export const conversationParamsSchema = z.object({
  params: z.object({
    conversationId: z.string().uuid('Invalid conversation ID'),
  }),
});

export const listConversationsSchema = z.object({
  query: z.object({
    includeArchived: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    limit: z
      .string()
      .transform(Number)
      .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
      .optional(),
    offset: z
      .string()
      .transform(Number)
      .refine((val) => val >= 0, 'Offset must be non-negative')
      .optional(),
  }),
});

export const createMessageSchema = z.object({
  params: z.object({
    conversationId: z.string().uuid('Invalid conversation ID'),
  }),
  body: z.object({
    content: z
      .string()
      .min(1, 'Message content is required')
      .max(10000, 'Message content must be less than 10000 characters'),
    model: z.string().optional(),
  }),
});

export const getMessagesSchema = z.object({
  params: z.object({
    conversationId: z.string().uuid('Invalid conversation ID'),
  }),
  query: z.object({
    limit: z
      .string()
      .transform(Number)
      .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
      .optional(),
    before: z.string().datetime().optional(),
  }),
});