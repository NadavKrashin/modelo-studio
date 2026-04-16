import { SignJWT, jwtVerify } from 'jose';
import { getJwtSecretBytes } from './admin-session';

export const CLIENT_JWT_COOKIE = 'client_session';

export interface ClientSessionPayload {
  orderId: string;
  orderNumber: string;
  phone: string;
}

export function normalizePhone(raw: string): string {
  return raw.replace(/[^\d+]/g, '');
}

export async function createClientJwt(payload: ClientSessionPayload): Promise<string> {
  return new SignJWT({
    orderId: payload.orderId,
    orderNumber: payload.orderNumber,
    phone: payload.phone,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('client')
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getJwtSecretBytes());
}

export async function verifyClientJwt(token: string): Promise<ClientSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    if (
      payload.sub !== 'client' ||
      typeof payload.orderId !== 'string' ||
      typeof payload.orderNumber !== 'string' ||
      typeof payload.phone !== 'string'
    ) {
      return null;
    }
    return {
      orderId: payload.orderId,
      orderNumber: payload.orderNumber,
      phone: payload.phone,
    };
  } catch {
    return null;
  }
}
