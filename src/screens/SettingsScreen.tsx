import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Dimensions, Text, TextInput } from 'react-native';
import ClockSlider from '../components/ClockSlider'
import useColorStore from '../hooks/useColors';
import Svg, { Path } from 'react-native-svg';
import { DateTime } from 'luxon';
import { createAnimatedComponent, interpolate, useAnimatedProps, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import useLocation from '../hooks/useLocation';
import { DataLogic } from '../db/logic';
import Slider from '@react-native-community/slider';
import { useAnimatedReaction } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';

const getStrFromRad = (startAngle: number, endAngle: number) => {
  const hourStart = interpolate(startAngle, [0, 2 * Math.PI], [6, 30]) % 24;
  const hourEnd = interpolate(endAngle, [0, 2 * Math.PI], [6, 30]) % 24;
  const startStr = DateTime.now().startOf('day').plus({ hour: hourStart }).toFormat("h:mm a");
  const endStr = DateTime.now().startOf('day').plus({ hour: hourEnd }).toFormat("h:mm a");
  return `${startStr} -> ${endStr}`;
}

const formatTime = (totalHours: number) => {
  'worklet';
  const h = Math.floor(totalHours % 24);
  const m = Math.floor((totalHours * 60) % 60);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  const displayMinute = m < 10 ? `0${m}` : m;
  return `${displayHour}:${displayMinute} ${suffix}`;
};

const AnimatedTextInput = createAnimatedComponent(TextInput);

export default function SettingsScreen() {
  const singleAngle = useSharedValue(Math.PI * 1.5);

  const singleClockStr = useDerivedValue(() => {
    const hour = interpolate(singleAngle.value, [0, 2 * Math.PI], [6, 30]) % 24;
    return formatTime(hour);
  });

  const animatedProps = useAnimatedProps(() => {
    return {
      text: singleClockStr.value,
    } as any;
  });

  useEffect(() => {
    useColorStore.getState().setBlur(0.8);
  }, []);

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
        <ClockSlider mode='range' size={200}
          startTargetAngle={Math.PI * 1.5}
          endTargetAngle={Math.PI * 2}
        />
        <AnimatedTextInput
          underlineColorAndroid="transparent"
          editable={false}
          value={singleClockStr.value} // Fallback for JS initial render
          animatedProps={animatedProps}
          style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}
        />
        <ClockSlider
          mode='range'
          size={Dimensions.get('window').width * 0.7}
          // onValueChange={(s, e) => setClock(getStrFromRad(s, e))}

          step={(2 * Math.PI) / (24 * 60) * 15}
          forwardDifference={4}
          backwardDifference={16}

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
        <ClockSlider
          mode='single'
          // locked
          style={{ marginTop: 10 }}

          startAngle={singleAngle}

          startTargetAngle={Math.PI * 1.5}
          endTargetAngle={0}

          size={Dimensions.get('window').width * 0.5}
          // onValueChange={(s) => { console.log(s); }}

          step={(2 * Math.PI) / (24 * 60) * 30}
          // quantize={false}

          startColor='#27b2fc'
          trackColor='#2e2e2e'

          startIcon={
            <Svg width={25} height={25} viewBox="0 0 30 30">
              <Path fill="#fff" d="M2.75 15.36q0-.375.3-.69c.22-.19.46-.29.7-.29h2.33c.27 0 .49.1.67.29s.27.43.27.69q0 .435-.27.72a.9.9 0 0 1-.67.29H3.75c-.27 0-.5-.1-.7-.3c-.2-.21-.3-.45-.3-.71m3.33-7.98c0-.27.09-.5.26-.68c.23-.2.46-.3.71-.3c.26 0 .49.1.68.29l1.64 1.65c.19.22.28.45.28.69c0 .28-.09.52-.27.7s-.4.28-.66.28c-.24 0-.48-.1-.7-.29L6.34 8.11c-.17-.21-.26-.46-.26-.73m2 13.5c0-.28.1-.51.29-.68c.18-.17.4-.26.68-.26h2.63l3.11-2.92c.1-.08.21-.08.34 0l3.16 2.92h2.77c.27 0 .5.09.69.28a.9.9 0 0 1 .29.67c0 .27-.1.5-.29.69s-.42.29-.69.29h-3.38c-.1 0-.2-.02-.29-.07l-2.41-2.27l-2.39 2.27c-.08.05-.17.07-.28.07H9.05a.974.974 0 0 1-.97-.99M9 15.36c0 .97.21 1.85.62 2.64c.02.12.11.18.25.18h1.88c.07 0 .12-.03.15-.08c.03-.06.02-.12-.02-.19q-.96-1.155-.96-2.55c0-1.12.4-2.08 1.2-2.87s1.76-1.18 2.89-1.18c1.12 0 2.07.39 2.86 1.18s1.19 1.74 1.19 2.87c0 .94-.32 1.79-.95 2.55c-.04.07-.05.13-.03.19s.07.08.15.08h1.9c.13 0 .21-.06.23-.18c.44-.77.64-1.65.64-2.64c0-.81-.16-1.59-.48-2.32c-.32-.74-.75-1.37-1.28-1.91a6.1 6.1 0 0 0-1.91-1.28c-.74-.32-1.51-.47-2.32-.47s-1.59.16-2.33.47c-.74.32-1.38.74-1.92 1.28A5.96 5.96 0 0 0 9 15.36m5.03-8.96V4.1c0-.29.09-.52.28-.71s.43-.28.71-.28s.51.09.7.28s.28.44.28.72v2.3c0 .29-.09.52-.28.71c-.18.18-.42.28-.7.28a.95.95 0 0 1-.71-.28a.97.97 0 0 1-.28-.72m6.35 2.64q0-.375.27-.69l1.62-1.65c.19-.19.43-.29.7-.29s.51.1.69.29c.19.19.28.42.28.69c0 .29-.09.53-.26.73L22 9.73c-.21.19-.45.29-.7.29c-.27 0-.49-.09-.66-.28s-.26-.42-.26-.7m2.61 6.32q0-.405.27-.69c.18-.19.4-.29.66-.29h2.35c.27 0 .5.1.69.29s.29.43.29.69c0 .28-.1.51-.29.71s-.42.3-.69.3h-2.35c-.27 0-.49-.1-.67-.29c-.17-.2-.26-.44-.26-.72" />
            </Svg>
          }
        />

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
            setProgressByTime(DateTime.now().startOf('day').plus({ hour: value }));
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

        <Text style={styles.title}>
          Lorem ipsum
          {/* Lorem ipsum dolor sit amet consectetur adipisicing elit. Laboriosam animi fuga, fugit sequi dignissimos dolor commodi cupiditate cumque nihil maxime pariatur at quasi iusto blanditiis amet mollitia accusamus alias suscipit tenetur unde consequuntur itaque quaerat repellat vitae! Repudiandae, quaerat sit. Eaque repudiandae amet porro eligendi beatae vel enim eum fugiat tempora quia magnam consequatur nam dolorem facilis sapiente inventore deleniti necessitatibus error, vitae nostrum? Alias, dolorum.Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor labore itaque inventore excepturi ut voluptatum delectus nulla beatae sequi consequuntur error doloremque modi repudiandae ducimus dolore nam quas autem eius harum omnis, ullam corrupti molestiae quae incidunt? Eaque libero distinctio consequatur delectus quibusdam adipisci expedita nihil officiis quia qui, quidem id veritatis! Eaque minima recusandae adipisci velit iste explicabo nisi consequuntur amet odio nemo ratione asperiores id dolor, a porro quisquam ullam vero aliquam. Voluptatibus vel doloribus quam esse explicabo fugit architecto veritatis recusandae, ipsa delectus consequuntur dicta quas optio molestias quibusdam, similique sed accusamus! Ab iusto optio exercitationem officiis perspiciatis porro recusandae velit. Hic aliquid, perspiciatis suscipit saepe dicta repudiandae quaerat similique totam pariatur, fugiat illo dolor! Dolorum, magni nam quaerat tempore temporibus vel praesentium, veritatis, quasi harum dicta dolore cupiditate eveniet? Molestiae optio, consectetur iusto quo ipsum aspernatur illo? Sequi, amet. Provident numquam corporis consequatur, quibusdam consectetur tempora deserunt autem, sit minima, atque fuga dolor. Maiores ipsam esse dolor eius dolores quis. Consequuntur repudiandae soluta incidunt deleniti ex pariatur. Pariatur veniam distinctio maxime illo, amet ad tempore iusto mollitia autem nostrum inventore eius, aut, odio est laudantium assumenda? Quasi mollitia doloribus ea, magni dicta similique atque placeat minus? */}
        </Text>

      </ScrollView>
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
  title: { fontSize: 28, color: '#fff', marginBottom: 20 },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderCurve: "continuous",
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