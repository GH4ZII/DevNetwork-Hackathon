import { randomUUID } from "node:crypto";
import { classifyCategory, isTryOnSupported, toGarmentCategory } from "../category/classify.ts";
import type { GoogleLensResponse, LensVisualMatch } from "./lens.ts";
import type { Offer, ProductMatch, ScanResult } from "../../../types/realitylens.ts";

export function normalizeScanResult(
  visual: GoogleLensResponse,
  products: GoogleLensResponse,
): ScanResult {
  const visualMatches = Array.isArray(visual.visual_matches)
    ? visual.visual_matches
    : [];
  const productMatches = Array.isArray(products.visual_matches)
    ? products.visual_matches
    : [];
  const bestRaw = visualMatches[0] ?? productMatches[0];
  const categoryText = [
    ...visualMatches.slice(0, 5).map((match) => safeTitle(match.title)),
    ...productMatches.slice(0, 5).map((match) => safeTitle(match.title)),
  ].join(" ");
  const category = classifyCategory(categoryText);
  const bestMatch = bestRaw ? toProductMatch(bestRaw, category) : null;
  const offers = productMatches
    .map(toOffer)
    .filter((offer): offer is Offer => offer !== null)
    .sort(compareOffers);
  const hasProduct = Boolean(bestMatch || offers.length > 0);
  const supported = hasProduct && isTryOnSupported(category);
  const garmentCategory = supported
    ? toGarmentCategory(category, categoryText) ?? undefined
    : undefined;

  return {
    scanId: `scan_${randomUUID()}`,
    bestMatch,
    offers,
    tryOnSupported: supported,
    tryOnCategory: supported ? category : undefined,
    garmentCategory,
  };
}

function safeTitle(title: unknown): string {
  return typeof title === "string" ? title : "";
}

function toProductMatch(
  match: LensVisualMatch,
  category: ScanResult["tryOnCategory"],
): ProductMatch {
  return {
    id: `match_${typeof match.position === "number" ? match.position : 1}`,
    title: safeTitle(match.title).trim() || "Unknown product",
    category: category ?? "other",
    imageUrl: asUrl(match.image) ?? asUrl(match.thumbnail),
    source: typeof match.source === "string" ? match.source : undefined,
    url: asUrl(match.link),
    label: match.position === 1 ? "best_match" : "similar",
  };
}

function toOffer(match: LensVisualMatch): Offer | null {
  const url = asUrl(match.link);
  if (!url) return null;

  const price = parsePrice(match);
  return {
    id: `offer_${typeof match.position === "number" ? match.position : randomUUID()}`,
    title: safeTitle(match.title).trim() || "Untitled offer",
    merchant: typeof match.source === "string" ? match.source : undefined,
    priceText: price.text,
    priceValue: price.value,
    currency: price.currency,
    inStock: typeof match.in_stock === "boolean" ? match.in_stock : undefined,
    rating: typeof match.rating === "number" ? match.rating : undefined,
    reviews: typeof match.reviews === "number" ? match.reviews : undefined,
    imageUrl: asUrl(match.image) ?? asUrl(match.thumbnail),
    url,
  };
}

function asUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function parsePrice(match: LensVisualMatch): {
  text?: string;
  value?: number;
  currency?: string;
} {
  if (typeof match.price === "string") {
    return {
      text: match.price.trim() || undefined,
      value:
        typeof match.extracted_price === "number"
          ? match.extracted_price
          : undefined,
    };
  }

  if (match.price && typeof match.price === "object") {
    const text =
      typeof match.price.value === "string" ? match.price.value.trim() : undefined;
    const value =
      typeof match.price.extracted_value === "number"
        ? match.price.extracted_value
        : typeof match.extracted_price === "number"
          ? match.extracted_price
          : undefined;
    const currency =
      typeof match.price.currency === "string"
        ? match.price.currency
        : undefined;
    return { text: text || undefined, value, currency };
  }

  return {
    value:
      typeof match.extracted_price === "number"
        ? match.extracted_price
        : undefined,
  };
}

function compareOffers(a: Offer, b: Offer): number {
  const aScore = (a.priceValue != null ? 2 : 0) + (a.inStock ? 1 : 0);
  const bScore = (b.priceValue != null ? 2 : 0) + (b.inStock ? 1 : 0);
  if (aScore !== bScore) return bScore - aScore;
  if (a.priceValue != null && b.priceValue != null) {
    return a.priceValue - b.priceValue;
  }
  return 0;
}
