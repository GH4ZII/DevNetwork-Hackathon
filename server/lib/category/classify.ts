import type { ProductCategory } from "../../../types/realitylens.ts";
import type { ScanResult } from "../../../types/realitylens.ts";
import type { GarmentCategory } from "../perfect/cloth.ts";

export type TryOnIntegration = "cloth-v4" | "watch-vto";

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
      /\b(shirt|jacket|hoodie|dress|pants|jeans|coat|sweater|jumper|jumpers|tee|t-shirt|blouse|skirt|shorts|suit|outerwear|apparel|clothing|top|cardigan|vest|pullover|crewneck|polo|trousers|leggings|jumpsuit|romper|gown|overalls?|chino|blazer|parka|windbreaker|sweatshirt|knitwear|turtleneck|fleece)\b|skjorte|bluse|genser|hettegenser|bukse|skjørt|joggebukse|kjole|jakke|kåpe/i,
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

const TRY_ON_CATEGORIES = new Set<ProductCategory>([
  "shoes",
  "clothes",
  "watch",
]);

const LOWER_BODY =
  /\b(pants|jeans|trousers|shorts|skirt|leggings|chinos?|sweatpants|joggers|culottes)\b|bukse|bukser|skjørt|joggebukse/i;
const FULL_BODY =
  /\b(dress|jumpsuit|romper|suit|tuxedo|gown|overalls?|onesie|bodysuit)\b|kjole|kjoler/i;
/** Jackets/coats: Perfect Corp cloth-v4 outerwear swaps only the outer layer. */
const OUTERWEAR =
  /\b(jacket|jackets|coat|coats|blazer|blazers|parka|parkas|windbreaker|vest|vests|outerwear)\b|jakke|jakker|kåpe|kåper|ytterjakke/i;
const UPPER_BODY =
  /\b(shirt|hoodie|sweater|jumper|jumpers|tee|t-shirt|blouse|top|cardigan|pullover|crewneck|polo|sweatshirt|tank|camisole|knitwear|turtleneck|fleece)\b|skjorte|skjorter|bluse|bluser|genser|gensere|hettegenser/i;

const GARMENT_PATTERNS: Array<{ category: GarmentCategory; pattern: RegExp }> = [
  { category: "full_body", pattern: FULL_BODY },
  { category: "outerwear", pattern: OUTERWEAR },
  { category: "upper_body", pattern: UPPER_BODY },
  { category: "lower_body", pattern: LOWER_BODY },
];

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

export function resolveTryOnIntegration(
  category: ProductCategory,
): TryOnIntegration | null {
  if (category === "watch") return "watch-vto";
  if (category === "shoes" || category === "clothes") return "cloth-v4";
  return null;
}

export function toGarmentCategory(
  category: ProductCategory,
  text = "",
): GarmentCategory | null {
  if (category === "shoes") return "shoes";
  if (category !== "clothes") return null;

  const haystack = text.trim();
  if (!haystack) return "auto";
  return leftmostGarment(haystack);
}

function leftmostGarment(text: string): GarmentCategory {
  let bestIndex = Infinity;
  let best: GarmentCategory = "auto";

  for (const { category, pattern } of GARMENT_PATTERNS) {
    const match = new RegExp(pattern.source, pattern.flags).exec(text);
    if (match && match.index < bestIndex) {
      bestIndex = match.index;
      best = category;
    }
  }

  return best;
}

export function tryOnPhotoGuide(
  category: ProductCategory,
  garmentCategory?: ScanResult["garmentCategory"],
): { hint: string; frameLabel: string } {
  if (category === "watch") {
    return {
      hint: "Hold your wrist toward the camera with the watch area clearly visible.",
      frameLabel: "Wrist · hand visible",
    };
  }

  const garment = garmentCategory ?? (category === "shoes" ? "shoes" : "auto");
  return {
    hint: tryOnHint(garment),
    frameLabel: frameLabelFor(garment),
  };
}

export function tryOnHint(garment: GarmentCategory): string {
  switch (garment) {
    case "shoes":
      return "Use a full-body photo with your feet visible. Only the shoes will change — the rest of you stays.";
    case "lower_body":
      return "Use a full-body photo with legs visible. Only the bottoms will change — your full body stays in frame.";
    case "upper_body":
      return "Use a full-body photo. Only the top (sweater, shirt, etc.) will change — nothing else is cropped.";
    case "outerwear":
      return "Use a full-body photo. Only the jacket/coat layer will change — your full body stays visible.";
    case "full_body":
      return "Use a full-body photo. The outfit on your photo will be replaced, but the whole frame is kept.";
    default:
      return "Use a clear full-body photo. Only the scanned item region will change — your full body stays visible.";
  }
}

function frameLabelFor(garment: GarmentCategory): string {
  switch (garment) {
    case "shoes":
      return "Full body · feet visible";
    case "lower_body":
      return "Full body · legs visible";
    case "upper_body":
      return "Full body · top only swaps";
    case "outerwear":
      return "Full body · jacket only swaps";
    case "full_body":
      return "Full body";
    default:
      return "Full body preferred";
  }
}
