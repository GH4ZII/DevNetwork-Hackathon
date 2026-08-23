// @ts-nocheck
import { Tabs } from "expo-router";
import { TabBar } from "../../components/TabBar";
import { colors } from "../../components/theme";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.canvas, flex: 1 },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="saved" options={{ title: "Saved" }} />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Scan",
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
