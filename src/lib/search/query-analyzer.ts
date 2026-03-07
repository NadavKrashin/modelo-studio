/**
 * Bilingual query analyzer for Hebrew ↔ English search.
 *
 * Responsibilities:
 *  - Detect primary language of a query
 *  - Normalize and tokenize input
 *  - Expand Hebrew queries with English translations for provider search
 *  - Expand English queries with Hebrew equivalents for local matching
 *
 * The translation dictionaries are domain-specific (3D printing / model catalog).
 * For production, replace with a proper translation API or embedding-based lookup.
 */

export type QueryLanguage = 'he' | 'en' | 'mixed';

export interface AnalyzedQuery {
  original: string;
  normalized: string;
  language: QueryLanguage;
  tokens: string[];
  expandedTokens: string[];
  providerQuery: string;
}

const HEBREW_RANGE = /[\u0590-\u05FF]/;
const LATIN_RANGE = /[a-zA-Z]/;

const HE_TO_EN: Record<string, string[]> = {
  'דרקון': ['dragon'],
  'דינוזאור': ['dinosaur'],
  'עציץ': ['planter', 'pot', 'vase'],
  'מנורה': ['lamp', 'light'],
  'צעצוע': ['toy'],
  'צעצועים': ['toys'],
  'משחק': ['game'],
  'מחזיק מפתחות': ['keychain', 'key holder'],
  'מחזיק': ['holder', 'stand'],
  'טלפון': ['phone'],
  'מעמד': ['stand', 'mount'],
  'מעמד לטלפון': ['phone stand', 'phone holder'],
  'ארגונית': ['organizer'],
  'מגדל קוביות': ['dice tower'],
  'קוביות': ['dice'],
  'פסל': ['sculpture', 'statue', 'bust'],
  'מיניאטורה': ['miniature', 'mini'],
  'מיניאטורות': ['miniatures'],
  'דמות': ['figure', 'figurine', 'character'],
  'דמויות': ['figures', 'figurines'],
  'בית': ['house', 'home'],
  'עיצוב': ['design', 'decor'],
  'עיצוב הבית': ['home decor'],
  'תכשיט': ['jewelry'],
  'תכשיטים': ['jewelry', 'jewellery'],
  'טבעת': ['ring'],
  'שרשרת': ['necklace'],
  'צמיד': ['bracelet'],
  'עגיל': ['earring'],
  'עגילים': ['earrings'],
  'מתנה': ['gift'],
  'מתנות': ['gifts'],
  'כלי': ['tool'],
  'כלים': ['tools'],
  'חינוך': ['education', 'educational'],
  'לימוד': ['learning', 'educational'],
  'אמנות': ['art'],
  'שלט': ['sign'],
  'אותיות': ['letters'],
  'חיה': ['animal'],
  'חיות': ['animals'],
  'חתול': ['cat'],
  'כלב': ['dog'],
  'ציפור': ['bird'],
  'דג': ['fish'],
  'פרח': ['flower'],
  'פרחים': ['flowers'],
  'רובוט': ['robot'],
  'מכונית': ['car'],
  'מטוס': ['airplane', 'plane'],
  'ספינה': ['ship', 'boat'],
  'גלגל שיניים': ['gear'],
  'מנגנון': ['mechanism', 'mechanical'],
  'ארנק': ['wallet'],
  'קופסה': ['box', 'case'],
  'מגן': ['shield', 'case', 'cover'],
  'כיסוי': ['cover', 'case'],
  'חג': ['holiday'],
  'חנוכה': ['hanukkah', 'chanukah'],
  'פורים': ['purim'],
  'סביבון': ['dreidel'],
  'מזוזה': ['mezuzah'],
  'חמסה': ['hamsa'],
  'מגן דוד': ['star of david', 'magen david'],
};

const EN_TO_HE: Record<string, string[]> = {};
for (const [he, enWords] of Object.entries(HE_TO_EN)) {
  for (const en of enWords) {
    const lower = en.toLowerCase();
    if (!EN_TO_HE[lower]) EN_TO_HE[lower] = [];
    if (!EN_TO_HE[lower].includes(he)) EN_TO_HE[lower].push(he);
  }
}

export function detectLanguage(text: string): QueryLanguage {
  let heCount = 0;
  let enCount = 0;
  for (const ch of text) {
    if (HEBREW_RANGE.test(ch)) heCount++;
    if (LATIN_RANGE.test(ch)) enCount++;
  }
  if (heCount > 0 && enCount > 0) return 'mixed';
  if (heCount > 0) return 'he';
  return 'en';
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function expandHebrew(tokens: string[], original: string): string[] {
  const expanded = new Set<string>();

  const fullMatch = HE_TO_EN[original.trim()];
  if (fullMatch) {
    for (const en of fullMatch) expanded.add(en);
  }

  for (const token of tokens) {
    expanded.add(token);
    const enEquivalents = HE_TO_EN[token];
    if (enEquivalents) {
      for (const en of enEquivalents) expanded.add(en);
    }
  }

  const twoWordCombos = tokens.slice();
  for (let i = 0; i < twoWordCombos.length - 1; i++) {
    const bigram = `${twoWordCombos[i]} ${twoWordCombos[i + 1]}`;
    const bigramMatch = HE_TO_EN[bigram];
    if (bigramMatch) {
      for (const en of bigramMatch) expanded.add(en);
    }
  }

  return [...expanded];
}

function expandEnglish(tokens: string[]): string[] {
  const expanded = new Set<string>();

  for (const token of tokens) {
    expanded.add(token);
    const heEquivalents = EN_TO_HE[token];
    if (heEquivalents) {
      for (const he of heEquivalents) expanded.add(he);
    }
  }

  return [...expanded];
}

export function analyzeQuery(raw: string): AnalyzedQuery {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      original: raw,
      normalized: '',
      language: 'en',
      tokens: [],
      expandedTokens: [],
      providerQuery: '',
    };
  }

  const language = detectLanguage(trimmed);
  const normalized = trimmed.toLowerCase();
  const tokens = tokenize(trimmed);

  let expandedTokens: string[];
  let providerQuery: string;

  if (language === 'he') {
    expandedTokens = expandHebrew(tokens, trimmed);
    const englishOnly = expandedTokens.filter((t) => !HEBREW_RANGE.test(t));
    providerQuery = englishOnly.length > 0 ? englishOnly.join(' ') : normalized;
  } else if (language === 'mixed') {
    const heTokens = tokens.filter((t) => HEBREW_RANGE.test(t));
    const enTokens = tokens.filter((t) => !HEBREW_RANGE.test(t));
    const heExpanded = expandHebrew(heTokens, heTokens.join(' '));
    expandedTokens = [...new Set([...tokens, ...heExpanded])];
    const englishOnly = [...enTokens, ...heExpanded.filter((t) => !HEBREW_RANGE.test(t))];
    providerQuery = [...new Set(englishOnly)].join(' ') || normalized;
  } else {
    expandedTokens = expandEnglish(tokens);
    providerQuery = normalized;
  }

  return {
    original: raw,
    normalized,
    language,
    tokens,
    expandedTokens,
    providerQuery,
  };
}
