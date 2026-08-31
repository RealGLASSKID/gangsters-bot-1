import { Response, NextFunction } from 'express';
import { deleteMessageSchema } from '../utils/validation';
import { sendSuccess, sendError } from '../utils/response';
import { whatsappClient } from '../whatsapp/client';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/apiKey';
import { DeleteMessageData } from '../types';

export async function deleteMessageController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = deleteMessageSchema.safeParse(req.body);

    if (!parsed.success) {
      const message =
        parsed.error.errors.map((e) => e.message).join('; ') ||
        'Invalid request body';
      sendError(res, 400, 'INVALID_REQUEST', message);
      return;
    }

    const { messageId, everyone } = parsed.data;

    if (!whatsappClient.isConnected()) {
      const status = whatsappClient.getStatus();
      logger.warn('Delete rejected – WhatsApp not ready', { status });

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

    const result = await whatsappClient.deleteMessage(messageId, everyone !== false);

    const data: DeleteMessageData = {
      id: result.id,
      messageId: result.id,
      deleted: result.deleted,
    };

    sendSuccess(res, data, 200);
  } catch (err) {
    next(err);
  }
}
