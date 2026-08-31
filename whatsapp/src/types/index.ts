export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface SendMessageRequest {
  to: string;
  message: string;
}

export interface SendMessageData {
  id: string;
  messageId: string;
  status: 'sent' | 'queued' | 'failed';
}

export interface DeleteMessageRequest {
  messageId: string;
  everyone?: boolean;
}

export interface DeleteMessageData {
  id: string;
  messageId: string;
  deleted: boolean;
}

export interface HealthData {
  service: string;
  status: 'ok' | 'degraded';
  whatsapp: 'connected' | 'disconnected' | 'initializing' | 'qr';
}

export type WhatsAppStatus = 'initializing' | 'qr' | 'authenticated' | 'ready' | 'disconnected';

export interface RateLimitInfo {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}
