import { Platform } from "react-native";

export type ThemeMode = "dark" | "light";

export type ThemeColors = {
  canvas: string;
  surface: string;
  surfaceRaised: string;
  glass: string;
  glassBorder: string;
  text: string;
  textMuted: string;
  textDim: string;
  primary: string;
  primaryText: string;
  accent: string;
  accentMuted: string;
  gradientTop: string;
  error: string;
  success: string;
  overlay: string;
  shutter: string;
  shutterRing: string;
};

export const darkColors: ThemeColors = {
  canvas: "#141418",
  surface: "#1C1C22",
  surfaceRaised: "#26262E",
  glass: "rgba(255,255,255,0.08)",
  glassBorder: "rgba(255,255,255,0.14)",
  text: "#FFFFFF",
  textMuted: "#B0B0B8",
  textDim: "#7A7A85",
  primary: "#FFFFFF",
  primaryText: "#141418",
  accent: "#7C7FF2",
  accentMuted: "rgba(124,127,242,0.22)",
  gradientTop: "rgba(99,102,241,0.12)",
  error: "#FF8A8A",
  success: "#8AFFB0",
  overlay: "rgba(0,0,0,0.45)",
  shutter: "#FFFFFF",
  shutterRing: "rgba(255,255,255,0.35)",
};

export const lightColors: ThemeColors = {
  canvas: "#E6E7EC",
  surface: "#F0F1F5",
  surfaceRaised: "#FAFBFD",
  glass: "rgba(0,0,0,0.05)",
  glassBorder: "rgba(0,0,0,0.10)",
  text: "#14151A",
  textMuted: "#5C5F6A",
  textDim: "#8B8E99",
  primary: "#14151A",
  primaryText: "#F2F3F7",
  accent: "#4F46E5",
  accentMuted: "rgba(79,70,229,0.15)",
  gradientTop: "rgba(0,0,0,0.03)",
  error: "#D64545",
  success: "#2F9E6A",
  overlay: "rgba(0,0,0,0.45)",
  shutter: "#FFFFFF",
  shutterRing: "rgba(255,255,255,0.35)",
};

/** @deprecated Prefer useTheme().colors — kept as dark default for non-React callers */
export const colors = darkColors;

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
