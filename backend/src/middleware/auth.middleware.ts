import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { db } from '../database/postgres';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    version: number;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7);

    // Verify token signature and expiry
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: 'air-api',
      audience: 'air-client',
    }) as {
      id: string;
      email: string;
      role: string;
      version: number;
    };

    // CRITICAL: Validate token version against database
    const result = await db.query<{ token_version: number; is_active: boolean }>(
      'SELECT token_version, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      throw new AuthenticationError('User not found');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new AuthenticationError('Account deactivated');
    }

    // Check if token version matches (invalidates old tokens)
    if (decoded.version !== user.token_version) {
      throw new AuthenticationError('Token has been invalidated');
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Token expired'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError('Insufficient permissions'));
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: 'air-api',
      audience: 'air-client',
    }) as {
      id: string;
      email: string;
      role: string;
      version: number;
    };

    // Validate token version
    const result = await db.query<{ token_version: number; is_active: boolean }>(
      'SELECT token_version, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length > 0 && result.rows[0].is_active) {
      const user = result.rows[0];
      if (decoded.version === user.token_version) {
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    logger.debug('Optional auth failed:', error);
    next();
  }
};