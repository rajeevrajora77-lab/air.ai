import dotenv from 'dotenv';
import { z } from 'zod';
import { parse } from 'pg-connection-string';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  
  // Database - either DATABASE_URL or individual fields
  DATABASE_URL: z.string().optional(),
  POSTGRES_HOST: z.string().optional(),
  POSTGRES_PORT: z.string().transform(Number).optional(),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DB: z.string().optional(),
  DB_POOL_MIN: z.string().transform(Number).default('2'),
  DB_POOL_MAX: z.string().transform(Number).default('10'),
  
  // Redis - either REDIS_URL or individual fields
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().transform(Number).optional(),
  REDIS_PASSWORD: z.string().optional(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  
  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  RATE_LIMIT_REFRESH_MAX: z.string().transform(Number).default('5'), // New: strict limit for refresh
  
  // AI Providers (all optional)
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
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

const validateEnv = () => {
  try {
    const env = envSchema.parse(process.env);
    
    // Parse DATABASE_URL if provided
    if (env.DATABASE_URL) {
      const dbConfig = parse(env.DATABASE_URL);
      env.POSTGRES_HOST = env.POSTGRES_HOST || dbConfig.host || 'localhost';
      env.POSTGRES_PORT = env.POSTGRES_PORT || (dbConfig.port ? parseInt(dbConfig.port) : 5432);
      env.POSTGRES_USER = env.POSTGRES_USER || dbConfig.user || 'postgres';
      env.POSTGRES_PASSWORD = env.POSTGRES_PASSWORD || dbConfig.password || '';
      env.POSTGRES_DB = env.POSTGRES_DB || dbConfig.database || 'air_ai';
    } else {
      // Require individual fields if DATABASE_URL not provided
      if (!env.POSTGRES_HOST || !env.POSTGRES_USER || !env.POSTGRES_DB) {
        throw new Error('Either DATABASE_URL or individual POSTGRES_* variables must be set');
      }
    }
    
    // Parse REDIS_URL if provided
    if (env.REDIS_URL) {
      const url = new URL(env.REDIS_URL);
      env.REDIS_HOST = env.REDIS_HOST || url.hostname;
      env.REDIS_PORT = env.REDIS_PORT || parseInt(url.port) || 6379;
      env.REDIS_PASSWORD = env.REDIS_PASSWORD || url.password || undefined;
    } else {
      // Default Redis connection
      env.REDIS_HOST = env.REDIS_HOST || 'localhost';
      env.REDIS_PORT = env.REDIS_PORT || 6379;
    }
    
    // Validate at least one AI provider is configured
    const hasAIProvider = env.OPENROUTER_API_KEY || env.OPENAI_API_KEY || 
                          env.ANTHROPIC_API_KEY || env.GOOGLE_AI_API_KEY ||
                          env.COHERE_API_KEY || env.MISTRAL_API_KEY ||
                          env.GROQ_API_KEY || env.TOGETHER_API_KEY ||
                          env.REPLICATE_API_KEY || env.HUGGINGFACE_API_KEY;
    
    if (!hasAIProvider) {
      console.warn('⚠️  WARNING: No AI provider API keys configured!');
    }
    
    return env;
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
};

export const config = validateEnv();
export default config;