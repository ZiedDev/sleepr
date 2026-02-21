import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Switch } from 'react-native';
import { useLocation } from '../hooks/useLocation';
import { initDB, SleepLogic, toISODate, DataLogic } from '../db/logic';
import { useStorage } from '../db/storage';
import * as Haptics from 'expo-haptics';
import { SharedValue, useAnimatedReaction, withTiming, Easing } from 'react-native-reanimated';
import { DateTime } from 'luxon';
import Slider from '@react-native-community/slider';
import { getProgress } from '../hooks/useColors';
import { runOnJS } from 'react-native-worklets';

export default function HomeScreen({ solarProgress }: { solarProgress: SharedValue<number> }) {
  const [dbReady, setDbReady] = useState(false);
  const { location, errorMsg, loading: locationLoading, refresh: refreshLocation } = useLocation();
  const [isHide, setHide] = useState(false);
  const [sliderValue, setSliderValue] = useState<number>(
    DateTime.now().diff(DateTime.now().startOf('day'),'hours').hours
  );

  const [displayProgress, setDisplayProgress] = useState(0);

  useAnimatedReaction(
    () => solarProgress.value,
    (val) => {
      runOnJS(setDisplayProgress)(val);
    }
  );

  const currentSession = useStorage((state) => state.currentSession);
  const isTracking = !!currentSession;

  const isLoading = !dbReady || locationLoading;

  useEffect(() => {
    (async () => {
      try {
        await initDB();
        setDbReady(true);
      } catch (e) {
        console.error("[HomeScreen] Database init failed", e);
      }
    })();
  }, []);

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
        <Text style={styles.text}>Database status:</Text>
        {dbReady ? (
          <Text style={styles.validText}>initialized</Text>
        ) : (
          <ActivityIndicator size="large" color={styles.indicator.color} />
        )}

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
            disabled={isLoading}
          >
            {isLoading ? (
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
          onPress={() => { refreshLocation(); Haptics.selectionAsync(); }}
        >
          <Text style={styles.buttonText}>REFRESH</Text>
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
        <Text style={{ margin: 'auto' }}>{displayProgress}, {sliderValue}, {getProgress(sliderValue)}</Text>
        <Slider
          style={{ width: '70%', height: 40, margin: 'auto' }}
          minimumValue={0}
          maximumValue={24}
          value={sliderValue}
          onValueChange={(value) => {
            setSliderValue(value);
            solarProgress.value = withTiming(getProgress(value), {
              duration: 1000,
              easing: Easing.linear,
            });
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