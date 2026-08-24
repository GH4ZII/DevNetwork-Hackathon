import { randomUUID } from "node:crypto";
import { classifyCategory, isTryOnSupported, toGarmentCategory } from "../category/classify.ts";
import {
  currencyForCountry,
  formatOfferPrice,
  inferCurrency,
  isLocalMarketUrl,
  localizeUrl,
} from "../locale/markets.ts";
import type { GoogleLensResponse, LensVisualMatch } from "./lens.ts";
import type { Offer, ProductMatch, ScanResult } from "../../../types/realitylens.ts";

export function normalizeScanResult(
  visual: GoogleLensResponse,
  products: GoogleLensResponse,
  country = "no",
): ScanResult {
  const visualMatches = Array.isArray(visual.visual_matches)
    ? visual.visual_matches
    : [];
  const productMatches = Array.isArray(products.visual_matches)
    ? products.visual_matches
    : [];
  const bestRaw = visualMatches[0] ?? productMatches[0];
  const primaryTitle = safeTitle(bestRaw?.title);
  let category = classifyCategory(primaryTitle);
  if (category === "other") {
    category = classifyCategory(safeTitle(productMatches[0]?.title));
  }
  const bestMatch = bestRaw ? toProductMatch(bestRaw, category, country) : null;
  const marketCurrency = currencyForCountry(country);
  const offers = productMatches
    .map((match) => toOffer(match, country))
    .filter((offer): offer is Offer => offer !== null)
    .sort((a, b) => compareOffers(a, b, country, marketCurrency));
  if (bestMatch) attachMatchPrice(bestMatch, offers);
  const hasProduct = Boolean(bestMatch || offers.length > 0);
  const supported = hasProduct && isTryOnSupported(category);
  const garmentCategory = supported
    ? toGarmentCategory(category, primaryTitle) ?? undefined
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
  country: string,
): ProductMatch {
  const url = asUrl(match.link);
  const price = parsePrice(match, country);
  return {
    id: `match_${typeof match.position === "number" ? match.position : 1}`,
    title: safeTitle(match.title).trim() || "Unknown product",
    category: category ?? "other",
    imageUrl: asUrl(match.image) ?? asUrl(match.thumbnail),
    source: typeof match.source === "string" ? match.source : undefined,
    url: url ? localizeUrl(url, country) : undefined,
    priceText: formatOfferPrice(price.value, price.currency, country, price.text),
    priceValue: price.value,
    currency: price.currency,
    label: match.position === 1 ? "best_match" : "similar",
  };
}

function attachMatchPrice(match: ProductMatch, offers: Offer[]): void {
  const linked = match.url
    ? offers.find((offer) => sameListing(offer.url, match.url))
    : undefined;
  if (!linked?.priceText && linked?.priceValue == null) return;
  match.priceText = linked.priceText ?? match.priceText;
  match.priceValue = linked.priceValue ?? match.priceValue;
  match.currency = linked.currency ?? match.currency;
}

function sameListing(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const left = listingKey(a);
  const right = listingKey(b);
  return Boolean(left && right && left === right);
}

function listingKey(raw: string): string | undefined {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return `${host}${path}`;
  } catch {
    return undefined;
  }
}

function toOffer(match: LensVisualMatch, country: string): Offer | null {
  const url = asUrl(match.link);
  if (!url) return null;

  const price = parsePrice(match, country);
  return {
    id: `offer_${typeof match.position === "number" ? match.position : randomUUID()}`,
    title: safeTitle(match.title).trim() || "Untitled offer",
    merchant: typeof match.source === "string" ? match.source : undefined,
    priceText: formatOfferPrice(price.value, price.currency, country, price.text),
    priceValue: price.value,
    currency: price.currency,
    inStock: typeof match.in_stock === "boolean" ? match.in_stock : undefined,
    rating: typeof match.rating === "number" ? match.rating : undefined,
    reviews: typeof match.reviews === "number" ? match.reviews : undefined,
    imageUrl: asUrl(match.image) ?? asUrl(match.thumbnail),
    url: localizeUrl(url, country),
  };
}

function asUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function parsePrice(
  match: LensVisualMatch,
  country: string,
): {
  text?: string;
  value?: number;
  currency?: string;
} {
  if (typeof match.price === "string") {
    const text = match.price.trim() || undefined;
    return {
      text,
      value:
        typeof match.extracted_price === "number"
          ? match.extracted_price
          : undefined,
      currency: inferCurrency(text, country),
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
      inferCurrency(
        typeof match.price.currency === "string"
          ? match.price.currency
          : undefined,
        country,
      ) ?? inferCurrency(text, country);
    return { text: text || undefined, value, currency };
  }

  return {
    value:
      typeof match.extracted_price === "number"
        ? match.extracted_price
        : undefined,
  };
}

function compareOffers(
  a: Offer,
  b: Offer,
  country: string,
  marketCurrency: string,
): number {
  const aLocal = isLocalMarketUrl(a.url, country) ? 1 : 0;
  const bLocal = isLocalMarketUrl(b.url, country) ? 1 : 0;
  if (aLocal !== bLocal) return bLocal - aLocal;

  const aMarket = a.currency === marketCurrency ? 1 : 0;
  const bMarket = b.currency === marketCurrency ? 1 : 0;
  if (aMarket !== bMarket) return bMarket - aMarket;

  const aScore = (a.priceValue != null ? 2 : 0) + (a.inStock ? 1 : 0);
  const bScore = (b.priceValue != null ? 2 : 0) + (b.inStock ? 1 : 0);
  if (aScore !== bScore) return bScore - aScore;
  if (
    a.priceValue != null &&
    b.priceValue != null &&
    a.currency === b.currency
  ) {
    return a.priceValue - b.priceValue;
  }
  return 0;
}
