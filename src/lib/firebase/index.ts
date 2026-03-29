export { getFirebaseAdminApp, getFirestoreAdmin, isFirebaseAdminConfigured } from './admin';
export {
  getFirebaseClientApp,
  getFirebaseClientAuth,
  getFirebaseClientFirestore,
  getFirebaseClientMessaging,
} from './client';
export { getCities } from './cities';
export { FIRESTORE_COLLECTIONS } from './firestore';

// TODO(firebase-auth): add auth token/session helpers once Firebase Auth is enabled.
// TODO(firebase-notifications): add FCM registration and send utilities.
