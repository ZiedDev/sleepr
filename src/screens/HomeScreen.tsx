import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import useLocation from '../hooks/useLocation';
import { SleepLogic } from '../db/logic';
import { useStorage } from '../db/storage';
import useColorStore from '../hooks/useColors';
import MorphSlider from '../components/MorphSlider';
import { Easing, SharedValue, useDerivedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import StaggeredText from '../components/StaggeredText';

export default function HomeScreen({ fadeOutNav }: { fadeOutNav: SharedValue<number> }) {
  useEffect(() => {
    useColorStore.getState().setBlur(0);
  }, []);

  const currentSession = useStorage((state) => state.currentSession);
  const isTracking = !!currentSession;
  const [statusbarHide, setStatusbarHide] = useState(isTracking);
  const [commentHide, setCommentHide] = useState(isTracking);

  const startTracking = () => {
    setCommentHide(true);
    const location = useLocation.getState().location;
    const lat = location?.coords.latitude ?? null;
    const lon = location?.coords.longitude ?? null;

    SleepLogic.startTracking({ lat, lon });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log("[HomeScreen] Tracking started.");
  };

  const stopTracking = async () => {
    setCommentHide(false);
    const location = useLocation.getState().location;
    const lat = location?.coords.latitude ?? null;
    const lon = location?.coords.longitude ?? null;

    try {
      await SleepLogic.stopTracking({ lat, lon });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      console.log("[HomeScreen] Tracking stopped and saved.");
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.log("[HomeScreen] Tracking stop errored: ", e);
    }
  };

  return (
    <View style={styles.container}>

      <StatusBar
        hidden={statusbarHide}
        style='light'
        hideTransitionAnimation='slide'
        animated={true}
        translucent
      />

      {commentHide && (
        <StaggeredText
          sentence='Hello World! My name is 67.'
          style={{ color: 'white' }}
          wordStyles={{ '67.': { color: '#f00', fontFamily: 'Lora' } }}
          containerStyle={{ marginBottom: 100 }}
        />
      )}

      <MorphSlider
        isInitialComplete={isTracking}
        trackWidth={0.6944444444 * Dimensions.get('screen').width}

        animationPlugins={[
          {
            val: useColorStore(state => state.blur) as SharedValue<number>,
            onUpdate: (t, d) => { 'worklet'; return t },
            onReset: () => { 'worklet'; return withTiming(0, { duration: 500 }) },
            onMorphThumb: () => { 'worklet'; return withTiming(0, { duration: 500 }) },

            // onUpdate: (t, d) => { 'worklet'; return Math.round(t) },
            // onReset: () => { 'worklet'; return 0 },
            // onMorphThumb: () => { 'worklet'; return 0 },
          }, {
            val: fadeOutNav,
            onEnd: (e) => {
              'worklet';
              if (e) return withDelay(500, withSpring(Number(!e), { damping: 15, stiffness: 200, mass: 1 }))
              else return withTiming(Number(!e), { duration: 1000, easing: Easing.out(Easing.cubic) })
            },
          }, {
            val: null,
            onEnd: (e) => { 'worklet'; scheduleOnRN(setStatusbarHide, !e); return 0; },
            onMorphButton: () => { 'worklet'; scheduleOnRN(startTracking); return 0; },
            onMorphThumb: () => { 'worklet'; scheduleOnRN(stopTracking); return 0; },
          }
        ]}
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