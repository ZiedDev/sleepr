import React, { useState } from "react";
import HomeScreen from "./src/screens/HomeScreen";
import NavBar from "./src/components/NavBar";
import { View, StyleSheet, Dimensions } from "react-native";
import SettingsScreen from "./src/screens/SettingsScreen";
import StatsScreen from "./src/screens/StatsScreen";
import BackgroundScreen from "./src/screens/BackgroundScreen";
import { useSharedValue } from "react-native-reanimated";
import { getProgress } from "./src/hooks/useColors";
import { SkiaProvider } from "./SkiaProvider";

export default function App() {
  const [navState, setNavState] = useState<"Home" | "Statistics" | "Settings">('Home');

  const solarProgress = useSharedValue(getProgress());

  const page = {
    "Home": <HomeScreen solarProgress={solarProgress} />,
    "Statistics": <StatsScreen />,
    "Settings": <SettingsScreen />
  }

  return (
    <>
      <SkiaProvider>
        <BackgroundScreen solarProgress={solarProgress} />
        <View style={styles.margins}>
          {page[navState]}
          <NavBar navState={navState} setNavState={setNavState} />
        </View>
      </SkiaProvider>
    </>
  );
}

const styles = StyleSheet.create({
  margins: {
    height: Dimensions.get("window").height - 99,
    width: Dimensions.get("window").width,
    marginTop: 65,
    marginBottom: 34,
    position: "relative",
  },
});