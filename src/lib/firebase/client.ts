'use client';

import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported as isMessagingSupported } from 'firebase/messaging';

function getRequiredEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing Firebase client env var: ${name}`);
  }
  return value;
}

function getClientConfig() {
  return {
    apiKey: getRequiredEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, 'NEXT_PUBLIC_FIREBASE_API_KEY'),
    authDomain: getRequiredEnv(
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    ),
    projectId: getRequiredEnv(
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    ),
    storageBucket: getRequiredEnv(
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    ),
    messagingSenderId: getRequiredEnv(
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    ),
    appId: getRequiredEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, 'NEXT_PUBLIC_FIREBASE_APP_ID'),
  };
}

let cachedApp: FirebaseApp | null = null;

export function getFirebaseClientApp(): FirebaseApp {
  if (cachedApp) return cachedApp;
  cachedApp = getApps()[0] ?? initializeApp(getClientConfig());
  return cachedApp;
}

export function getFirebaseClientFirestore() {
  return getFirestore(getFirebaseClientApp());
}

export function getFirebaseClientAuth() {
  return getAuth(getFirebaseClientApp());
}

export async function getFirebaseClientMessaging() {
  const supported = await isMessagingSupported();
  if (!supported) return null;
  return getMessaging(getFirebaseClientApp());
}
