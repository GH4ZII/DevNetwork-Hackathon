// @ts-nocheck
import { useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassButton } from "../components/GlassButton";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors, radii, spacing, type } from "../components/theme";
import { session } from "../lib/session";

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [imageUri, setImageUri] = useState(null);
  const [error, setError] = useState(null);
  const [capturing, setCapturing] = useState(false);

  async function takePhoto() {
    setError(null);
    if (!cameraRef.current) return;
    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });
      if (photo?.uri) setImageUri(photo.uri);
    } catch {
      setError("Could not take a photo. Try again.");
    } finally {
      setCapturing(false);
    }
  }

  async function pickFromGallery() {
    setError(null);
    const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!media.granted) {
      setError("Photo library access is needed to choose an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  }

  function search() {
    if (!imageUri) {
      setError("Take or choose a product photo first.");
      return;
    }
    session.pendingScanUri = imageUri;
    router.push("/searching");
  }

  if (!permission) {
    return <View style={styles.screen} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top + spacing.xl }]}>
        <Text style={styles.hero}>What did you find?</Text>
        <Text style={styles.copy}>
          RealityLens needs camera access to scan products.
        </Text>
        <PrimaryButton label="Allow camera" onPress={requestPermission} />
        <GlassButton label="Choose from gallery" onPress={pickFromGallery} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  if (imageUri) {
    return (
      <View style={styles.screen}>
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={[styles.topCopy, { paddingTop: insets.top + spacing.lg }]}>
          <Text style={styles.hero}>Ready to search?</Text>
          <Text style={styles.copy}>Retake if needed, then search.</Text>
        </View>
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.row}>
            <GlassButton
              label="Retake"
              onPress={() => {
                setImageUri(null);
                setError(null);
              }}
              style={styles.flexBtn}
            />
            <PrimaryButton label="Search" onPress={search} style={styles.flexBtn} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      <View style={[styles.topCopy, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.hero}>What did you find?</Text>
        <Text style={styles.copy}>Scan a product to find it online.</Text>
      </View>
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.xl }]}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.controls}>
          <Pressable style={styles.galleryBtn} onPress={pickFromGallery}>
            <Text style={styles.galleryLabel}>Gallery</Text>
          </Pressable>
          <Pressable
            style={[styles.shutter, capturing && styles.shutterDisabled]}
            onPress={takePhoto}
            disabled={capturing}
          >
            <View style={styles.shutterInner} />
          </Pressable>
          <View style={styles.galleryBtn} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  centered: {
    padding: spacing.xl,
    gap: spacing.lg,
    justifyContent: "center",
  },
  topCopy: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  hero: {
    ...type.hero,
    color: colors.text,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  copy: {
    ...type.body,
    color: colors.text,
    opacity: 0.85,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  galleryBtn: {
    width: 72,
    alignItems: "center",
  },
  galleryLabel: {
    ...type.caption,
    color: colors.text,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: radii.full,
    borderWidth: 4,
    borderColor: colors.shutterRing,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: radii.full,
    backgroundColor: colors.shutter,
  },
  shutterDisabled: { opacity: 0.5 },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  flexBtn: { flex: 1 },
  error: {
    ...type.caption,
    color: colors.error,
    textAlign: "center",
  },
});
