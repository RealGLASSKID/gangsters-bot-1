import { Router, Request, Response } from 'express';
import { whatsappClient } from '../whatsapp/client';
import { sendSuccess } from '../utils/response';
import { HealthData } from '../types';

const router = Router();

/**
 * GET /health
 * Public health check (no API key required).
 * Used by Railway and monitoring.
 */
router.get('/', (_req: Request, res: Response) => {
  const waStatus = whatsappClient.getStatus();
  const connected = whatsappClient.isConnected();

  const data: HealthData = {
    service: 'gangster-bot-relay',
    status: connected ? 'ok' : 'degraded',
    whatsapp:
      waStatus === 'ready'
        ? 'connected'
        : waStatus === 'qr'
          ? 'qr'
          : waStatus === 'initializing' || waStatus === 'authenticated'
            ? 'initializing'
            : 'disconnected',
  };

  // Return 200 even when degraded so Railway doesn't constantly restart
  // unless you explicitly want that behavior.
  sendSuccess(res, data, 200);
});

export default router;
