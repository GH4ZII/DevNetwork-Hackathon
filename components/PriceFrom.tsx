import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { useTheme } from "./ThemeProvider";
import { type, type ThemeColors } from "./theme";
import type { Offer, ProductMatch } from "../types/realitylens";
import {
  currencyForCountry,
  deviceCountry,
  formatMoney,
  normalizeCurrencyCode,
} from "../lib/region";

type Props = {
  match?: ProductMatch | null;
  offers?: Offer[];
};

export function matchPriceText(
  match?: ProductMatch | null,
  offers: Offer[] = [],
): string | null {
  if (match?.priceText) return match.priceText;

  const country = deviceCountry();
  if (match && typeof match.priceValue === "number") {
    const currency =
      normalizeCurrencyCode(match.currency, country) ??
      currencyForCountry(country);
    return formatMoney(match.priceValue, currency, country);
  }

  const linked = findRelatedOffer(match, offers);
  if (linked?.priceText) return linked.priceText;
  if (linked && typeof linked.priceValue === "number") {
    const currency =
      normalizeCurrencyCode(linked.currency, country) ??
      currencyForCountry(country);
    return formatMoney(linked.priceValue, currency, country);
  }

  const priced = offers.filter(
    (offer) =>
      offer.priceText ||
      (typeof offer.priceValue === "number" && !Number.isNaN(offer.priceValue)),
  );
  if (priced.length === 0) return null;

  const market = currencyForCountry(country);
  const inMarket = priced.filter(
    (offer) => normalizeCurrencyCode(offer.currency, country) === market,
  );
  const pool = inMarket.length > 0 ? inMarket : priced;
  const lowest = pool.reduce((a, b) =>
    (a.priceValue ?? Infinity) <= (b.priceValue ?? Infinity) ? a : b,
  );
  if (lowest.priceText) {
    return lowest.priceText.startsWith("From ")
      ? lowest.priceText
      : `From ${lowest.priceText}`;
  }
  if (typeof lowest.priceValue === "number") {
    const currency =
      normalizeCurrencyCode(lowest.currency, country) ?? market;
    return `From ${formatMoney(lowest.priceValue, currency, country)}`;
  }
  return null;
}

function findRelatedOffer(
  match?: ProductMatch | null,
  offers: Offer[] = [],
): Offer | undefined {
  if (!match) return undefined;
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
