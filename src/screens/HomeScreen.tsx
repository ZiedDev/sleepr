import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import useLocation from '../hooks/useLocation';
import { SleepLogic } from '../db/logic';
import { useStorage } from '../db/storage';
import useColorStore from '../hooks/useColors';
import MorphSlider from '../components/MorphSlider';
import { Easing, SharedValue, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { scheduleOnRN } from 'react-native-worklets';

export default function HomeScreen({ progress }: { progress: SharedValue<number> }) {
  useEffect(() => {
    useColorStore.getState().setBlur(0);
  }, []);

  const currentSession = useStorage((state) => state.currentSession);
  const isTracking = !!currentSession;

  const blur = useColorStore(state => state.blur);
  const [statusbarHide, setStatusbarHide] = useState(isTracking);

  useDerivedValue(() => {
    const t = progress.value;
    const b = 3 * Math.floor(30 * Easing.in(Easing.cubic)(t) / 3);
    if (b != blur.value) blur.value = b;

    if (t > 0.75 && !statusbarHide) {
      scheduleOnRN(setStatusbarHide, true);
    } else if ((t <= 0.75 && statusbarHide)) {
      scheduleOnRN(setStatusbarHide, false);
    }
  })

  return (
    <View style={styles.container}>
      <StatusBar
        hidden={statusbarHide}
        style='light'
        hideTransitionAnimation='slide'
        animated={true}
        translucent
      />
      <MorphSlider
        isInitialComplete={isTracking}
        progress={progress}
        trackWidth={0.6944444444 * Dimensions.get('screen').width}

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
    justifyContent: 'flex-end',
    paddingBottom: 280,
  },
});