import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { useTheme } from "./ThemeProvider";
import { type, type ThemeColors } from "./theme";
import type { Offer } from "../types/realitylens";

type Props = {
  offers: Offer[];
};

export function lowestPriceText(offers: Offer[]): string | null {
  if (!offers.length) return null;

  const priced = offers.filter(
    (o) => typeof o.priceValue === "number" && !Number.isNaN(o.priceValue),
  );
  if (priced.length > 0) {
    const lowest = priced.reduce((a, b) =>
      (a.priceValue ?? Infinity) <= (b.priceValue ?? Infinity) ? a : b,
    );
    if (lowest.priceText) return lowest.priceText;
    const currency = lowest.currency ?? "$";
    return `${currency}${lowest.priceValue}`;
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
