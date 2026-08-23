import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightImpact } from "../lib/haptics";
import { colors, radii, shadows, spacing, tabBarHeight, type } from "./theme";

type TabConfig = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  isCamera?: boolean;
};

const TABS: TabConfig[] = [
  { name: "home", label: "Home", icon: "home-outline", iconActive: "home" },
  { name: "saved", label: "Saved", icon: "bookmark-outline", iconActive: "bookmark" },
  {
    name: "camera",
    label: "Scan",
    icon: "camera",
    iconActive: "camera",
    isCamera: true,
  },
  { name: "history", label: "History", icon: "time-outline", iconActive: "time" },
  { name: "profile", label: "Profile", icon: "person-outline", iconActive: "person" },
];

function TabItem({
  tab,
  focused,
  onPress,
}: {
  tab: TabConfig;
  focused: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (tab.isCamera) {
    return (
      <Pressable
        onPress={() => {
          lightImpact();
          onPress();
        }}
        style={styles.cameraWrap}
        accessibilityRole="button"
        accessibilityLabel={tab.label}
      >
        <Animated.View style={[styles.cameraBtn, animatedStyle]}>
          <Ionicons name="camera" size={26} color={colors.primaryText} />
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => {
        lightImpact();
        scale.value = withSpring(0.9, { damping: 12 }, () => {
          scale.value = withSpring(1);
        });
        onPress();
      }}
      style={styles.tab}
      accessibilityRole="button"
      accessibilityLabel={tab.label}
    >
      <Animated.View style={[styles.tabInner, animatedStyle]}>
        <Ionicons
          name={focused ? tab.iconActive : tab.icon}
          size={22}
          color={focused ? colors.text : colors.textDim}
        />
        <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
          {tab.label}
        </Text>
        {focused ? <View style={styles.dot} /> : <View style={styles.dotPlaceholder} />}
      </Animated.View>
    </Pressable>
  );
}

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const currentRoute = state.routes[state.index]?.name;

  if (currentRoute === "camera") {
    return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + spacing.sm }]}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
          const focused = state.index === routeIndex;

          return (
            <TabItem
              key={tab.name}
              tab={tab}
              focused={focused}
              onPress={() => {
                const route = state.routes[routeIndex];
                if (route) {
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: 0,
  },
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radii.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
    minHeight: tabBarHeight,
    ...shadows.tabBar,
  },
  tab: {
    flex: 1,
    alignItems: "center",
  },
  tabInner: {
    alignItems: "center",
    gap: 2,
    paddingVertical: spacing.xs,
  },
  tabLabel: {
    ...type.label,
    fontSize: 10,
    color: colors.textDim,
    textTransform: "none",
    letterSpacing: 0,
  },
  tabLabelActive: {
    color: colors.text,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
    marginTop: 2,
  },
  dotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 2,
  },
  cameraWrap: {
    flex: 1,
    alignItems: "center",
    marginTop: -spacing.xxl,
  },
  cameraBtn: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.cameraButton,
  },
});
