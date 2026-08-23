import { useState } from "react";
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { colors, radii, spacing, type } from "./theme";

type Props = {
  beforeUri: string;
  afterUri: string;
};

export function BeforeAfterSlider({ beforeUri, afterUri }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const widthSv = useSharedValue(0);
  const position = useSharedValue(0.5);
  const startPos = useSharedValue(0.5);

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
    widthSv.value = width;
  }

  const pan = Gesture.Pan()
    .onBegin(() => {
      startPos.value = position.value;
    })
    .onUpdate((e) => {
      "worklet";
      if (widthSv.value <= 0) return;
      const next = startPos.value + e.translationX / widthSv.value;
      position.value = Math.min(0.92, Math.max(0.08, next));
    })
    .onEnd(() => {
      "worklet";
      position.value = withSpring(position.value, { damping: 20, stiffness: 200 });
    });

  const clipStyle = useAnimatedStyle(() => ({
    width: widthSv.value * position.value,
  }));

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: widthSv.value * position.value - 18 }],
  }));

  const { width, height } = size;

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      {width > 0 && height > 0 ? (
        <>
          <Image
            source={{ uri: afterUri }}
            style={[styles.image, { width, height }]}
            resizeMode="cover"
          />
          <Animated.View style={[styles.beforeClip, clipStyle, { height }]}>
            <Image
              source={{ uri: beforeUri }}
              style={{ width, height }}
              resizeMode="cover"
            />
          </Animated.View>
          <GestureDetector gesture={pan}>
            <Animated.View style={[styles.handle, handleStyle, { height }]}>
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
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.surface,
    overflow: "hidden",
    borderRadius: radii.lg,
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
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
