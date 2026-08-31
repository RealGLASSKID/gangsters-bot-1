import { z } from 'zod';

/**
 * WhatsApp-compatible phone number:
 * - Digits only (after stripping leading +)
 * - Length between 8 and 15 (E.164 max is 15)
 * - Should not start with 0 (country code required)
 */
export const phoneNumberSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/^\+/, '').replace(/\s+/g, ''))
  .refine((val) => /^\d{8,15}$/.test(val), {
    message: 'Invalid phone number. Use international format without + (e.g. 2348012345678)',
  })
  .refine((val) => !val.startsWith('0'), {
    message: 'Phone number must include country code and must not start with 0',
  });

export const messageSchema = z
  .string()
  .trim()
  .min(1, 'Message cannot be empty')
  .max(4096, 'Message is too long (max 4096 characters)');

export const sendMessageSchema = z.object({
  to: phoneNumberSchema,
  message: messageSchema,
});

export const deleteMessageSchema = z.object({
  messageId: z
    .string()
    .trim()
    .min(5, "messageId is required")
    .max(200, "messageId is too long"),
  /** Delete for everyone (revoke). Default true. */
  everyone: z.boolean().optional().default(true),
});

export type ValidatedSendMessage = z.infer<typeof sendMessageSchema>;
export type ValidatedDeleteMessage = z.infer<typeof deleteMessageSchema>;
