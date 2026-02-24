import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Switch } from 'react-native';
import useLocation from '../hooks/useLocation';
import { SleepLogic, toISODate, DataLogic, SunLogic } from '../db/logic';
import { useStorage } from '../db/storage';
import * as Haptics from 'expo-haptics';
import { DateTime } from 'luxon';
import Slider from '@react-native-community/slider';
import useColorStore from '../hooks/useColors';
import { useAnimatedReaction } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';

export default function HomeScreen() {
  const { location, errorMsg, loading: locationLoading } = useLocation();
  const { progress, setProgressByTime, setBlur } = useColorStore();
  const [isHide, setHide] = useState(false);
  const [sliderValue, setSliderValue] = useState<number>(
    DateTime.now().diff(DateTime.now().startOf('day'), 'hours').hours
  );

  useEffect(() => {
    setBlur(0);
  }, []);

  const [displayProgress, setDisplayProgress] = useState(0);

  useAnimatedReaction(
    () => progress.value,
    (val) => {
      runOnJS(setDisplayProgress)(val);
    }
  );

  const currentSession = useStorage((state) => state.currentSession);
  const isTracking = !!currentSession;

  const handleToggleTracking = async () => {
    Haptics.selectionAsync();
    const lat = location?.coords.latitude ?? null;
    const lon = location?.coords.longitude ?? null;

    try {
      if (isTracking) {
        await SleepLogic.stopTracking({ lat, lon });
        console.log("[HomeScreen] Tracking stopped and saved.");
      } else {
        SleepLogic.startTracking({ lat, lon });
        console.log("[HomeScreen] Tracking started.");
      }
    } catch (error) {
      console.error("[HomeScreen] Failed to toggle tracking:", error);
    }
  };


  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Switch
        value={isHide}
        onValueChange={setHide}
        trackColor={{ false: "#333", true: "#109dc9" }}
      />

      {!isHide ? (<>
        <Text style={[styles.text, { marginTop: 20 }]}>Location:</Text>
        {locationLoading ? (
          <ActivityIndicator size="large" color={styles.indicator.color} />
        ) : errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : (
          <Text style={styles.validText}>
            {location?.coords.latitude.toFixed(4)}, {location?.coords.longitude.toFixed(4)}
          </Text>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, isTracking ? styles.stopButton : styles.startButton]}
            onPress={handleToggleTracking}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isTracking ? 'STOP TRACKING' : 'START TRACKING'}
              </Text>
            )}
          </TouchableOpacity>

          {isTracking && currentSession && (
            <Text style={styles.trackingNote}>
              Session started: {toISODate(currentSession.start)}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, styles.startButton, { marginTop: 20 }]}
          onPress={async () => {
            if (location) {
              const l = await SunLogic.request({
                date: DateTime.now().plus({ day: 1 }).toISO(),
                lat: location.coords.latitude,
                lon: location.coords.longitude
              })
              console.log(l)
            }
            Haptics.selectionAsync();
          }}
        >
          <Text style={styles.buttonText}>TEST</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.startButton, { marginTop: 20 }]}
          onPress={async () => {
            await DataLogic.clearAll();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          }}
        >
          <Text style={styles.buttonText}>CLEAR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.infoButton, { marginTop: 20 }]}
          onPress={() => { DataLogic.importFromFile({ clearExisting: false }); Haptics.selectionAsync(); }}
        >
          <Text style={styles.buttonText}>IMPORT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.infoButton, { marginTop: 20 }]}
          onPress={() => { DataLogic.exportToFile(); Haptics.selectionAsync(); }}
        >
          <Text style={styles.buttonText}>EXPORT</Text>
        </TouchableOpacity>

      </>) : (<>
        <Text style={[{ margin: 'auto' }, styles.text]}>{sliderValue}, {displayProgress}</Text>
        <Slider
          style={{ width: '70%', height: 40, margin: 'auto' }}
          minimumValue={0}
          maximumValue={24}
          value={sliderValue}
          onValueChange={(value) => {
            setSliderValue(value);
            setProgressByTime(DateTime.now().set({ hour: value }));
          }}
        />
      </>)}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#e2e2e2',
    fontSize: 18,
    marginBottom: 8,
  },
  validText: {
    color: '#00e5ff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff5252',
  },
  indicator: {
    color: '#00e5ff',
  },
  buttonContainer: {
    marginTop: 50,
    alignItems: 'center',
    width: '100%',
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startButton: {
    backgroundColor: '#19d1e6',
  },
  stopButton: {
    backgroundColor: '#e61919',
  },
  infoButton: {
    backgroundColor: '#e5e619',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  trackingNote: {
    color: '#00e5ff',
    marginTop: 15,
    fontSize: 12,
    fontStyle: 'italic',
  }
});