import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import config from './config';
import routes from './routes';
import { errorHandler, notFoundHandler, metricsMiddleware } from './middleware';
import { logStream } from './utils/logger';
import logger from './utils/logger';

const app: Application = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: config.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: config.NODE_ENV === 'production',
}));

// CORS
app.use(cors({
  origin: config.CORS_ORIGIN.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (config.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logStream }));
}

// Metrics
app.use(metricsMiddleware);

// Trust proxy
app.set('trust proxy', 1);

// API Routes
app.use('/api/v1', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;