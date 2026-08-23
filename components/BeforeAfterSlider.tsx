import { useEffect, useRef, useState } from "react";
import {
  Image,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
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
import { colors, radii, spacing, type } from "./theme";

type Props = {
  beforeUri: string;
  afterUri: string;
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

export function BeforeAfterSlider({ beforeUri, afterUri }: Props) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [beforeAspect, setBeforeAspect] = useState(0);
  const widthSv = useSharedValue(0);
  const position = useSharedValue(0.5);
  const startPos = useSharedValue(0.5);
  const swept = useRef(false);

  useEffect(() => {
    if (beforeUri) void Image.prefetch(beforeUri);
    if (afterUri) void Image.prefetch(afterUri);
  }, [beforeUri, afterUri]);

  // Size the frame from the user's photo so the full body (incl. head) is preserved.
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
    const { width } = e.nativeEvent.layout;
    setContainerWidth(width);
  }

  const width = containerWidth;
  const height = beforeAspect > 0 ? width / beforeAspect : 0;

  useEffect(() => {
    if (width <= 0) return;
    widthSv.value = width;
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
  }, [width, height, position, widthSv]);

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

  const { width: frameWidth, height: frameHeight } = { width, height };

  return (
    <View style={styles.outer} onLayout={onLayout}>
      {frameWidth > 0 && frameHeight > 0 ? (
        <View style={[styles.frame, { width: frameWidth, height: frameHeight }]}>
          <Image
            source={{ uri: afterUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
          />
          <Animated.View style={[styles.beforeClip, clipStyle, { height: frameHeight }]}>
            <View style={{ width: frameWidth, height: frameHeight }}>
              <Image
                source={{ uri: beforeUri }}
                style={StyleSheet.absoluteFill}
                resizeMode="contain"
              />
            </View>
          </Animated.View>
          <GestureDetector gesture={pan}>
            <Animated.View style={[styles.handle, handleStyle, { height: frameHeight }]}>
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

const styles = StyleSheet.create({
  outer: {
    width: "100%",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
  },
  frame: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.canvas,
    borderRadius: radii.md,
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
    color: colors.text,
  },
});
