import { Platform } from "react-native";

export const colors = {
  canvas: "#0A0A0A",
  surface: "#161616",
  surfaceRaised: "#1E1E1E",
  glass: "rgba(255,255,255,0.06)",
  glassBorder: "rgba(255,255,255,0.12)",
  text: "#FFFFFF",
  textMuted: "#A8A8A8",
  textDim: "#6E6E6E",
  primary: "#FFFFFF",
  primaryText: "#0A0A0A",
  accent: "#6366F1",
  accentMuted: "rgba(99,102,241,0.2)",
  gradientTop: "rgba(255,255,255,0.03)",
  error: "#FF8A8A",
  success: "#8AFFB0",
  overlay: "rgba(0,0,0,0.45)",
  shutter: "#FFFFFF",
  shutterRing: "rgba(255,255,255,0.35)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const tabBarHeight = 64;

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
    default: {},
  }),
  tabBar: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    default: {},
  }),
  cameraButton: Platform.select({
    ios: {
      shadowColor: "#6366F1",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
    default: {},
  }),
};

export const fontFamily = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

export const type = {
  hero: {
    fontSize: 32,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
    fontFamily: fontFamily.bold,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
    fontFamily: fontFamily.bold,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500" as const,
    fontFamily: fontFamily.medium,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    fontFamily: fontFamily.regular,
  },
  caption: {
    fontSize: 13,
    fontWeight: "500" as const,
    fontFamily: fontFamily.medium,
  },
  label: {
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 0.4,
    fontFamily: fontFamily.semibold,
  },
  price: {
    fontSize: 22,
    fontWeight: "700" as const,
    fontFamily: fontFamily.bold,
  },
};

export function formatMatchLabel(
  label?: "exact_match" | "best_match" | "similar" | string | null,
): string {
  switch (label) {
    case "exact_match":
      return "Exact Match";
    case "best_match":
      return "Best Match";
    case "similar":
      return "Similar";
    default:
      return "Match";
  }
}

export function formatCategory(category?: string | null): string {
  if (!category) return "";
  return category.charAt(0).toUpperCase() + category.slice(1);
}
