import { NextResponse } from 'next/server';
import { ZodError, type ZodSchema } from 'zod';

/**
 * Parse and validate request body against a Zod schema.
 * Returns the validated data or a formatted error response.
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        error: NextResponse.json(
          {
            error: 'Validation failed',
            details: err.issues.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 },
        ),
      };
    }
    return {
      error: NextResponse.json({ error: 'Invalid request body' }, { status: 400 }),
    };
  }
}

/**
 * Parse URL search params against a Zod schema.
 */
export function parseSearchParams<T>(
  url: string,
  schema: ZodSchema<T>,
): { data: T; error?: never } | { data?: never; error: NextResponse } {
  try {
    const params = Object.fromEntries(new URL(url).searchParams);
    const data = schema.parse(params);
    return { data };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        error: NextResponse.json(
          {
            error: 'Invalid query parameters',
            details: err.issues.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 },
        ),
      };
    }
    return {
      error: NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 }),
    };
  }
}
