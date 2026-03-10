import React, { useEffect, useState } from "react";
import HomeScreen from "./src/screens/HomeScreen";
import NavBar from "./src/components/NavBar";
import { View, StyleSheet, Platform } from "react-native";
import SettingsScreen from "./src/screens/SettingsScreen";
import StatsScreen from "./src/screens/StatsScreen";
import BackgroundScreen from "./src/screens/BackgroundScreen";
import { SkiaProvider } from "./SkiaProvider";
import useLocation from "./src/hooks/useLocation";
import useColorStore from "./src/hooks/useColors";
import { initDB } from "./src/db/logic";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStorage } from "./src/db/storage";
import { useSharedValue } from "react-native-reanimated";
import { useFonts } from 'expo-font';

export default function App() {
  useEffect(() => {
    const setup = async () => {
      await initDB();
      await useLocation.getState().initialize();
      if (useLocation.getState().location) await useColorStore.getState().initialize();
    };
    setup();
  }, []);

  const [loaded] = useFonts({
    'Lora': require('./assets/fonts/Lora/Lora-VariableFont_wght.ttf'),
  });

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <SkiaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style='light' translucent />
          <BackgroundScreen />
          <AppContent />
        </GestureHandlerRootView>
      </SkiaProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [navState, setNavState] = useState<"Home" | "Statistics" | "Settings">('Home');

  const currentSession = useStorage((state) => state.currentSession);
  const fadeOutNav = useSharedValue(currentSession ? 1 : 0);

  const page = {
    "Home": <HomeScreen fadeOutNav={fadeOutNav} />,
    "Statistics": <StatsScreen />,
    "Settings": <SettingsScreen />
  }

  const insets = useSafeAreaInsets();
  const marginTop = insets.top || (Platform.OS === 'android' ? 24 : 65);
  const marginBottom = insets.bottom || (Platform.OS === 'android' ? 24 : 34);

  return (
    <>
      <View style={{ flex: 1, marginTop, marginBottom }}>
        {page[navState]}
        <NavBar navState={navState} setNavState={setNavState} fadeOut={fadeOutNav} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({

});