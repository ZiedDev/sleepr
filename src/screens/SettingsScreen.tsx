import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import ClockSlider from '../components/ClockSlider';
import useColorStore from '../hooks/useColors';
import Svg, { Path } from 'react-native-svg';

export default function SettingsScreen() {

  if (['android', 'web'].includes(Platform.OS)) {
    useEffect(() => {
      useColorStore.getState().setBlur(15);
    }, []);
  }

  return (
    <View style={styles.container}>
      <ClockSlider
        size={Dimensions.get('window').width * 0.5}
        onValueChange={(s, e) => console.log(s, e)}

        startIcon={
          <Svg width={25} height={25} viewBox="0 0 24 24">
            <Path fill="#812812" d="M7 12.5a3 3 0 1 0-3-3a3 3 0 0 0 3 3m0-4a1 1 0 1 1-1 1a1 1 0 0 1 1-1m13-2h-8a1 1 0 0 0-1 1v6H3v-8a1 1 0 0 0-2 0v13a1 1 0 0 0 2 0v-3h18v3a1 1 0 0 0 2 0v-9a3 3 0 0 0-3-3m1 7h-8v-5h7a1 1 0 0 1 1 1Z" />
          </Svg>
        }
        endIcon={
          <Svg width={25} height={25} viewBox="0 0 24 24">
            <Path fill="#812812" d="M12 22q-1.875 0-3.512-.712t-2.85-1.925t-1.925-2.85T3 13t.713-3.512t1.924-2.85t2.85-1.925T12 4t3.513.713t2.85 1.925t1.925 2.85T21 13t-.712 3.513t-1.925 2.85t-2.85 1.925T12 22m2.8-4.8l1.4-1.4l-3.2-3.2V8h-2v5.4zM5.6 2.35L7 3.75L2.75 8l-1.4-1.4zm12.8 0l4.25 4.25l-1.4 1.4L17 3.75z" />
          </Svg>
        }
      />
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