import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import config from '../config';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    user: (req as any).user?.id,
  });

  // Default error response
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  // Handle known errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code || 'APPLICATION_ERROR';
    message = err.message;

    // Log operational errors as warnings
    if (err.isOperational) {
      logger.warn('Operational error:', {
        code,
        message,
        statusCode,
        path: req.path,
      });
    }
  }

  // Parse validation error details
  if (code === 'VALIDATION_ERROR') {
    try {
      details = JSON.parse(message);
      message = 'Validation failed';
    } catch {
      // Keep original message if parsing fails
    }
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  // Include stack trace in development
  if (config.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};