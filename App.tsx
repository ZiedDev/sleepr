import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator, Platform } from 'react-native';
import { useLocation } from './src/hooks/useLocation';
import { db } from './src/db/db';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const { location, errorMsg, loading } = useLocation();

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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.text}>Database status:</Text>
      {dbReady? (
        <Text style={styles.validText}>initialized</Text>
      ) : (
        <ActivityIndicator size="large" color="#00e5ff" />
      )}

      <Text style={styles.text}>Current coordinates:</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#00e5ff" />
      ) : errorMsg ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : (
        <Text style={styles.validText}>
          {location?.coords.latitude.toFixed(4)}, {location?.coords.longitude.toFixed(4)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2e2e2e',
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
    fontSize: 28,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff5252',
  }
});