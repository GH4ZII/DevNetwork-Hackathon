import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { useTheme } from "./ThemeProvider";
import { type, type ThemeColors } from "./theme";
import type { Offer } from "../types/realitylens";
import {
  currencyForCountry,
  deviceCountry,
  formatMoney,
  normalizeCurrencyCode,
} from "../lib/region";

type Props = {
  offers: Offer[];
};

export function lowestPriceText(offers: Offer[]): string | null {
  if (!offers.length) return null;

  const country = deviceCountry();
  const market = currencyForCountry(country);
  const priced = offers
    .map((offer) => ({
      offer,
      currency: normalizeCurrencyCode(offer.currency, country),
    }))
    .filter(
      (row) =>
        typeof row.offer.priceValue === "number" &&
        !Number.isNaN(row.offer.priceValue),
    );

  const inMarket = priced.filter((row) => row.currency === market);
  const pool = inMarket.length > 0 ? inMarket : priced;

  if (pool.length > 0) {
    const lowest = pool.reduce((a, b) =>
      (a.offer.priceValue ?? Infinity) <= (b.offer.priceValue ?? Infinity)
        ? a
        : b,
    );
    if (lowest.currency && typeof lowest.offer.priceValue === "number") {
      return formatMoney(lowest.offer.priceValue, lowest.currency, country);
    }
    if (lowest.offer.priceText) return lowest.offer.priceText;
  }

  const withText = offers.find((o) => o.priceText);
  return withText?.priceText ?? null;
}

export function PriceFrom({ offers }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const price = lowestPriceText(offers);
  if (!price) return null;
  return <Text style={styles.price}>From {price}</Text>;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    price: {
      ...type.price,
      color: colors.text,
    },
  });
}
