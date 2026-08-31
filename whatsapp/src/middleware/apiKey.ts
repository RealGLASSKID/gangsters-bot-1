import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  apiKey?: string;
  projectId?: string;
}

/**
 * Validates Bearer token against configured RELAY_API_KEYS.
 * Attaches the validated key to the request for rate-limiting.
 */
export function apiKeyAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== 'string') {
    sendError(res, 401, 'UNAUTHORIZED', 'Missing Authorization header');
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    sendError(
      res,
      401,
      'UNAUTHORIZED',
      'Invalid Authorization format. Use: Bearer <API_KEY>'
    );
    return;
  }

  const token = parts[1].trim();

  if (!token) {
    sendError(res, 401, 'UNAUTHORIZED', 'API key is empty');
    return;
  }

  if (!config.apiKeys.has(token)) {
    logger.warn('Invalid API key attempt', {
      ip: req.ip,
      path: req.path,
    });
    sendError(res, 401, 'UNAUTHORIZED', 'Invalid API key');
    return;
  }

  // Attach key (used for per-key rate limiting). Never log the raw key.
  req.apiKey = token;
  // Simple project identifier derived from key prefix for logging
  req.projectId = token.slice(0, 8) + '…';

  next();
}
