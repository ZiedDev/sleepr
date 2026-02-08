import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocation } from './src/hooks/useLocation';
import { db } from './src/db/db';
import { SleepLogic, toISODate } from './src/db/logic';
import { useStorage } from './src/db/storage';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const { location, errorMsg, loading: locationLoading } = useLocation();

  const currentSession = useStorage((state) => state.currentSession);
  const isTracking = !!currentSession;

  useEffect(() => {
    async function setup() {
      try {
        await db.init();
        setDbReady(true);
      } catch (e) {
        console.error("Database init failed", e);
      }
    }
    setup();
  }, []);

  const handleToggleTracking = async () => {
    const lat = location?.coords.latitude ?? null;
    const lon = location?.coords.longitude ?? null;

    try {
      if (isTracking) {
        await SleepLogic.stopTracking({ lat, lon });
        console.log("Tracking stopped and saved.");
      } else {
        SleepLogic.startTracking({ lat, lon });
        console.log("Tracking started.");
      }
    } catch (error) {
      console.error("Failed to toggle tracking:", error);
    }
  };

  const isLoading = !dbReady || locationLoading;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2e2e2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
    backgroundColor: '#00e5ff',
  },
  stopButton: {
    backgroundColor: '#ff5252',
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