import { Response, NextFunction } from 'express';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { config } from '../config';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from './apiKey';

let ratelimit: Ratelimit | null = null;

function getRateLimiter(): Ratelimit | null {
  if (ratelimit) return ratelimit;

  if (!config.redis.url || !config.redis.token) {
    logger.warn(
      'Upstash Redis not configured. Rate limiting is disabled. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.'
    );
    return null;
  }

  try {
    const redis = new Redis({
      url: config.redis.url,
      token: config.redis.token,
    });

    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        config.rateLimit.max,
        `${config.rateLimit.windowSeconds} s`
      ),
      analytics: true,
      prefix: 'gangster-bot-relay:ratelimit',
    });

    logger.info('Rate limiter initialized with Upstash Redis');
    return ratelimit;
  } catch (err) {
    logger.error('Failed to initialize rate limiter', err);
    return null;
  }
}

/**
 * Per-API-key rate limiting.
 * Falls back to allowing the request if Redis is unavailable
 * (fail-open) so the service stays usable during Redis outages.
 */
export async function rateLimitMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const limiter = getRateLimiter();

  if (!limiter) {
    // Redis not configured or failed – allow request
    next();
    return;
  }

  const identifier = req.apiKey || req.ip || 'anonymous';

  try {
    const result = await limiter.limit(identifier);

    // Expose rate limit headers
    res.setHeader('X-RateLimit-Limit', result.limit.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', result.reset.toString());

    if (!result.success) {
      logger.warn('Rate limit exceeded', {
        projectId: req.projectId,
        remaining: result.remaining,
      });
      sendError(
        res,
        429,
        'RATE_LIMIT_EXCEEDED',
        'Too many requests. Please try again later.'
      );
      return;
    }

    next();
  } catch (err) {
    logger.error('Rate limit check failed – allowing request', err);
    // Fail open
    next();
  }
}
