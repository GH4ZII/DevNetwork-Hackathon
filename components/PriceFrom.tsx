import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { useTheme } from "./ThemeProvider";
import { type, type ThemeColors } from "./theme";
import type { Offer, ProductMatch } from "../types/realitylens";
import {
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
  if (match && typeof match.priceValue === "number") {
    const country = deviceCountry();
    const currency = normalizeCurrencyCode(match.currency, country);
    if (currency) return formatMoney(match.priceValue, currency, country);
  }

  const linked = match?.url
    ? offers.find((offer) => sameListing(offer.url, match.url))
    : undefined;
  if (linked?.priceText) return linked.priceText;
  if (linked && typeof linked.priceValue === "number") {
    const country = deviceCountry();
    const currency = normalizeCurrencyCode(linked.currency, country);
    if (currency) return formatMoney(linked.priceValue, currency, country);
  }

  return null;
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
