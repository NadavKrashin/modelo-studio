#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const COLLECTION = 'cities';

const DEFAULT_CITIES = [
  { id: 'tel-aviv', name: 'תל אביב' },
  { id: 'london', name: 'לונדון' },
  { id: 'neww-york', name: 'ניו יורק' },
  { id: 'jerusalem', name: 'ירושלים' },
  { id: 'barcelona', name: 'ברצלונה' },
  { id: 'paris', name: 'פריז' },
  { id: 'dubai', name: 'דובאי' },
  { id: 'rome', name: 'רומא' },
  { id: 'milan', name: 'מילאנו' },
  { id: 'miami', name: 'מיאמי' },
  { id: 'las-vegas', name: 'לאס וגאס' },
  { id: 'venice', name: 'ונציה' },
  { id: 'abu-dhabi', name: 'אבו דאבי' },
];

function parseEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  const env = {};

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw || raw.trim().startsWith('#')) continue;
    const eqIdx = raw.indexOf('=');
    if (eqIdx <= 0) continue;

    const key = raw.slice(0, eqIdx).trim();
    let value = raw.slice(eqIdx + 1).trim();

    if (key === 'FIREBASE_SERVICE_ACCOUNT_JSON' && value.startsWith('{') && !value.endsWith('}')) {
      const parts = [value];
      while (i + 1 < lines.length) {
        i += 1;
        parts.push(lines[i]);
        if (lines[i].trim() === '}') break;
      }
      value = parts.join('\n');
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function loadEnv() {
  const cwd = process.cwd();
  const envPath = path.join(cwd, '.env.local');
  const fromFile = parseEnvFile(envPath);
  for (const [k, v] of Object.entries(fromFile)) {
    if (!(k in process.env)) process.env[k] = v;
  }
}

function getServiceAccount() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      };
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      'Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.',
    );
  }
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
  return { projectId, clientEmail, privateKey };
}

function buildStorageImageUrl(bucket, cityId, sizeKey) {
  const objectPath = `cities/${cityId}/${sizeKey}.jpeg`;
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;
}

function buildCityDoc(bucket, city) {
  return {
    name: city.name,
    images: {
      minicube: buildStorageImageUrl(bucket, city.id, 'minicube'),
      cube: buildStorageImageUrl(bucket, city.id, 'cube'),
    },
    updatedAt: new Date().toISOString(),
  };
}

async function run() {
  loadEnv();

  const bucket = process.env.FIREBASE_STORAGE_BUCKET;
  if (!bucket) {
    throw new Error('Missing FIREBASE_STORAGE_BUCKET (required for image URL generation).');
  }

  const serviceAccount = getServiceAccount();
  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: bucket,
    });
  const db = getFirestore(app);

  // 1) Delete entire collection contents first (hard reset)
  const existing = await db.collection(COLLECTION).get();
  if (!existing.empty) {
    const deleteBatch = db.batch();
    for (const doc of existing.docs) {
      deleteBatch.delete(doc.ref);
    }
    await deleteBatch.commit();
  }

  // 2) Recreate collection from defaults
  const batch = db.batch();
  for (const city of DEFAULT_CITIES) {
    const ref = db.collection(COLLECTION).doc(city.id);
    batch.set(ref, buildCityDoc(bucket, city));
  }
  await batch.commit();

  const snap = await db.collection(COLLECTION).get();
  console.log(`Seed complete. Upserted ${DEFAULT_CITIES.length} cities.`);
  console.log(`Collection "${COLLECTION}" now has ${snap.size} documents.`);
  console.log('Expected Firebase Storage object format: cities/<city-id>/<size>.jpeg');
}

run().catch((err) => {
  console.error('Failed to seed cities:', err.message);
  process.exit(1);
});

