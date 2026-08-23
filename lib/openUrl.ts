import { Linking } from "react-native";

export async function openExternalUrl(url?: string | null) {
  if (!url) return;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return;
    }
  } catch {
    // fall through
  }
  try {
    await Linking.openURL(url);
  } catch {
    // Simulator / restricted environments may reject some https links.
  }
}
