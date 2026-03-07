import type { ModelLicense, LicenseCommercialUse } from '@/lib/types';

/**
 * Canonical license definitions.
 * Every normalized model must reference one of these — providers map
 * their raw license strings to a key in this registry.
 */

const LICENSES: Record<string, ModelLicense> = {
  'CC-BY-4.0': {
    spdxId: 'CC-BY-4.0',
    shortName: 'CC BY',
    fullName: 'Creative Commons Attribution 4.0',
    localizedName: 'קריאייטיב קומונז — ייחוס',
    url: 'https://creativecommons.org/licenses/by/4.0/',
    commercialUse: 'allowed',
    commercialUseReason: 'CC BY explicitly permits commercial use with attribution',
    allowsModification: true,
    requiresAttribution: true,
    shareAlike: false,
  },
  'CC-BY-SA-4.0': {
    spdxId: 'CC-BY-SA-4.0',
    shortName: 'CC BY-SA',
    fullName: 'Creative Commons Attribution ShareAlike 4.0',
    localizedName: 'קריאייטיב קומונז — ייחוס, שיתוף זהה',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    commercialUse: 'allowed',
    commercialUseReason: 'CC BY-SA explicitly permits commercial use with attribution and share-alike',
    allowsModification: true,
    requiresAttribution: true,
    shareAlike: true,
  },
  'CC-BY-NC-4.0': {
    spdxId: 'CC-BY-NC-4.0',
    shortName: 'CC BY-NC',
    fullName: 'Creative Commons Attribution NonCommercial 4.0',
    localizedName: 'קריאייטיב קומונז — ייחוס, ללא שימוש מסחרי',
    url: 'https://creativecommons.org/licenses/by-nc/4.0/',
    commercialUse: 'restricted',
    commercialUseReason: 'CC BY-NC explicitly prohibits commercial use',
    allowsModification: true,
    requiresAttribution: true,
    shareAlike: false,
  },
  'CC-BY-NC-SA-4.0': {
    spdxId: 'CC-BY-NC-SA-4.0',
    shortName: 'CC BY-NC-SA',
    fullName: 'Creative Commons Attribution NonCommercial ShareAlike 4.0',
    localizedName: 'קריאייטיב קומונז — ייחוס, ללא שימוש מסחרי, שיתוף זהה',
    url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    commercialUse: 'restricted',
    commercialUseReason: 'CC BY-NC-SA explicitly prohibits commercial use',
    allowsModification: true,
    requiresAttribution: true,
    shareAlike: true,
  },
  'CC-BY-ND-4.0': {
    spdxId: 'CC-BY-ND-4.0',
    shortName: 'CC BY-ND',
    fullName: 'Creative Commons Attribution NoDerivatives 4.0',
    localizedName: 'קריאייטיב קומונז — ייחוס, ללא יצירות נגזרות',
    url: 'https://creativecommons.org/licenses/by-nd/4.0/',
    commercialUse: 'allowed',
    commercialUseReason: 'CC BY-ND permits commercial use (no derivatives required)',
    allowsModification: false,
    requiresAttribution: true,
    shareAlike: false,
  },
  'CC-BY-NC-ND-4.0': {
    spdxId: 'CC-BY-NC-ND-4.0',
    shortName: 'CC BY-NC-ND',
    fullName: 'Creative Commons Attribution NonCommercial NoDerivatives 4.0',
    localizedName: 'קריאייטיב קומונז — ייחוס, ללא שימוש מסחרי, ללא יצירות נגזרות',
    url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
    commercialUse: 'restricted',
    commercialUseReason: 'CC BY-NC-ND explicitly prohibits commercial use',
    allowsModification: false,
    requiresAttribution: true,
    shareAlike: false,
  },
  'CC0-1.0': {
    spdxId: 'CC0-1.0',
    shortName: 'CC0',
    fullName: 'Creative Commons Zero — Public Domain Dedication',
    localizedName: 'נחלת הכלל (CC0)',
    url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    commercialUse: 'allowed',
    commercialUseReason: 'CC0 dedicates to public domain — all uses permitted',
    allowsModification: true,
    requiresAttribution: false,
    shareAlike: false,
  },
  'GPL-3.0': {
    spdxId: 'GPL-3.0-only',
    shortName: 'GPL 3.0',
    fullName: 'GNU General Public License v3.0',
    localizedName: 'רישיון ציבורי כללי (GPL)',
    url: 'https://www.gnu.org/licenses/gpl-3.0.html',
    commercialUse: 'allowed',
    commercialUseReason: 'GPL permits commercial use with copyleft obligations',
    allowsModification: true,
    requiresAttribution: true,
    shareAlike: true,
  },
  'LGPL-3.0': {
    spdxId: 'LGPL-3.0-only',
    shortName: 'LGPL 3.0',
    fullName: 'GNU Lesser General Public License v3.0',
    localizedName: 'רישיון ציבורי כללי מוקטן (LGPL)',
    url: 'https://www.gnu.org/licenses/lgpl-3.0.html',
    commercialUse: 'allowed',
    commercialUseReason: 'LGPL permits commercial use with lesser copyleft obligations',
    allowsModification: true,
    requiresAttribution: true,
    shareAlike: false,
  },
  'BSD-2-Clause': {
    spdxId: 'BSD-2-Clause',
    shortName: 'BSD',
    fullName: 'BSD 2-Clause License',
    localizedName: 'רישיון BSD',
    url: 'https://opensource.org/licenses/BSD-2-Clause',
    commercialUse: 'allowed',
    commercialUseReason: 'BSD permits commercial use with minimal restrictions',
    allowsModification: true,
    requiresAttribution: true,
    shareAlike: false,
  },
  'UNKNOWN': {
    spdxId: 'NOASSERTION',
    shortName: 'לא ידוע',
    fullName: 'Unknown / Not Specified',
    localizedName: 'רישיון לא ידוע',
    url: '',
    commercialUse: 'unknown',
    commercialUseReason: 'License metadata missing or not provided by the source',
    allowsModification: false,
    requiresAttribution: true,
    shareAlike: false,
  },
};

