import { Router } from 'express';
import { apiKeyAuth } from '../middleware/apiKey';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import { sendMessageController } from '../controllers/sendMessage';
import { deleteMessageController } from '../controllers/deleteMessage';

const router = Router();

/**
 * POST /v1/send
 * Send a WhatsApp message.
 * Requires: Authorization: Bearer <API_KEY>
 */
router.post(
  '/send',
  apiKeyAuth,
  rateLimitMiddleware,
  sendMessageController
);

/**
 * POST /v1/delete
 * Delete (revoke) a previously sent WhatsApp message by messageId.
 * Requires: Authorization: Bearer <API_KEY>
 * Body: { messageId: string, everyone?: boolean }
 */
router.post(
  '/delete',
  apiKeyAuth,
  rateLimitMiddleware,
  deleteMessageController
);

export default router;
