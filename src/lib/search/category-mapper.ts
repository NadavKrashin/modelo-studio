/**
 * Shared bilingual category mapper.
 *
 * Maps keywords (from tags, names, descriptions) to internal category IDs.
 * Supports both English and Hebrew keywords for each category.
 *
 * Used by:
 *  - Provider normalizers (Thingiverse, future providers)
 *  - Ranking engine (category relevance scoring)
 *  - Search query expansion
 */

export interface CategoryRule {
  categoryId: string;
  patterns: RegExp[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    categoryId: 'cat-home-decor',
    patterns: [
      /\b(home|house|household|decor|vase|planter|shelf|lamp|hook|hanger|coaster|candle|frame)\b/i,
      /(?:בית|עיצוב|אגרטל|עציץ|מדף|מנורה|וו|קולב|תחתית|נר|מסגרת)/,
    ],
  },
  {
    categoryId: 'cat-gadgets',
    patterns: [
      /\b(gadget|tool|clip|holder|mount|stand|bracket|adapter|organiz|cable|charger)\b/i,
      /(?:גאדג׳ט|כלי|קליפס|מחזיק|מעמד|סוגר|מתאם|ארגונית|כבל|מטען)/,
    ],
  },
  {
    categoryId: 'cat-toys',
    patterns: [
      /\b(toy|game|fidget|puzzle|spinner|dice|board.?game|lego|plaything|action.?figure)\b/i,
      /(?:צעצוע|משחק|פידג׳ט|פאזל|ספינר|קוביות|לגו)/,
    ],
  },
  {
    categoryId: 'cat-art',
    patterns: [
      /\b(art|sculpt|bust|statue|figurine|lithophane|relief|ornament|abstract)\b/i,
      /(?:אמנות|פיסול|פסל|דמות|תבליט|קישוט|מופשט)/,
    ],
  },
  {
    categoryId: 'cat-office',
    patterns: [
      /\b(office|desk|pen|pencil|card.?holder|monitor|keyboard|laptop|cable.?manage)\b/i,
      /(?:משרד|שולחן|עט|עיפרון|מסך|מקלדת|לפטופ)/,
    ],
  },
  {
    categoryId: 'cat-fashion',
    patterns: [
      /\b(fashion|jewel|ring|earring|pendant|necklace|bracelet|wearable|brooch)\b/i,
      /(?:אופנה|תכשיט|טבעת|עגיל|תליון|שרשרת|צמיד|סיכה)/,
    ],
  },
  {
    categoryId: 'cat-education',
    patterns: [
      /\b(edu|learn|teach|school|anatomy|science|math|model.?kit|stem)\b/i,
      /(?:חינוך|לימוד|בית.?ספר|אנטומיה|מדע|מתמטיקה)/,
    ],
  },
  {
    categoryId: 'cat-miniatures',
    patterns: [
      /\b(mini|miniature|tabletop|warhammer|dnd|d&d|rpg|terrain|figure|28mm|32mm)\b/i,
      /(?:מיניאטורה|מיניאטורות|שולחן|דמות|דמויות)/,
    ],
  },
  {
    categoryId: 'cat-mechanical',
    patterns: [
      /\b(mechanic|gear|bearing|joint|hinge|coupling|pulley|engine|functional)\b/i,
      /(?:מכניקה|גלגל.?שיניים|מסב|ציר|מנוע|פונקציונלי)/,
    ],
  },
  {
    categoryId: 'cat-gifts',
    patterns: [
      /\b(gift|personal|keychain|tag|nameplate|custom|sign|letter|monogram)\b/i,
      /(?:מתנה|מתנות|מחזיק.?מפתחות|שלט|אותיות|אישי|מותאם)/,
    ],
  },
];

const MAX_CATEGORIES = 3;

/**
 * Infers internal category IDs from a combined text of tags and name.
 * Falls back to 'cat-gadgets' when no match is found.
 */
export function inferCategories(tags: string[], name: string): string[] {
  const text = [name, ...tags].join(' ');
  const matched = new Set<string>();

  for (const rule of CATEGORY_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        matched.add(rule.categoryId);
        break;
      }
    }
  }

  if (matched.size === 0) matched.add('cat-gadgets');
  return [...matched].slice(0, MAX_CATEGORIES);
}

/**
 * Returns the category ID that best matches a query string, or undefined.
 * Useful for auto-detecting category filters from search queries.
 */
export function detectCategoryFromQuery(query: string): string | undefined {
  for (const rule of CATEGORY_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(query)) {
        return rule.categoryId;
      }
    }
  }
  return undefined;
}

export { CATEGORY_RULES };
