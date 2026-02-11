import { z } from 'zod';
import dotenv from 'dotenv';
import { parse as parseConnectionString } from 'pg-connection-string';

dotenv.config();

const configSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),

  // Database - Support both URL and individual fields
  DATABASE_URL: z.string().url().optional(),
  POSTGRES_HOST: z.string().optional(),
  POSTGRES_PORT: z.coerce.number().optional(),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DB: z.string().optional(),
  POOL_MIN: z.coerce.number().default(2),
  POOL_MAX: z.coerce.number().default(10),

  // Redis - Support both URL and individual fields
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().default(12),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  RATE_LIMIT_REFRESH_MAX: z.coerce.number().default(5),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // AI Provider Keys (all optional)
  OPENROUTER_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  COHERE_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  TOGETHER_API_KEY: z.string().optional(),
  REPLICATE_API_KEY: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().default('logs'),

  // Monitoring
  SENTRY_DSN: z.string().optional(),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid configuration:');
  console.error(parsed.error.format());
  throw new Error('Invalid configuration');
}

let config = parsed.data;

// Parse DATABASE_URL if provided
if (config.DATABASE_URL) {
  const pgConfig = parseConnectionString(config.DATABASE_URL);
  config = {
    ...config,
    POSTGRES_HOST: pgConfig.host || config.POSTGRES_HOST || 'localhost',
    POSTGRES_PORT: pgConfig.port ? parseInt(pgConfig.port) : config.POSTGRES_PORT || 5432,
    POSTGRES_USER: pgConfig.user || config.POSTGRES_USER || 'postgres',
    POSTGRES_PASSWORD: pgConfig.password || config.POSTGRES_PASSWORD || '',
    POSTGRES_DB: pgConfig.database || config.POSTGRES_DB || 'air_ai',
  };
} else if (!config.POSTGRES_HOST || !config.POSTGRES_DB) {
  throw new Error('Either DATABASE_URL or POSTGRES_* fields must be provided');
}

// Parse REDIS_URL if provided
if (config.REDIS_URL) {
  try {
    const url = new URL(config.REDIS_URL);
    config = {
      ...config,
      REDIS_HOST: url.hostname || config.REDIS_HOST,
      REDIS_PORT: url.port ? parseInt(url.port) : config.REDIS_PORT,
      REDIS_PASSWORD: url.password || config.REDIS_PASSWORD,
    };
  } catch (error) {
    throw new Error('Invalid REDIS_URL format');
  }
}

// Validate at least one AI provider is configured
const aiProviders = [
  config.OPENROUTER_API_KEY,
  config.OPENAI_API_KEY,
  config.ANTHROPIC_API_KEY,
  config.GOOGLE_AI_API_KEY,
  config.COHERE_API_KEY,
  config.MISTRAL_API_KEY,
  config.GROQ_API_KEY,
  config.TOGETHER_API_KEY,
  config.REPLICATE_API_KEY,
  config.HUGGINGFACE_API_KEY,
].filter(Boolean);

if (aiProviders.length === 0) {
  console.warn('⚠️  WARNING: No AI provider API keys configured!');
  console.warn('   Set at least one of: OPENROUTER_API_KEY, OPENAI_API_KEY, etc.');
}

export default config;