import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import useLocation from '../hooks/useLocation';
import { SleepLogic } from '../db/logic';
import { useStorage } from '../db/storage';
import useColorStore from '../hooks/useColors';
import MorphSlider from '../components/MorphSlider';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';

export default function HomeScreen() {
  useEffect(() => {
    useColorStore.getState().setBlur(0);
  }, []);

  const currentSession = useStorage((state) => state.currentSession);
  const isTracking = !!currentSession;

  const progress = useSharedValue(Number(isTracking));
  const blur = useColorStore(state => state.blur);

  useDerivedValue(()=>{
    // TODO: interpolate here + animate navbar
    blur.value=progress.value;
  })

  return (
    <View style={styles.container}>
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

        progress={progress}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 230,
  },
});