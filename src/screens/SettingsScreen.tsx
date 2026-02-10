import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';

export default function SettingsScreen() {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.section}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Sleep Notifications</Text>
          <Switch 
            value={isNotificationsEnabled} 
            onValueChange={setIsNotificationsEnabled}
            trackColor={{ false: "#333", true: "#109dc9" }}
          />
        </View>

        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingLabel}>Export Sleep Data (CSV)</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingLabel}>Privacy Policy</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Version 1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    paddingTop: 60, 
    backgroundColor: '#0f0f0f' 
  },
  title: { 
    fontSize: 28, 
    color: 'white', 
    fontWeight: 'bold', 
    marginBottom: 30 
  },
  section: { 
    backgroundColor: '#1a1a1a', 
    borderRadius: 15, 
    overflow: 'hidden' 
  },
  settingRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 18, 
    borderBottomWidth: 1, 
    borderBottomColor: '#262626' 
  },
  settingLabel: { 
    color: 'white', 
    fontSize: 16 
  },
  arrow: { 
    color: '#555', 
    fontSize: 18 
  },
  version: { 
    color: '#444', 
    textAlign: 'center', 
    marginTop: 40, 
    fontSize: 12 
  }
});