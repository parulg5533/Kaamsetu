import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

/** Thrown inside route handlers / transactions to abort with a specific HTTP response. */
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export function ok<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function fail(status: number, code: string, error: string) {
  return NextResponse.json({ success: false, code, error }, { status });
}

/**
 * Converts any thrown value into a safe JSON response.
 * Internal error details are logged server-side and never sent to the client.
 */
export function handleRouteError(err: unknown, context: string) {
  if (err instanceof HttpError) {
    return fail(err.status, err.code, err.message);
  }
  if (err instanceof ZodError) {
    const first = err.issues[0];
    const field = first?.path.join('.') || 'request';
    return fail(400, 'VALIDATION_ERROR', `${field}: ${first?.message ?? 'Invalid input'}`);
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return fail(409, 'CONFLICT', 'This record already exists');
    if (err.code === 'P2025') return fail(404, 'NOT_FOUND', 'Record not found');
    if (err.code === 'P2003') return fail(400, 'INVALID_REFERENCE', 'A referenced record does not exist');
  }
  if (err instanceof SyntaxError) {
    return fail(400, 'BAD_JSON', 'Request body must be valid JSON');
  }
  console.error(`[${context}]`, err);
  return fail(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
}

/** Parses a JSON body, returning {} for an empty body. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (!text) return {};
  return JSON.parse(text);
}
