import React, { useEffect, useState } from "react";
import HomeScreen from "./src/screens/HomeScreen";
import NavBar from "./src/components/NavBar";
import { View, StyleSheet, Dimensions } from "react-native";
import SettingsScreen from "./src/screens/SettingsScreen";
import StatsScreen from "./src/screens/StatsScreen";
import BackgroundScreen from "./src/screens/BackgroundScreen";
import { SkiaProvider } from "./SkiaProvider";
import useLocation from "./src/hooks/useLocation";
import useColorStore from "./src/hooks/useColors";
import { initDB } from "./src/db/logic";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";

export default function App() {
  const [navState, setNavState] = useState<"Home" | "Statistics" | "Settings">('Home');


  useEffect(() => {
    const setup = async () => {
      await initDB();
      await useLocation.getState().initialize();
      if (useLocation.getState().location) await useColorStore.getState().initialize();
    };
    setup();
  }, []);

  const page = {
    "Home": <HomeScreen />,
    "Statistics": <StatsScreen />,
    "Settings": <SettingsScreen />
  }

  return (
    <>
      <SkiaProvider>
        <GestureHandlerRootView>
          <StatusBar style='light' translucent />
          <BackgroundScreen />
          <View style={styles.margins}>
            {page[navState]}
            <NavBar navState={navState} setNavState={setNavState} />
          </View>
        </GestureHandlerRootView>
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