import { z } from 'zod';

export const createConversationSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    initialMessage: z.string().min(1, 'Initial message is required').max(10000),
    provider: z.enum([
      'openrouter',
      'openai',
      'anthropic',
      'google',
      'cohere',
      'mistral',
      'groq',
      'together',
      'replicate',
      'huggingface'
    ]).optional(),
    model: z.string().optional(),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Message content is required').max(10000),
  }),
  params: z.object({
    id: z.string().uuid('Invalid conversation ID'),
  }),
});

export const getConversationsSchema = z.object({
  query: z.object({
    limit: z.string().transform(Number).optional(),
    offset: z.string().transform(Number).optional(),
    archived: z.string().transform(val => val === 'true').optional(),
  }),
});

export const conversationIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid conversation ID'),
  }),
});