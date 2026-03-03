import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import useLocation from '../hooks/useLocation';
import { SleepLogic } from '../db/logic';
import { useStorage } from '../db/storage';
import * as Haptics from 'expo-haptics';
import useColorStore from '../hooks/useColors';
import MorphSlider from '../components/MorphSlider';

export default function HomeScreen() {
  useEffect(() => {
    useColorStore.getState().setBlur(0);
  }, []);

  const currentSession = useStorage((state) => state.currentSession);
  const isTracking = !!currentSession;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <MorphSlider
        isInitialComplete={isTracking}
        onComplete={() => {
          const location = useLocation.getState().location;
          const lat = location?.coords.latitude ?? null;
          const lon = location?.coords.longitude ?? null;

          SleepLogic.startTracking({ lat, lon });
          console.log("[HomeScreen] Tracking started.");
        }}
        onReset={() => {
          const location = useLocation.getState().location;
          const lat = location?.coords.latitude ?? null;
          const lon = location?.coords.longitude ?? null;

          SleepLogic.stopTracking({ lat, lon });
          console.log("[HomeScreen] Tracking stopped and saved.");
        }}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});