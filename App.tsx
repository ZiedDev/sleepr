import React, { useState } from "react";
import HomeScreen from "./src/screens/HomeScreen";
import NavBar from "./src/components/NavBar";
import { View, StyleSheet, Dimensions } from "react-native";
import SettingsScreen from "./src/screens/SettingsScreen";
import StatsScreen from "./src/screens/StatsScreen";
import BackgroundScreen from "./src/screens/BackgroundScreen";

export default function App() {
  const [navState, setNavState] = useState<"Home" | "Statistics" | "Settings">('Home');

  const page = {
    "Home": <HomeScreen />,
    "Statistics": <StatsScreen />,
    "Settings": <SettingsScreen />
  }

  return (
    <>
      <BackgroundScreen/>
      <View style={styles.margins}>
        {page[navState]}
        <NavBar navState={navState} setNavState={setNavState} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  margins: {
    height: Dimensions.get("window").height - 99,
    marginTop: 65,
    marginBottom: 34,
    position: "relative",
  },
});