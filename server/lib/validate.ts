import type { GoogleLensResponse } from "./serpapi/lens.ts";
import type {
  MatchLabel,
  Offer,
  ProductCategory,
  ProductMatch,
  ScanResult,
  TryOnResult,
  TryOnStatus,
} from "../../types/realitylens.ts";

const PRODUCT_CATEGORIES = new Set<ProductCategory>([
  "shoes",
  "clothes",
  "watch",
  "bag",
  "hat",
  "ring",
  "bracelet",
  "earrings",
  "necklace",
  "scarf",
  "other",
]);

const MATCH_LABELS = new Set<MatchLabel>([
  "exact_match",
  "best_match",
  "similar",
]);

const TRY_ON_STATUSES = new Set<TryOnStatus>([
  "processing",
  "completed",
  "error",
]);

export function coerceLensResponse(body: unknown): GoogleLensResponse {
  if (!body || typeof body !== "object") {
    throw new Error("Malformed Google Lens response.");
  }

  const raw = body as Record<string, unknown>;
  const visual = Array.isArray(raw.visual_matches) ? raw.visual_matches : [];
  const shopping = Array.isArray(raw.shopping_results)
    ? raw.shopping_results
    : [];

  return {
    visual_matches: visual.filter(isRecord).map(coerceVisualMatch),
    shopping_results: shopping.filter(isRecord).map(coerceVisualMatch),
    related_content: Array.isArray(raw.related_content)
      ? raw.related_content
      : undefined,
    search_metadata: isRecord(raw.search_metadata)
      ? raw.search_metadata
      : undefined,
    search_parameters: isRecord(raw.search_parameters)
      ? raw.search_parameters
      : undefined,
  };
}

function coerceVisualMatch(raw: Record<string, unknown>) {
  return {
    position: typeof raw.position === "number" ? raw.position : undefined,
    title: typeof raw.title === "string" ? raw.title : undefined,
    link: typeof raw.link === "string" ? raw.link : undefined,
    source: typeof raw.source === "string" ? raw.source : undefined,
    rating: typeof raw.rating === "number" ? raw.rating : undefined,
    reviews: typeof raw.reviews === "number" ? raw.reviews : undefined,
    price:
      typeof raw.price === "string" || isRecord(raw.price)
        ? (raw.price as string | { value?: string; extracted_value?: number; currency?: string })
        : undefined,
    extracted_price:
      typeof raw.extracted_price === "number" ? raw.extracted_price : undefined,
    in_stock: typeof raw.in_stock === "boolean" ? raw.in_stock : undefined,
    thumbnail: typeof raw.thumbnail === "string" ? raw.thumbnail : undefined,
    image: typeof raw.image === "string" ? raw.image : undefined,
  };
}

export function assertScanResult(value: unknown): ScanResult {
  if (!isRecord(value)) {
    throw new Error("Invalid scan result payload.");
  }

  const scanId = asNonEmptyString(value.scanId);
  if (!scanId) {
    throw new Error("Scan result missing scanId.");
  }

  const bestMatch =
    value.bestMatch == null ? null : assertProductMatch(value.bestMatch);
  const offers = Array.isArray(value.offers)
    ? value.offers
        .map((offer) => {
          try {
            return assertOffer(offer);
          } catch {
            return null;
          }
        })
        .filter((offer): offer is Offer => offer !== null)
    : [];

  const tryOnSupported = Boolean(value.tryOnSupported);
  const tryOnCategory = asProductCategory(value.tryOnCategory);
  const garmentCategory = asGarmentCategory(value.garmentCategory);

  return {
    scanId,
    bestMatch,
    offers,
    tryOnSupported,
    tryOnCategory: tryOnSupported ? tryOnCategory : undefined,
    garmentCategory: tryOnSupported ? garmentCategory : undefined,
  };
}

export function assertTryOnResult(value: unknown): TryOnResult {
  if (!isRecord(value)) {
    throw new Error("Invalid try-on result payload.");
  }

  const status = value.status;
  if (typeof status !== "string" || !TRY_ON_STATUSES.has(status as TryOnStatus)) {
    throw new Error("Try-on result missing status.");
  }

  return {
    status: status as TryOnStatus,
    jobId: asNonEmptyString(value.jobId),
    resultImageUrl: asNonEmptyString(value.resultImageUrl),
    provider: value.provider === "perfect_corp" ? "perfect_corp" : undefined,
    error: asNonEmptyString(value.error),
  };
}

function assertProductMatch(value: unknown): ProductMatch {
  if (!isRecord(value)) {
    throw new Error("Invalid product match.");
  }

  const id = asNonEmptyString(value.id) ?? "match_unknown";
  const title = asNonEmptyString(value.title) ?? "Unknown product";
  const category = asProductCategory(value.category) ?? "other";
  const labelRaw = asNonEmptyString(value.label);
  const label: MatchLabel =
    labelRaw && MATCH_LABELS.has(labelRaw as MatchLabel)
      ? (labelRaw as MatchLabel)
      : "similar";

  return {
    id,
    title,
    category,
    imageUrl: asNonEmptyString(value.imageUrl),
    source: asNonEmptyString(value.source),
    url: asNonEmptyString(value.url),
    label,
  };
}

function assertOffer(value: unknown): Offer {
  if (!isRecord(value)) {
    throw new Error("Invalid offer.");
  }

  const url = asNonEmptyString(value.url);
  if (!url) {
    throw new Error("Offer missing url.");
  }

  return {
    id: asNonEmptyString(value.id) ?? `offer_${url}`,
    title: asNonEmptyString(value.title) ?? "Untitled offer",
    merchant: asNonEmptyString(value.merchant),
    priceText: asNonEmptyString(value.priceText),
    priceValue: typeof value.priceValue === "number" ? value.priceValue : undefined,
    currency: asNonEmptyString(value.currency),
    inStock: typeof value.inStock === "boolean" ? value.inStock : undefined,
    rating: typeof value.rating === "number" ? value.rating : undefined,
    reviews: typeof value.reviews === "number" ? value.reviews : undefined,
    imageUrl: asNonEmptyString(value.imageUrl),
    url,
  };
}

function asProductCategory(value: unknown): ProductCategory | undefined {
  return typeof value === "string" && PRODUCT_CATEGORIES.has(value as ProductCategory)
    ? (value as ProductCategory)
    : undefined;
}

function asGarmentCategory(
  value: unknown,
): ScanResult["garmentCategory"] | undefined {
  const allowed = new Set([
    "full_body",
    "lower_body",
    "upper_body",
    "outerwear",
    "shoes",
    "auto",
  ]);
  return typeof value === "string" && allowed.has(value)
    ? (value as ScanResult["garmentCategory"])
    : undefined;
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
