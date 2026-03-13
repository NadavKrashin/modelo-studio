#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const COLLECTION = 'filaments';

const DEFAULT_FILAMENTS = [
  {
    id: 'fil-pla-white',
    name: 'PLA White',
    colorName: 'לבן',
    hexColor: '#FFFFFF',
    materialType: 'PLA',
    available: true,
    sortOrder: 1,
    priceModifier: 0,
    isActive: true,
    notes: 'Default PLA',
  },
  {
    id: 'fil-pla-black',
    name: 'PLA Black',
    colorName: 'שחור',
    hexColor: '#1A1A1A',
    materialType: 'PLA',
    available: true,
    sortOrder: 2,
    priceModifier: 0,
    isActive: true,
  },
  {
    id: 'fil-pla-red',
    name: 'PLA Red',
    colorName: 'אדום',
    hexColor: '#DC2626',
    materialType: 'PLA',
    available: true,
    sortOrder: 3,
    priceModifier: 0,
    isActive: true,
  },
  {
    id: 'fil-pla-blue',
    name: 'PLA Blue',
    colorName: 'כחול',
    hexColor: '#2563EB',
    materialType: 'PLA',
    available: true,
    sortOrder: 4,
    priceModifier: 0,
    isActive: true,
  },
  {
    id: 'fil-petg-black',
    name: 'PETG Black',
    colorName: 'שחור',
    hexColor: '#0A0A0A',
    materialType: 'PETG',
    available: true,
    sortOrder: 5,
    priceModifier: 5,
    isActive: true,
  },
  {
    id: 'fil-petg-transparent',
    name: 'PETG Transparent',
    colorName: 'שקוף',
    hexColor: '#E0F2FE',
    materialType: 'PETG',
    available: true,
    sortOrder: 6,
    priceModifier: 8,
    isActive: true,
  },
  {
    id: 'fil-abs-white',
    name: 'ABS White',
    colorName: 'לבן',
    hexColor: '#FAFAFA',
    materialType: 'ABS',
    available: true,
    sortOrder: 7,
    priceModifier: 3,
    isActive: true,
  },
  {
    id: 'fil-tpu-black',
    name: 'TPU Black',
    colorName: 'שחור',
    hexColor: '#111111',
    materialType: 'TPU',
    available: true,
    sortOrder: 8,
    priceModifier: 15,
    isActive: true,
  },
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

    // Support multiline JSON for FIREBASE_SERVICE_ACCOUNT_JSON={ ... }
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

async function run() {
  loadEnv();
  const serviceAccount = getServiceAccount();
  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  const db = getFirestore(app);

  const now = new Date().toISOString();
  const batch = db.batch();
  for (const filament of DEFAULT_FILAMENTS) {
    const doc = {
      ...filament,
      createdAt: now,
      updatedAt: now,
    };
    batch.set(db.collection(COLLECTION).doc(filament.id), doc, { merge: true });
  }
  await batch.commit();

  const snap = await db.collection(COLLECTION).orderBy('sortOrder', 'asc').get();
  console.log(`Seed complete. Upserted ${DEFAULT_FILAMENTS.length} filaments.`);
  console.log(`Collection "${COLLECTION}" now has ${snap.size} documents.`);
}

run().catch((err) => {
  console.error('Failed to seed filaments:', err.message);
  process.exit(1);
});
