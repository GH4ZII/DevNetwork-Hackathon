// @ts-nocheck
import { useMemo, useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassButton } from "../../components/GlassButton";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useTheme } from "../../components/ThemeProvider";
import { radii, spacing, type, type ThemeColors } from "../../components/theme";
import { lightImpact, mediumImpact } from "../../lib/haptics";
import { clearContinueLook, session } from "../../lib/session";

const CAMERA_TEXT = "#FFFFFF";

export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [imageUri, setImageUri] = useState(null);
  const [error, setError] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [facing, setFacing] = useState("back");
  const shutterScale = useSharedValue(1);

  const shutterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  const addingToLook = Boolean(session.continueCollectionId);

  function goBack() {
    lightImpact();
    setImageUri(null);
    setError(null);
    if (session.continueCollectionId) {
      const lookId = session.continueCollectionId;
      clearContinueLook();
      router.replace(`/look/${lookId}`);
      return;
    }
    router.replace("/(tabs)/home");
  }

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

  function search() {
    if (!imageUri) {
      setError("Take or choose a product photo first.");
      return;
    }
    session.pendingScanUri = imageUri;
    router.push("/searching");
  }

  function flipCamera() {
    if (capturing) return;
    lightImpact();
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  }

  if (!permission) {
    return <View style={styles.screen} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top + spacing.xl }]}>
        <Pressable
          onPress={goBack}
          style={[styles.backBtn, styles.backBtnSolid, { top: insets.top + spacing.md }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.permissionHero}>Camera access needed</Text>
        <Text style={styles.permissionCopy}>
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
        <Pressable
          onPress={goBack}
          style={[styles.backBtn, { top: insets.top + spacing.md }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={CAMERA_TEXT} />
        </Pressable>
        {addingToLook ? (
          <View
            style={[styles.continueBanner, { top: insets.top + spacing.md + 48 }]}
          >
            <Text style={styles.continueBannerText}>
              Adding to this look — scan the next item
            </Text>
          </View>
        ) : null}
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
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />
      <View style={[styles.vignetteTop, { height: insets.top + 80 }]} pointerEvents="none" />
      <View style={[styles.vignetteBottom, { height: insets.bottom + 160 }]} pointerEvents="none" />

      <View style={styles.viewfinderWrap} pointerEvents="none">
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
      </View>

      {flashOn ? <View style={styles.flash} pointerEvents="none" /> : null}

      <Pressable
        onPress={goBack}
        style={[styles.backBtn, { top: insets.top + spacing.md }]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={22} color={CAMERA_TEXT} />
      </Pressable>
      {addingToLook ? (
        <View
          style={[styles.continueBanner, { top: insets.top + spacing.md + 48 }]}
        >
          <Text style={styles.continueBannerText}>
            Adding to this look — scan the next item
          </Text>
        </View>
      ) : null}

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.xl }]}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {capturing ? <Text style={styles.holdSteady}>Hold steady</Text> : null}
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
          <Pressable
            style={styles.galleryBtn}
            onPress={flipCamera}
            disabled={capturing}
            accessibilityRole="button"
            accessibilityLabel="Flip camera"
          >
            <View style={styles.flipBtn}>
              <Ionicons name="camera-reverse-outline" size={22} color={CAMERA_TEXT} />
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const CORNER = 22;
const CORNER_THICK = 2;

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    centered: {
      padding: spacing.xl,
      gap: spacing.lg,
      justifyContent: "center",
    },
    continueBanner: {
      position: "absolute",
      left: spacing.xl,
      right: spacing.xl,
      zIndex: 10,
      backgroundColor: "rgba(0,0,0,0.55)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.25)",
      borderRadius: radii.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    continueBannerText: {
      ...type.caption,
      color: CAMERA_TEXT,
      textAlign: "center",
      fontWeight: "600",
    },
    backBtn: {
      position: "absolute",
      left: spacing.xl,
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: radii.full,
      backgroundColor: "rgba(0,0,0,0.45)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.25)",
      alignItems: "center",
      justifyContent: "center",
    },
    backBtnSolid: {
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.glassBorder,
    },
    permissionHero: {
      ...type.hero,
      color: colors.text,
    },
    permissionCopy: {
      ...type.body,
      color: colors.textMuted,
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
    viewfinderWrap: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: spacing.xxl,
    },
    viewfinder: {
      width: "100%",
      aspectRatio: 3 / 4,
      maxHeight: "55%",
    },
    corner: {
      position: "absolute",
      width: CORNER,
      height: CORNER,
      borderColor: CAMERA_TEXT,
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
      color: CAMERA_TEXT,
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
      color: CAMERA_TEXT,
      backgroundColor: "rgba(0,0,0,0.45)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.25)",
      overflow: "hidden",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.full,
    },
    flipBtn: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      backgroundColor: "rgba(0,0,0,0.45)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.25)",
      alignItems: "center",
      justifyContent: "center",
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
}
