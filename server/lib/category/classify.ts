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
      /\b(shirt|jacket|hoodie|dress|pants|jeans|coat|sweater|tee|t-shirt|blouse|skirt|shorts|suit|outerwear|apparel|clothing|top|cardigan|vest|pullover|crewneck|polo|trousers|leggings|jumpsuit|romper|gown|overalls?|chino|blazer|parka|windbreaker|sweatshirt)\b/i,
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
  /\b(pants|jeans|trousers|shorts|skirt|leggings|chinos?|sweatpants|joggers|culottes)\b/i;
const FULL_BODY =
  /\b(dress|jumpsuit|romper|suit|tuxedo|gown|overalls?|onesie|bodysuit)\b/i;
const UPPER_BODY =
  /\b(shirt|jacket|hoodie|coat|sweater|tee|t-shirt|blouse|top|cardigan|vest|pullover|crewneck|polo|blazer|parka|windbreaker|sweatshirt|tank|camisole|outerwear)\b/i;

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
  if (LOWER_BODY.test(haystack)) return "lower_body";
  if (FULL_BODY.test(haystack)) return "full_body";
  if (UPPER_BODY.test(haystack)) return "upper_body";
  return "auto";
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
      return "Use a full-body photo with your feet visible. Only the shoes will change.";
    case "lower_body":
      return "Use a full-body photo with legs visible. Only the bottoms will change.";
    case "upper_body":
      return "Use a photo that shows your torso. Only the top will change.";
    case "full_body":
      return "Use a full-body photo. The outfit on your photo will be replaced.";
    default:
      return "Use a clear full-body photo. Only the scanned item region will change.";
  }
}

function frameLabelFor(garment: GarmentCategory): string {
  switch (garment) {
    case "shoes":
      return "Full body · feet visible";
    case "lower_body":
      return "Full body · legs visible";
    case "upper_body":
      return "Half body · torso";
    case "full_body":
      return "Full body";
    default:
      return "Full body preferred";
  }
}
