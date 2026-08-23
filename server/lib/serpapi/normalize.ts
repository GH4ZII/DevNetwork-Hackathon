import { randomUUID } from "node:crypto";
import {
  classifyCategory,
  isTryOnSupported,
} from "../category/classify.ts";
import type { GoogleLensResponse, LensVisualMatch } from "./lens.ts";
import type { Offer, ProductMatch, ScanResult } from "../../../types/realitylens.ts";

export function normalizeScanResult(
  visual: GoogleLensResponse,
  products: GoogleLensResponse,
): ScanResult {
  const visualMatches = visual.visual_matches ?? [];
  const productMatches = products.visual_matches ?? [];
  const bestRaw = visualMatches[0] ?? productMatches[0];
  const categoryText = [
    ...visualMatches.slice(0, 5).map((match) => match.title ?? ""),
    ...productMatches.slice(0, 5).map((match) => match.title ?? ""),
  ].join(" ");
  const category = classifyCategory(categoryText);
  const bestMatch = bestRaw ? toProductMatch(bestRaw, category) : null;
  const offers = productMatches
    .map(toOffer)
    .filter((offer): offer is Offer => offer !== null)
    .sort(compareOffers);

  return {
    scanId: `scan_${randomUUID()}`,
    bestMatch,
    offers,
    tryOnSupported: isTryOnSupported(category),
    tryOnCategory: isTryOnSupported(category) ? category : undefined,
  };
}

function toProductMatch(
  match: LensVisualMatch,
  category: ScanResult["tryOnCategory"],
): ProductMatch {
  return {
    id: `match_${match.position ?? 1}`,
    title: match.title?.trim() || "Unknown product",
    category: category ?? "other",
    imageUrl: match.image ?? match.thumbnail,
    source: match.source,
    url: match.link,
    label: match.position === 1 ? "best_match" : "similar",
  };
}

function toOffer(match: LensVisualMatch): Offer | null {
  if (!match.link) return null;

  const price = parsePrice(match);
  return {
    id: `offer_${match.position ?? randomUUID()}`,
    title: match.title?.trim() || "Untitled offer",
    merchant: match.source,
    priceText: price.text,
    priceValue: price.value,
    currency: price.currency,
    inStock: match.in_stock,
    rating: match.rating,
    reviews: match.reviews,
    imageUrl: match.image ?? match.thumbnail,
    url: match.link,
  };
}

function parsePrice(match: LensVisualMatch): {
  text?: string;
  value?: number;
  currency?: string;
} {
  if (typeof match.price === "string") {
    return {
      text: match.price,
      value: match.extracted_price,
    };
  }

  if (match.price && typeof match.price === "object") {
    return {
      text: match.price.value,
      value: match.price.extracted_value,
      currency: match.price.currency,
    };
  }

  return { value: match.extracted_price };
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
