import type { ProductCategory } from "../../../types/realitylens.ts";

const RULES: Array<{ category: ProductCategory; pattern: RegExp }> = [
  {
    category: "shoes",
    pattern:
      /\b(shoe|shoes|sneaker|sneakers|trainer|trainers|boot|boots|loafer|loafers|sandal|sandals|heel|heels|footwear)\b/i,
  },
  {
    category: "watch",
    pattern: /\b(watch|watches|timepiece)\b/i,
  },
  {
    category: "bag",
    pattern: /\b(bag|bags|handbag|handbags|purse|backpack|tote)\b/i,
  },
  {
    category: "hat",
    pattern: /\b(hat|hats|cap|beanie|beret)\b/i,
  },
  {
    category: "clothes",
    pattern:
      /\b(shirt|jacket|hoodie|dress|pants|jeans|coat|sweater|tee|t-shirt|blouse|skirt|shorts|suit|outerwear|apparel|clothing)\b/i,
  },
  {
    category: "ring",
    pattern: /\b(ring|rings)\b/i,
  },
  {
    category: "bracelet",
    pattern: /\b(bracelet|bracelets)\b/i,
  },
  {
    category: "earrings",
    pattern: /\b(earring|earrings)\b/i,
  },
  {
    category: "necklace",
    pattern: /\b(necklace|necklaces|pendant)\b/i,
  },
  {
    category: "scarf",
    pattern: /\b(scarf|scarves)\b/i,
  },
];

/** Phase 1 implements shoes only. Other categories wait until Phase 4. */
const TRY_ON_CATEGORIES = new Set<ProductCategory>(["shoes"]);

export function classifyCategory(text: string): ProductCategory {
  const haystack = text.trim();
  if (!haystack) return "other";

  for (const rule of RULES) {
    if (rule.pattern.test(haystack)) return rule.category;
  }

  return "other";
}

export function isTryOnSupported(category: ProductCategory): boolean {
  return TRY_ON_CATEGORIES.has(category);
}
