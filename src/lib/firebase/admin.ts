import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function hasEnv(name: string): boolean {
  return !!process.env[name] && process.env[name]!.trim().length > 0;
}

function parseServiceAccountFromEnv(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccount;
    if (parsed.privateKey) {
      parsed.privateKey = parsed.privateKey.replace(/\\n/g, '\n');
    }
    return parsed;
  } catch (err) {
    console.error('[FirebaseAdmin] Invalid FIREBASE_SERVICE_ACCOUNT_JSON:', (err as Error).message);
    return null;
  }
}

function buildServiceAccountFromFields(): ServiceAccount | null {
  if (!hasEnv('FIREBASE_PROJECT_ID') || !hasEnv('FIREBASE_CLIENT_EMAIL') || !hasEnv('FIREBASE_PRIVATE_KEY')) {
    return null;
  }
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
}

let cachedApp: App | null = null;

export function isFirebaseAdminConfigured(): boolean {
  return !!parseServiceAccountFromEnv() || !!buildServiceAccountFromFields();
}

export function getFirebaseAdminApp(): App {
  if (cachedApp) return cachedApp;
  if (getApps().length > 0) {
    cachedApp = getApps()[0]!;
    return cachedApp;
  }

  const serviceAccount = parseServiceAccountFromEnv() ?? buildServiceAccountFromFields();
  if (!serviceAccount) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.',
    );
  }

  cachedApp = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
  return cachedApp;
}

export function getFirestoreAdmin() {
  return getFirestore(getFirebaseAdminApp());
}
