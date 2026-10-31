import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { AppError, toErrorResponse } from './errors';
import { prisma } from './db';

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(err: unknown) {
  const { status, body } = toErrorResponse(err);
  return NextResponse.json(body, { status });
}

export async function parseBody<T extends z.ZodTypeAny>(req: NextRequest, schema: T): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new AppError('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }
  try {
    return schema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new AppError('VALIDATION_ERROR', 'Please check the submitted values.', 422, err.flatten().fieldErrors);
    }
    throw err;
  }
}

export function clientIp(req: NextRequest) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/**
 * Fixed-window rate limiter backed by Postgres (Redis is used instead when REDIS_URL is
 * set — see infra/docker-compose). Raises RATE_LIMITED when the bucket is exhausted.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const nowSec = Math.floor(Date.now() / 1000);
  const windowStart = new Date(Math.floor(nowSec / windowSeconds) * windowSeconds * 1000);
  const bucket = await prisma.rateLimitBucket.upsert({
    where: { key_window: { key, window: windowStart } },
    create: { key, window: windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });
  if (bucket.count > limit) {
    throw new AppError('RATE_LIMITED', 'Too many requests. Please slow down and try again shortly.', 429, {
      retryAfterSeconds: windowSeconds - (nowSec % windowSeconds),
    });
  }
  return bucket;
}

export function noStore(init?: ResponseInit): ResponseInit {
  return { ...init, headers: { 'Cache-Control': 'no-store, max-age=0', ...(init?.headers ?? {}) } };
}
