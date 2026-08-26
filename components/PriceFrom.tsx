import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { useTheme } from "./ThemeProvider";
import { type, type ThemeColors } from "./theme";
import type { Offer, ProductMatch } from "../types/realitylens";
import {
  currencyForCountry,
  deviceCountry,
  formatMoney,
  isLocalMarketUrl,
  normalizeCurrencyCode,
} from "../lib/region";

type Props = {
  match?: ProductMatch | null;
  offers?: Offer[];
};

type Priced = {
  priceText?: string;
  priceValue?: number;
  currency?: string;
  url?: string;
};

export function matchPriceText(
  match?: ProductMatch | null,
  offers: Offer[] = [],
): string | null {
  const country = deviceCountry();
  const market = currencyForCountry(country);
  const priced = offers.filter((offer) => hasPrice(offer));
  const inMarketOffers = priced.filter((offer) =>
    isInMarketItem(offer, country, market),
  );

  const linkedInMarket = findRelatedOffer(match, inMarketOffers);
  if (linkedInMarket) return displayPrice(linkedInMarket, country, false);

  if (match && hasPrice(match) && isInMarketItem(match, country, market)) {
    return displayPrice(match, country, false);
  }

  if (match && hasPrice(match)) {
    return displayPrice(match, country, true);
  }

  const linked = findRelatedOffer(match, priced);
  if (linked) {
    const foreign = !isInMarketItem(linked, country, market);
    return displayPrice(linked, country, foreign);
  }

  if (priced.length === 0) return null;
  const pool = inMarketOffers.length > 0 ? inMarketOffers : priced;
  const lowest = pool.reduce((a, b) =>
    (a.priceValue ?? Infinity) <= (b.priceValue ?? Infinity) ? a : b,
  );
  return displayPrice(lowest, country, true);
}

function hasPrice(item: Priced): boolean {
  return Boolean(
    item.priceText ||
      (typeof item.priceValue === "number" && !Number.isNaN(item.priceValue)),
  );
}

function isInMarketItem(
  item: Priced,
  country: string,
  market: string,
): boolean {
  if (item.url) return isLocalMarketUrl(item.url, country);
  return normalizeCurrencyCode(item.currency) === market;
}

function displayPrice(
  item: Priced,
  country: string,
  fromPrefix: boolean,
): string | null {
  if (item.priceText) {
    return fromPrefix && !item.priceText.startsWith("From ")
      ? `From ${item.priceText}`
      : item.priceText;
  }
  if (typeof item.priceValue === "number") {
    const currency = normalizeCurrencyCode(item.currency);
    if (!currency) return null;
    const formatted = formatMoney(item.priceValue, currency, country);
    return fromPrefix ? `From ${formatted}` : formatted;
  }
  return null;
}

function findRelatedOffer(
  match?: ProductMatch | null,
  offers: Offer[] = [],
): Offer | undefined {
  if (!match) return undefined;
  const priced = offers.filter((offer) => hasPrice(offer));
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

function sameListing(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return listingKey(a) === listingKey(b);
}

function listingKey(raw: string): string {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return `${host}${path}`;
  } catch {
    return raw;
  }
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

export function PriceFrom({ match, offers = [] }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const price = matchPriceText(match, offers);
  if (!price) return null;
  return <Text style={styles.price}>{price}</Text>;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    price: {
      ...type.price,
      color: colors.text,
    },
  });
}
