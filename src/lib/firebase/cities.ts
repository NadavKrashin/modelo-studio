import { collection, getDocs } from "firebase/firestore";
import { getFirebaseClientApp, getFirebaseClientFirestore } from "./client";

export type CitySizeKey = "minicube" | "cube";

export const CITIES_COLLECTION = "cities";

export interface CityDoc {
  id: string;
  /** Hebrew display name (legacy field `name` also supported). */
  name: string;
  images: Partial<Record<CitySizeKey, string>>;
  /** English slug for Storage paths / URLs (defaults to document id). */
  slug: string;
  /** Per-format prices in ₪ (optional; storefront falls back to static defaults). */
  priceMinicube?: number;
  priceCube?: number;
  /** When false, city is hidden from the public cities wizard. */
  inStock: boolean;
  /** Featured in storefront “הנמכרים ביותר” when true and in stock. */
  isBestSeller: boolean;
}

function parseImages(raw: unknown): Partial<Record<CitySizeKey, string>> {
  if (!raw || typeof raw !== "object") return {};
  return raw as Partial<Record<CitySizeKey, string>>;
}

function numOrUndef(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** Map Firestore document data to `CityDoc` (admin + storefront). */
export function mapCityDocument(
  docId: string,
  data: Record<string, unknown>,
): CityDoc {
  const nameHe =
    typeof data.nameHe === "string"
      ? data.nameHe
      : typeof data.name === "string"
        ? data.name
        : docId;
  const slug =
    typeof data.slug === "string" && data.slug.trim() !== ""
      ? data.slug.trim()
      : docId;

  return {
    id: docId,
    name: nameHe,
    slug,
    images: parseImages(data.images),
    priceMinicube: numOrUndef(data.priceMinicube),
    priceCube: numOrUndef(data.priceCube),
    inStock: data.inStock !== false,
    /** Strict boolean in Firestore; also accepts legacy string/number if present. */
    isBestSeller: coerceBestSellerFlag(data.isBestSeller),
  };
}

function coerceBestSellerFlag(v: unknown): boolean {
  if (v === true || v === 1) return true;
  if (typeof v === "string" && v.trim().toLowerCase() === "true") return true;
  return false;
}

/**
 * Public URLs for `cities/{slug}/{size}.jpeg` in the default bucket (matches seed-cities.mjs).
 */
export function buildCityStorageImageUrls(
  slug: string,
): Partial<Record<CitySizeKey, string>> {
  const bucket = getFirebaseClientApp().options.storageBucket;
  if (!bucket || !slug) return {};
  const sizes: CitySizeKey[] = ["minicube", "cube"];
  const out: Partial<Record<CitySizeKey, string>> = {};
  for (const size of sizes) {
    const objectPath = `cities/${slug}/${size}.jpeg`;
    out[size] =
      `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;
  }
  return out;
}

/** Minicube preview URL: stored image, or derived from slug + Storage layout. */
export function getCityMinicubePreviewUrl(city: CityDoc): string {
  const fromDoc = city.images?.minicube;
  if (typeof fromDoc === "string" && fromDoc.startsWith("http")) return fromDoc;
  const derived = buildCityStorageImageUrls(city.slug).minicube;
  return typeof derived === "string" ? derived : "";
}

/**
 * Cities visible to customers (excludes `inStock: false`).
 * Firestore rules: `cities` needs read for storefront; admin needs read/write.
 */
export async function getCities(): Promise<CityDoc[]> {
  const db = getFirebaseClientFirestore();
  const snap = await getDocs(collection(db, CITIES_COLLECTION));

  const list: CityDoc[] = [];
  snap.forEach((d) => {
    const c = mapCityDocument(d.id, d.data() as Record<string, unknown>);
    if (c.inStock) list.push(c);
  });

  return list.sort((a, b) => a.name.localeCompare(b.name, "he"));
}

/**
 * Cities marked as best sellers and in stock (storefront carousel).
 * Reuses `getCities()` so “active” matches the wizard (including legacy docs
 * without `inStock`). No Firestore compound query — `isBestSeller` filtered in JS.
 */
export async function getBestSellerCities(): Promise<CityDoc[]> {
  const cities = await getCities();
  return cities.filter((c) => c.isBestSeller === true);
}
