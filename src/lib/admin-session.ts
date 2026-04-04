import { SignJWT, jwtVerify } from 'jose';

export const ADMIN_JWT_COOKIE = 'admin_session';

const DEV_FALLBACK_SECRET = 'dev-only-insecure-admin-jwt-secret-min-32-chars!!';

export function getJwtSecretBytes(): Uint8Array {
  const s = process.env.ADMIN_JWT_SECRET;
  if (s && s.length >= 32) {
    return new TextEncoder().encode(s);
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_JWT_SECRET must be set to a random string of at least 32 characters.');
  }
  return new TextEncoder().encode(DEV_FALLBACK_SECRET);
}

export async function verifyAdminJwt(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getJwtSecretBytes());
    return true;
  } catch {
    return false;
  }
}

export async function createAdminJwt(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('admin')
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecretBytes());
}

export function stripOrderLookupToken<T extends { customerLookupToken?: string }>(
  order: T,
): Omit<T, 'customerLookupToken'> {
  const { customerLookupToken: _omit, ...rest } = order;
  return rest;
}
