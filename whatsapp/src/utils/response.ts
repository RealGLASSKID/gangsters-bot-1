import { Response } from 'express';
import { ApiErrorResponse, ApiSuccessResponse } from '../types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200
): Response {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
  };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string
): Response {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };
  return res.status(statusCode).json(body);
}
