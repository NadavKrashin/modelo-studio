import 'server-only';

import * as admin from 'firebase-admin';

declare global {
  // Ensures init logic runs only once per Node process (build workers / duplicate module evaluation).
  // eslint-disable-next-line no-var
  var __modeloFirebaseAdminSetupDone: boolean | undefined;
  // Firestore settings() may only run once per process; guard across duplicate module evaluations.
  // eslint-disable-next-line no-var
  var __modeloFirestoreSettingsApplied: boolean | undefined;
}

const g = globalThis as typeof globalThis & {
  __modeloFirebaseAdminSetupDone?: boolean;
  __modeloFirestoreSettingsApplied?: boolean;
};

function tryInitializeFromServiceAccountJson(): void {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const projectId =
      (typeof parsed.project_id === 'string' && parsed.project_id) ||
      (typeof parsed.projectId === 'string' && parsed.projectId) ||
      '';
    const clientEmail =
      (typeof parsed.client_email === 'string' && parsed.client_email) ||
      (typeof parsed.clientEmail === 'string' && parsed.clientEmail) ||
      '';
    let privateKey =
      (typeof parsed.private_key === 'string' && parsed.private_key) ||
      (typeof parsed.privateKey === 'string' && parsed.privateKey) ||
      '';
    if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n');
    if (!projectId || !clientEmail || !privateKey) return;
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log('Firebase Admin Initialized Successfully');
  } catch (err) {
    console.error(
      '[FirebaseAdmin] Invalid FIREBASE_SERVICE_ACCOUNT_JSON:',
      (err as Error).message,
    );
  }
}

if (!g.__modeloFirebaseAdminSetupDone) {
  g.__modeloFirebaseAdminSetupDone = true;

  const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
  const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
  const hasPrivateKey = !!process.env.PRIVATE_KEY_FB;
  const hasServiceAccountJson = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const hasAdminPassword = !!process.env.ADMIN_PASSWORD;

  console.log(
    `[FirebaseAdmin] Env check — PROJECT_ID=${hasProjectId}, CLIENT_EMAIL=${hasClientEmail}, PRIVATE_KEY=${hasPrivateKey}, SERVICE_ACCOUNT_JSON=${hasServiceAccountJson}, ADMIN_PASSWORD=${hasAdminPassword}`,
  );

  if (!hasProjectId) console.error('CRITICAL FATAL: FIREBASE_PROJECT_ID is missing at runtime!');
  if (!hasClientEmail) console.error('CRITICAL FATAL: FIREBASE_CLIENT_EMAIL is missing at runtime!');
  if (!hasPrivateKey && !hasServiceAccountJson) {
    console.error('CRITICAL FATAL: PRIVATE_KEY_FB and FIREBASE_SERVICE_ACCOUNT_JSON are BOTH missing at runtime! Firebase Admin cannot initialize.');
  }

  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.PRIVATE_KEY_FB?.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log('Firebase Admin Initialized Successfully');
    } catch (error) {
      console.error('Firebase Admin Initialization Error:', error);
    }
  }

  if (!admin.apps.length) {
    tryInitializeFromServiceAccountJson();
  }

  if (!admin.apps.length) {
    console.error('CRITICAL FATAL: Firebase Admin failed ALL initialization paths. admin.apps.length === 0. All Firestore reads will return empty or throw.');
  }
}

const db = (() => {
  if (!admin.apps.length) {
    return null as unknown as admin.firestore.Firestore;
  }
  const firestore = admin.firestore();
  if (!g.__modeloFirestoreSettingsApplied) {
    g.__modeloFirestoreSettingsApplied = true;
    try {
      firestore.settings({ ignoreUndefinedProperties: true });
    } catch {
      /* Settings already applied for this Firestore instance in this process */
    }
  }
  return firestore;
})();

const auth =
  admin.apps.length > 0
    ? admin.auth()
    : (null as unknown as admin.auth.Auth);

export { db, auth, admin };

export function isFirebaseAdminConfigured(): boolean {
  return admin.apps.length > 0;
}

export function getFirebaseAdminApp(): admin.app.App {
  if (!admin.apps.length) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and PRIVATE_KEY_FB.',
    );
  }
  return admin.app();
}

export function getFirestoreAdmin(): admin.firestore.Firestore {
  if (!admin.apps.length) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and PRIVATE_KEY_FB.',
    );
  }
  return db;
}
