import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useLocation } from './src/hooks/useLocation';

export default function App() {
  const { location, errorMsg, loading } = useLocation();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.text}>Current coordinates:</Text>

      {loading ? (
        <Text style={styles.text}>Loading GPS...</Text>
      ) : errorMsg ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : (
        <Text style={styles.coords}>
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
  coords: {
    color: '#00e5ff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff5252',
  }
});