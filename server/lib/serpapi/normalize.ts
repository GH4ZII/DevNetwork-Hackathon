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
  if (bestMatch) attachMatchPrice(bestMatch, offers, country);
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
  const price = parsePrice(match);
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

function attachMatchPrice(
  match: ProductMatch,
  offers: Offer[],
  country: string,
): void {
  const marketCurrency = currencyForCountry(country);
  const priced = offers.filter(
    (offer) => offer.priceText || offer.priceValue != null,
  );
  const inMarketOffers = priced.filter((offer) =>
    isInMarketItem(offer, country, marketCurrency),
  );

  const linkedInMarket = findRelatedOffer(match, inMarketOffers);
  if (linkedInMarket) {
    applyOfferPrice(match, linkedInMarket, country, false);
    if (linkedInMarket.url) match.url = linkedInMarket.url;
    if (linkedInMarket.merchant) match.source = linkedInMarket.merchant;
    return;
  }

  if (hasPrice(match) && isInMarketItem(match, country, marketCurrency)) {
    return;
  }

  if (hasPrice(match)) {
    applyOfferPrice(match, match, country, true);
    return;
  }

  const linked = findRelatedOffer(match, priced);
  if (linked) {
    const foreign = !isInMarketItem(linked, country, marketCurrency);
    applyOfferPrice(match, linked, country, foreign);
    return;
  }

  if (priced.length === 0) return;
  const pool = inMarketOffers.length > 0 ? inMarketOffers : priced;
  const lowest = pool.reduce((a, b) =>
    (a.priceValue ?? Infinity) <= (b.priceValue ?? Infinity) ? a : b,
  );
  applyOfferPrice(match, lowest, country, true);
}

function hasPrice(item: { priceText?: string; priceValue?: number }): boolean {
  return Boolean(item.priceText) || item.priceValue != null;
}

function isInMarketItem(
  item: { url?: string; currency?: string },
  country: string,
  marketCurrency: string,
): boolean {
  if (item.url) return isLocalMarketUrl(item.url, country);
  return Boolean(item.currency && item.currency === marketCurrency);
}

function applyOfferPrice(
  match: ProductMatch,
  source: { priceText?: string; priceValue?: number; currency?: string },
  country: string,
  fromPrefix: boolean,
): void {
  const formatted =
    source.priceText ??
    formatOfferPrice(source.priceValue, source.currency, country);
  if (!formatted) return;
  match.priceText =
    fromPrefix && !formatted.startsWith("From ")
      ? `From ${formatted}`
      : formatted;
  match.priceValue = source.priceValue;
  match.currency = source.currency;
}

function findRelatedOffer(
  match: ProductMatch,
  offers: Offer[],
): Offer | undefined {
  const priced = offers.filter(
    (offer) => offer.priceText || offer.priceValue != null,
  );
  if (priced.length === 0) return undefined;

  const byUrl = priced.find((offer) => sameListing(offer.url, match.url));
  if (byUrl) return byUrl;

  const merchant = normalizeMerchant(match.source);
  if (merchant) {
    const sameStore = priced.filter(
      (offer) => normalizeMerchant(offer.merchant) === merchant,
    );
    const titled = sameStore.find((offer) =>
      titlesOverlap(match.title, offer.title),
    );
    if (titled) return titled;
    if (sameStore[0]) return sameStore[0];
  }

  return priced.find((offer) => titlesOverlap(match.title, offer.title));
}

function normalizeMerchant(value?: string): string | undefined {
  if (!value) return undefined;
  const cleaned = value
    .toLowerCase()
    .replace(/\.(com|no|se|dk|de|co\.uk|net|org)$/i, "")
    .replace(/[^a-z0-9]+/g, "");
  return cleaned || undefined;
}

function titlesOverlap(a: string, b: string): boolean {
  const left = significantTokens(a);
  const right = significantTokens(b);
  if (left.size === 0 || right.size === 0) return false;
  let hits = 0;
  for (const token of left) {
    if (right.has(token)) hits += 1;
  }
  return hits >= 2 || (left.size === 1 && hits === 1);
}

function significantTokens(text: string): Set<string> {
  const stop = new Set([
    "the",
    "and",
    "for",
    "with",
    "from",
    "by",
    "dark",
    "red",
    "blue",
    "black",
    "white",
    "grey",
    "gray",
    "green",
    "size",
    "men",
    "women",
    "mens",
    "womens",
  ]);
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9æøåäöü\s-]/gi, " ")
      .split(/[\s-]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !stop.has(token)),
  );
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

  const price = parsePrice(match);
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

function parsePrice(match: LensVisualMatch): {
  text?: string;
  value?: number;
  currency?: string;
} {
  if (typeof match.price === "string") {
    const text = match.price.trim() || undefined;
    const value =
      typeof match.extracted_price === "number"
        ? match.extracted_price
        : undefined;
    return {
      text,
      value,
      currency: inferCurrency(text),
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
      ) ?? inferCurrency(text);
    return { text: text || undefined, value, currency };
  }

  const value =
    typeof match.extracted_price === "number"
      ? match.extracted_price
      : undefined;
  return { value, currency: undefined };
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
