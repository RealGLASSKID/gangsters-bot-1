import { Response, NextFunction } from 'express';
import { sendMessageSchema } from '../utils/validation';
import { sendSuccess, sendError } from '../utils/response';
import { whatsappClient } from '../whatsapp/client';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/apiKey';
import { SendMessageData } from '../types';

export async function sendMessageController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = sendMessageSchema.safeParse(req.body);

    if (!parsed.success) {
      const message =
        parsed.error.errors.map((e) => e.message).join('; ') ||
        'Invalid request body';
      sendError(res, 400, 'INVALID_REQUEST', message);
      return;
    }

    const { to, message } = parsed.data;

    // Ensure WhatsApp is ready before attempting send
    if (!whatsappClient.isConnected()) {
      const status = whatsappClient.getStatus();
      logger.warn('Send rejected – WhatsApp not ready', { status });

      if (status === 'qr') {
        sendError(
          res,
          503,
          'WHATSAPP_AUTH_REQUIRED',
          'WhatsApp requires authentication. Scan the QR code in the service logs.'
        );
        return;
      }

      sendError(
        res,
        503,
        'WHATSAPP_UNAVAILABLE',
        'WhatsApp client is not connected. Please try again later.'
      );
      return;
    }

    const result = await whatsappClient.sendMessage(to, message);

    const data: SendMessageData = {
      id: result.id,
      messageId: result.id,
      status: 'sent',
    };

    sendSuccess(res, data, 200);
  } catch (err) {
    next(err);
  }
}