export function getLicense(spdxId: string): ModelLicense {
  return LICENSES[spdxId] ?? LICENSES['UNKNOWN'];
}

export function getAllLicenses(): ModelLicense[] {
  return Object.values(LICENSES);
}

/**
 * Maps raw Thingiverse license strings to our canonical licenses.
 *
 * Thingiverse uses human-readable strings like
 *   "Creative Commons - Attribution - Share Alike"
 * which we normalize to "CC-BY-SA-4.0".
 *
 * Strict commercial-use interpretation:
 * - If the license string is missing/empty → 'unknown' (excluded from storefront)
 * - If the license string contains NC → 'restricted' (excluded from storefront)
 * - If the license string is unrecognized → 'unknown' (excluded from storefront)
 * - Only well-known permissive licenses → 'allowed'
 */
export function mapThingiverseLicense(raw: string | undefined | null): ModelLicense {
  if (!raw) {
    return {
      ...LICENSES['UNKNOWN'],
      rawProviderLicense: raw ?? undefined,
      commercialUseReason: 'Thingiverse model has no license metadata',
    };
  }

  const lower = raw.toLowerCase().trim();

  if (lower.includes('public domain') || lower === 'cc0') {
    return { ...LICENSES['CC0-1.0'], rawProviderLicense: raw };
  }

  if (lower.includes('creative commons') || lower.startsWith('cc')) {
    const nc = lower.includes('non-commercial') || lower.includes('noncommercial') || lower.includes('-nc');
    const sa = lower.includes('share alike') || lower.includes('sharealike') || lower.includes('-sa');
    const nd = lower.includes('no derivatives') || lower.includes('noderivatives') || lower.includes('no derivs') || lower.includes('-nd');

    if (nc && sa) return { ...LICENSES['CC-BY-NC-SA-4.0'], rawProviderLicense: raw };
    if (nc && nd) return { ...LICENSES['CC-BY-NC-ND-4.0'], rawProviderLicense: raw };
    if (nc) return { ...LICENSES['CC-BY-NC-4.0'], rawProviderLicense: raw };
    if (sa) return { ...LICENSES['CC-BY-SA-4.0'], rawProviderLicense: raw };
    if (nd) return { ...LICENSES['CC-BY-ND-4.0'], rawProviderLicense: raw };
    return { ...LICENSES['CC-BY-4.0'], rawProviderLicense: raw };
  }

  if (lower.includes('gpl') && !lower.includes('lgpl')) return { ...LICENSES['GPL-3.0'], rawProviderLicense: raw };
  if (lower.includes('lgpl')) return { ...LICENSES['LGPL-3.0'], rawProviderLicense: raw };
  if (lower.includes('bsd')) return { ...LICENSES['BSD-2-Clause'], rawProviderLicense: raw };

  return {
    ...LICENSES['UNKNOWN'],
    rawProviderLicense: raw,
    commercialUseReason: `Unrecognized Thingiverse license string: "${raw}"`,
  };
}

export function commercialUseLabel(use: LicenseCommercialUse): string {
  switch (use) {
    case 'allowed': return 'מותר לשימוש מסחרי';
    case 'restricted': return 'שימוש מסחרי מוגבל';
    case 'unknown': return 'תנאי שימוש לא ידועים';
  }
}
