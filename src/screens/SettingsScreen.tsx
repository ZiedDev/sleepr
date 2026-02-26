import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Button, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import ClockSlider from '../components/ClockSlider';
import useColorStore from '../hooks/useColors';

export default function SettingsScreen() {

  if (['android', 'web'].includes(Platform.OS)) {
    useEffect(() => {
      useColorStore.getState().setBlur(15);
    }, []);
  }

  return (
    <View style={styles.container}>
      <ClockSlider mode='range' onValueChange={(s, e) => console.log(s, e)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
});