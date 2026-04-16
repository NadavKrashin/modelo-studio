import 'server-only';
import * as admin from 'firebase-admin';

declare global {
  // eslint-disable-next-line no-var
  var __modeloFirestoreSettingsApplied: boolean | undefined;
}

const g = globalThis as typeof globalThis & {
  __modeloFirestoreSettingsApplied?: boolean;
};

function normalizePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let key = raw.replace(/\\n/g, '\n');
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }
  return key;
}

function initializeAdminIfNeeded(): void {
  if (admin.apps.length) return;

  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    'modelo-studio';
  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL ||
    'firebase-adminsdk-fbsvc@modelo-studio.iam.gserviceaccount.com';
  const privateKey = normalizePrivateKey(
    process.env.PRIVATE_KEY_FB || process.env.FIREBASE_PRIVATE_KEY,
  );

  try {
    if (clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        projectId,
      });
      console.log('[FirebaseAdmin] Initialized via cert credentials');
      return;
    }

    const rawServiceJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (rawServiceJson) {
      const parsed = JSON.parse(rawServiceJson) as {
        project_id?: string;
        projectId?: string;
        client_email?: string;
        clientEmail?: string;
        private_key?: string;
        privateKey?: string;
      };
      const jsonProjectId = parsed.project_id || parsed.projectId || projectId;
      const jsonClientEmail = parsed.client_email || parsed.clientEmail;
      const jsonPrivateKey = normalizePrivateKey(parsed.private_key || parsed.privateKey);

      if (jsonClientEmail && jsonPrivateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: jsonProjectId,
            clientEmail: jsonClientEmail,
            privateKey: jsonPrivateKey,
          }),
          projectId: jsonProjectId,
        });
        console.log('[FirebaseAdmin] Initialized via FIREBASE_SERVICE_ACCOUNT_JSON');
        return;
      }
    }

    throw new Error(
      'Firebase Admin credentials missing. Provide PRIVATE_KEY_FB (or FIREBASE_PRIVATE_KEY) and FIREBASE_CLIENT_EMAIL, or FIREBASE_SERVICE_ACCOUNT_JSON.',
    );
  } catch (error) {
    console.error('Firebase Admin Init Error:', error);
    throw error;
  }
}

export { admin };

export function isFirebaseAdminConfigured(): boolean {
  return (
    admin.apps.length > 0 ||
    !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    (!!process.env.FIREBASE_CLIENT_EMAIL &&
      !!normalizePrivateKey(process.env.PRIVATE_KEY_FB || process.env.FIREBASE_PRIVATE_KEY))
  );
}

export function getFirebaseAdminApp(): admin.app.App {
  initializeAdminIfNeeded();
  return admin.app();
}

export function getFirestoreAdmin(): admin.firestore.Firestore {
  initializeAdminIfNeeded();
  const firestore = admin.firestore();
  if (!g.__modeloFirestoreSettingsApplied) {
    g.__modeloFirestoreSettingsApplied = true;
    try {
      firestore.settings({ ignoreUndefinedProperties: true });
    } catch {
      /* ignore */
    }
  }
  return firestore;
}

export function getAuthAdmin(): admin.auth.Auth {
  initializeAdminIfNeeded();
  return admin.auth();
}
