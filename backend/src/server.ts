import app from './app';
import config from './config';
import { db } from './database/postgres';
import { redis } from './database/redis';
import { aiService } from './services/ai.service';
import logger from './utils/logger';

const PORT = config.PORT || 5000;

let server: any;

const startServer = async () => {
  try {
    // Connect to databases
    logger.info('🔄 Connecting to databases...');
    await Promise.all([db.connect(), redis.connect()]);

    // Initialize AI service
    logger.info('🔄 Initializing AI service...');
    aiService.initialize();

    // Start server
    server = app.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`🌐 Environment: ${config.NODE_ENV}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
      logger.info(`📊 Metrics: http://localhost:${PORT}/api/v1/metrics`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: Error) => {
      logger.error('Unhandled Rejection:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  logger.info(`🛑 ${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  if (server) {
    server.close(async () => {
      logger.info('🚫 HTTP server closed');

      try {
        // Close database connections
        await Promise.all([db.disconnect(), redis.disconnect()]);
        logger.info('✅ Database connections closed');
        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

// Start the server
startServer();

export default app;