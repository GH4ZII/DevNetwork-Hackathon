import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { lightImpact } from "../lib/haptics";
import { useTheme } from "./ThemeProvider";
import { radii, spacing, type, type ThemeColors } from "./theme";

type Props = {
  beforeUri: string;
  afterUri: string;
  /** Fit the comparison inside the parent bounds instead of growing with aspect ratio. */
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
};

function loadAspect(uri: string): Promise<number> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (w, h) => (w > 0 && h > 0 ? resolve(w / h) : reject()),
      reject,
    );
  });
}

function fitContain(
  aspect: number,
  maxW: number,
  maxH: number,
): { width: number; height: number } {
  if (maxW <= 0 || maxH <= 0 || aspect <= 0) {
    return { width: 0, height: 0 };
  }
  let width = maxW;
  let height = width / aspect;
  if (height > maxH) {
    height = maxH;
    width = height * aspect;
  }
  return { width, height };
}

export function BeforeAfterSlider({
  beforeUri,
  afterUri,
  fill = false,
  style,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [beforeAspect, setBeforeAspect] = useState(0);
  const widthSv = useSharedValue(0);
  const position = useSharedValue(0.5);
  const startPos = useSharedValue(0.5);
  const swept = useRef(false);

  useEffect(() => {
    if (beforeUri) void Image.prefetch(beforeUri);
    if (afterUri) void Image.prefetch(afterUri);
  }, [beforeUri, afterUri]);

  useEffect(() => {
    let cancelled = false;
    setBeforeAspect(0);
    swept.current = false;

    loadAspect(beforeUri)
      .then((aspect) => {
        if (!cancelled) setBeforeAspect(aspect);
      })
      .catch(() => {
        loadAspect(afterUri)
          .then((aspect) => {
            if (!cancelled) setBeforeAspect(aspect);
          })
          .catch(() => {
            if (!cancelled) setBeforeAspect(9 / 16);
          });
      });

    return () => {
      cancelled = true;
    };
  }, [beforeUri, afterUri]);

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setBounds({ width, height });
  }

  const frame =
    beforeAspect > 0
      ? fill
        ? fitContain(beforeAspect, bounds.width, bounds.height)
        : {
            width: bounds.width,
            height: bounds.width > 0 ? bounds.width / beforeAspect : 0,
          }
      : { width: 0, height: 0 };

  useEffect(() => {
    if (frame.width <= 0) return;
    widthSv.value = frame.width;
    if (!swept.current) {
      swept.current = true;
      position.value = 0.2;
      position.value = withSequence(
        withTiming(0.8, { duration: 420, easing: Easing.inOut(Easing.cubic) }),
        withDelay(
          80,
          withTiming(0.5, { duration: 400, easing: Easing.inOut(Easing.cubic) }),
        ),
      );
    }
  }, [frame.width, frame.height, position, widthSv]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      startPos.value = position.value;
      runOnJS(lightImpact)();
    })
    .onUpdate((e) => {
      "worklet";
      if (widthSv.value <= 0) return;
      const next = startPos.value + e.translationX / widthSv.value;
      position.value = Math.min(0.92, Math.max(0.08, next));
    })
    .onEnd(() => {
      "worklet";
      position.value = withSpring(position.value, {
        damping: 20,
        stiffness: 200,
      });
    });

  const clipStyle = useAnimatedStyle(() => ({
    width: widthSv.value * position.value,
  }));

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: widthSv.value * position.value - 18 }],
  }));

  return (
    <View
      style={[styles.outer, fill && styles.outerFill, style]}
      onLayout={onLayout}
    >
      {frame.width > 0 && frame.height > 0 ? (
        <View
          style={[
            styles.frame,
            fill && styles.frameFill,
            { width: frame.width, height: frame.height },
          ]}
        >
          <Image
            source={{ uri: afterUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
          />
          <Animated.View
            style={[styles.beforeClip, clipStyle, { height: frame.height }]}
          >
            <View style={{ width: frame.width, height: frame.height }}>
              <Image
                source={{ uri: beforeUri }}
                style={StyleSheet.absoluteFill}
                resizeMode="contain"
              />
            </View>
          </Animated.View>
          <GestureDetector gesture={pan}>
            <Animated.View
              style={[styles.handle, handleStyle, { height: frame.height }]}
            >
              <View style={styles.line} />
              <View style={styles.knob}>
                <Text style={styles.knobText}>‹ ›</Text>
              </View>
            </Animated.View>
          </GestureDetector>
          <View style={styles.beforeTag} pointerEvents="none">
            <Text style={styles.tagText}>Before</Text>
          </View>
          <View style={styles.afterTag} pointerEvents="none">
            <Text style={styles.tagText}>After</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    outer: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
    },
    outerFill: {
      flex: 1,
      borderRadius: 0,
      backgroundColor: colors.canvas,
    },
    frame: {
      position: "relative",
      overflow: "hidden",
      backgroundColor: colors.canvas,
      borderRadius: radii.md,
    },
    frameFill: {
      borderRadius: 0,
    },
    beforeClip: {
      position: "absolute",
      top: 0,
      left: 0,
      overflow: "hidden",
    },
    handle: {
      position: "absolute",
      top: 0,
      left: 0,
      width: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    line: {
      position: "absolute",
      width: 2,
      height: "100%",
      backgroundColor: colors.text,
    },
    knob: {
      width: 36,
      height: 36,
      borderRadius: radii.full,
      backgroundColor: colors.text,
      alignItems: "center",
      justifyContent: "center",
    },
    knobText: {
      color: colors.primaryText,
      fontWeight: "700",
      fontSize: 12,
    },
    beforeTag: {
      position: "absolute",
      top: spacing.md,
      left: spacing.md,
      backgroundColor: colors.overlay,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radii.sm,
    },
    afterTag: {
      position: "absolute",
      top: spacing.md,
      right: spacing.md,
      backgroundColor: colors.overlay,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radii.sm,
    },
    tagText: {
      ...type.label,
      color: "#FFFFFF",
    },
  });
}
