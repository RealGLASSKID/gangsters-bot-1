import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`);
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => e.message).join('; ') || 'Validation failed';
    sendError(res, 400, 'INVALID_REQUEST', message);
    return;
  }

  if (err instanceof Error) {
    logger.error('Unhandled error', {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });

    // Known operational errors can be mapped here
    if (
      err.name === 'NotOnWhatsapp' ||
      err.message.toLowerCase().includes('not on whatsapp')
    ) {
      sendError(res, 404, 'NOT_ON_WHATSAPP', 'This number is not on WhatsApp');
      return;
    }

    if (err.message.includes('WhatsApp client is not ready')) {
      sendError(
        res,
        503,
        'WHATSAPP_UNAVAILABLE',
        'WhatsApp client is not connected. Please try again later.'
      );
      return;
    }

    if (err.name === 'MessageNotFound' || err.message.toLowerCase().includes('message not found')) {
      sendError(res, 404, 'MESSAGE_NOT_FOUND', 'Message not found or already deleted');
      return;
    }

    if (err.name === 'InvalidMessageId') {
      sendError(res, 400, 'INVALID_REQUEST', 'messageId is required');
      return;
    }

    sendError(
      res,
      500,
      'INTERNAL_ERROR',
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message
    );
    return;
  }

  logger.error('Unknown error', err);
  sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}
