// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Asset } from "expo-asset";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassButton } from "../components/GlassButton";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors, radii, spacing, type } from "../components/theme";
import { mediumImpact } from "../lib/haptics";
import { session } from "../lib/session";

const demoShoe = require("../assets/demo/shoes.jpg");

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [imageUri, setImageUri] = useState(null);
  const [error, setError] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const shutterScale = useSharedValue(1);

  useEffect(() => {
    void Asset.loadAsync([demoShoe]);
  }, []);

  const shutterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  async function takePhoto() {
    setError(null);
    if (!cameraRef.current || capturing) return;
    try {
      mediumImpact();
      setCapturing(true);
      setFlashOn(true);
      shutterScale.value = withSequence(
        withTiming(0.88, { duration: 90 }),
        withTiming(1, { duration: 160 }),
      );
      setTimeout(() => setFlashOn(false), 120);
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

  async function useDemoPhoto() {
    setError(null);
    try {
      const [asset] = await Asset.loadAsync(demoShoe);
      const uri = asset.localUri ?? asset.uri;
      if (!uri) {
        setError("Demo photo is missing. Try the camera instead.");
        return;
      }
      session.pendingScanUri = uri;
      router.push("/searching");
    } catch {
      setError("Could not load the demo photo.");
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
        <GlassButton label="Use demo photo" onPress={useDemoPhoto} />
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
      <View style={[styles.vignetteTop, { height: insets.top + 120 }]} pointerEvents="none" />
      <View style={[styles.vignetteBottom, { height: insets.bottom + 180 }]} pointerEvents="none" />
      <View style={styles.viewfinder} pointerEvents="none">
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </View>
      {flashOn ? <View style={styles.flash} pointerEvents="none" /> : null}
      <View style={[styles.topCopy, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.kicker}>RealityLens</Text>
        <Text style={styles.hero}>What did you find?</Text>
        <Text style={styles.copy}>Scan a product to find it online.</Text>
      </View>
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.xl }]}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {capturing ? <Text style={styles.holdSteady}>Hold steady</Text> : null}
        <GlassButton label="Use demo photo" onPress={useDemoPhoto} compact />
        <View style={styles.controls}>
          <Pressable style={styles.galleryBtn} onPress={pickFromGallery}>
            <Text style={styles.galleryLabel}>Gallery</Text>
          </Pressable>
          <Pressable
            onPress={takePhoto}
            disabled={capturing}
            style={styles.shutterHit}
          >
            <Animated.View
              style={[
                styles.shutter,
                capturing && styles.shutterDisabled,
                shutterStyle,
              ]}
            >
              <View style={styles.shutterInner} />
            </Animated.View>
          </Pressable>
          <View style={styles.galleryBtn} />
        </View>
      </View>
    </View>
  );
}

const CORNER = 22;
const CORNER_THICK = 2;

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
  kicker: {
    ...type.label,
    color: colors.text,
    opacity: 0.7,
    textTransform: "uppercase",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
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
  vignetteTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.overlay,
  },
  vignetteBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.overlay,
  },
  viewfinder: {
    ...StyleSheet.absoluteFillObject,
    marginHorizontal: spacing.xxl,
    marginTop: "28%",
    marginBottom: "32%",
  },
  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
    borderColor: colors.text,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICK,
    borderLeftWidth: CORNER_THICK,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICK,
    borderRightWidth: CORNER_THICK,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICK,
    borderLeftWidth: CORNER_THICK,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICK,
    borderRightWidth: CORNER_THICK,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  holdSteady: {
    ...type.caption,
    color: colors.text,
    textAlign: "center",
    opacity: 0.9,
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
  shutterHit: {
    alignItems: "center",
    justifyContent: "center",
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
