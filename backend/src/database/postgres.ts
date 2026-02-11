import { Pool, PoolClient, QueryResult } from 'pg';
import config from '../config';
import logger from '../utils/logger';
import { DatabaseError } from '../utils/errors';

class Database {
  private pool: Pool;
  private isConnected: boolean = false;

  constructor() {
    this.pool = new Pool({
      host: config.POSTGRES_HOST,
      port: config.POSTGRES_PORT,
      user: config.POSTGRES_USER,
      password: config.POSTGRES_PASSWORD,
      database: config.POSTGRES_DB,
      min: config.DB_POOL_MIN,
      max: config.DB_POOL_MAX,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected database error:', err);
    });

    this.pool.on('connect', () => {
      logger.debug('New database connection established');
    });
  }

  async connect(retries = 5, delay = 2000): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const client = await this.pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        this.isConnected = true;
        logger.info('✅ Database connected successfully');
        return;
      } catch (error) {
        logger.error(`❌ Database connection attempt ${attempt}/${retries} failed:`, error);
        
        if (attempt === retries) {
          throw new DatabaseError('Failed to connect to database after multiple retries');
        }
        
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        logger.info(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      // Warn on slow queries (>200ms is concerning)
      if (duration > 200) {
        logger.warn(`Slow query detected (${duration}ms):`, { 
          text: text.substring(0, 100),
          paramCount: params?.length || 0 
        });
      }
      
      logger.debug(`Query executed in ${duration}ms`);
      return result;
    } catch (error) {
      logger.error('Database query error:', { 
        text: text.substring(0, 100), 
        paramCount: params?.length || 0,
        error 
      });
      throw new DatabaseError('Query execution failed');
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction rolled back:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health');
      return result.rows.length > 0;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
    this.isConnected = false;
    logger.info('Database disconnected');
  }

  getPool(): Pool {
    return this.pool;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}

export const db = new Database();
export default db;