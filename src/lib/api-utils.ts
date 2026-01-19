import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import crypto from 'crypto';
import type { ApiError, VersionConflictError } from '@/types/lineup-state';

// Standard API error responses
export function errorResponse(message: string, status: number = 400, code?: string): NextResponse<ApiError> {
  return NextResponse.json({ error: message, code }, { status });
}

export function validationError(error: ZodError): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.flatten().fieldErrors,
    },
    { status: 400 }
  );
}

export function unauthorizedError(): NextResponse<ApiError> {
  return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
}

export function forbiddenError(): NextResponse<ApiError> {
  return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
}

export function notFoundError(resource: string = 'Resource'): NextResponse<ApiError> {
  return NextResponse.json(
    { error: `${resource} not found`, code: 'NOT_FOUND' },
    { status: 404 }
  );
}

export function versionConflictError(
  currentVersion: number,
  attemptedVersion: number
): NextResponse<VersionConflictError> {
  return NextResponse.json(
    {
      error: 'Version conflict - resource has been modified',
      code: 'VERSION_CONFLICT',
      current_version: currentVersion,
      attempted_version: attemptedVersion,
    },
    { status: 409 }
  );
}

export function serverError(message: string = 'Internal server error'): NextResponse<ApiError> {
  return NextResponse.json({ error: message, code: 'SERVER_ERROR' }, { status: 500 });
}

// Hash a share token using SHA-256
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Generate a secure random token for share links
export function generateShareToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

// Generate a short team code
export function generateTeamCode(length: number = 6): string {
  const characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  let result = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += characters.charAt(randomBytes[i] % characters.length);
  }
  return result;
}
