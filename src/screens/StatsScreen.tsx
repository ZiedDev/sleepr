import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import useLocation from '../hooks/useLocation';
import useColorStore from '../hooks/useColors';
import { DataLogic } from '../db/logic';
import Slider from '@react-native-community/slider';
import { DateTime } from 'luxon';
import { useAnimatedReaction } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';

export default function StatsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setRefreshing(true);
    await useLocation.getState().refresh();
    await useColorStore.getState().refresh();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setRefreshing(false);
  }, []);

  const { location, errorMsg, loading: locationLoading } = useLocation();
  const { progress, setProgressByTime, setBlur } = useColorStore();

  const [sliderValue, setSliderValue] = useState<number>(
    DateTime.now().diff(DateTime.now().startOf('day'), 'hours').hours
  );

  const [displayProgress, setDisplayProgress] = useState(0);
  useAnimatedReaction(
    () => progress.value,
    (val) => {
      runOnJS(setDisplayProgress)(val);
    }
  );

  useEffect(() => {
    useColorStore.getState().setBlur(15);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ width: "100%" }}
        contentContainerStyle={{ alignItems: 'center' }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF" // iOS
            colors={["#007AFF"]} // Android
          />
        }
      >
        <Text style={styles.title}>
          Lorem ipsum
          {/* Lorem ipsum dolor sit amet consectetur adipisicing elit. Laboriosam animi fuga, fugit sequi dignissimos dolor commodi cupiditate cumque nihil maxime pariatur at quasi iusto blanditiis amet mollitia accusamus alias suscipit tenetur unde consequuntur itaque quaerat repellat vitae! Repudiandae, quaerat sit. Eaque repudiandae amet porro eligendi beatae vel enim eum fugiat tempora quia magnam consequatur nam dolorem facilis sapiente inventore deleniti necessitatibus error, vitae nostrum? Alias, dolorum.Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor labore itaque inventore excepturi ut voluptatum delectus nulla beatae sequi consequuntur error doloremque modi repudiandae ducimus dolore nam quas autem eius harum omnis, ullam corrupti molestiae quae incidunt? Eaque libero distinctio consequatur delectus quibusdam adipisci expedita nihil officiis quia qui, quidem id veritatis! Eaque minima recusandae adipisci velit iste explicabo nisi consequuntur amet odio nemo ratione asperiores id dolor, a porro quisquam ullam vero aliquam. Voluptatibus vel doloribus quam esse explicabo fugit architecto veritatis recusandae, ipsa delectus consequuntur dicta quas optio molestias quibusdam, similique sed accusamus! Ab iusto optio exercitationem officiis perspiciatis porro recusandae velit. Hic aliquid, perspiciatis suscipit saepe dicta repudiandae quaerat similique totam pariatur, fugiat illo dolor! Dolorum, magni nam quaerat tempore temporibus vel praesentium, veritatis, quasi harum dicta dolore cupiditate eveniet? Molestiae optio, consectetur iusto quo ipsum aspernatur illo? Sequi, amet. Provident numquam corporis consequatur, quibusdam consectetur tempora deserunt autem, sit minima, atque fuga dolor. Maiores ipsam esse dolor eius dolores quis. Consequuntur repudiandae soluta incidunt deleniti ex pariatur. Pariatur veniam distinctio maxime illo, amet ad tempore iusto mollitia autem nostrum inventore eius, aut, odio est laudantium assumenda? Quasi mollitia doloribus ea, magni dicta similique atque placeat minus? */}
        </Text>

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

        {locationLoading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : (
          <Text style={[styles.subtext, styles.validText]}>
            {location?.coords.latitude.toFixed(4)}, {location?.coords.longitude.toFixed(4)}
          </Text>
        )}

        <Text style={styles.subtext}>{sliderValue}</Text>
        <Text style={styles.subtext}>{displayProgress}</Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',

  },
  title: { fontSize: 28, color: '#fff', marginBottom: 20 },
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
  subtext: { fontSize: 18, color: '#fff', marginBottom: 5 },
  validText: {
    color: '#00e5ff',
  },
  errorText: {
    color: '#ff5252',
  },
});