import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const DEFAULT_TIMEOUT = 30000; // 30 seconds

export const requestTimeout = (timeout: number = DEFAULT_TIMEOUT) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout:', {
          method: req.method,
          url: req.url,
          ip: req.ip,
        });
        
        res.status(408).json({
          success: false,
          error: {
            code: 'REQUEST_TIMEOUT',
            message: 'Request timeout - operation took too long',
          },
        });
      }
    }, timeout);

    // Clear timeout when response finishes
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
};

export default requestTimeout;