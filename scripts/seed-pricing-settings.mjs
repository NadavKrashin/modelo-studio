#!/usr/bin/env node

/**
 * Creates / updates Firestore document `settings/pricing` (global storefront pricing).
 * Reuses the same env loading pattern as scripts/seed-cities.mjs.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const SETTINGS_COLLECTION = 'settings';
const PRICING_DOC_ID = 'pricing';

const DEFAULT_PRICING = {
  shippingCost: 35,
  acrylicCoverCost: 150,
  bundleDiscountPerExtraCity: 20,
  sportRouteFrameAddonCost: 50,
  personalCustomBasePrice: 199,
  studioEmbossedTextSurcharge: 8,
  studioMinUnitPrice: 10,
  updatedAt: new Date().toISOString(),
};

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

async function run() {
  loadEnv();
  const serviceAccount = getServiceAccount();
  const bucket = process.env.FIREBASE_STORAGE_BUCKET;
  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert(serviceAccount),
      ...(bucket ? { storageBucket: bucket } : {}),
    });
  const db = getFirestore(app);

  await db.collection(SETTINGS_COLLECTION).doc(PRICING_DOC_ID).set(DEFAULT_PRICING, { merge: true });

  console.log(`Upserted ${SETTINGS_COLLECTION}/${PRICING_DOC_ID}`);
  console.log('Fields:', Object.keys(DEFAULT_PRICING).filter((k) => k !== 'updatedAt').join(', '));
}

run().catch((err) => {
  console.error('Failed to seed pricing settings:', err.message);
  process.exit(1);
});
