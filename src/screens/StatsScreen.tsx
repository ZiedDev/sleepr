import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import useLocation from '../hooks/useLocation';
import useColorStore from '../hooks/useColors';
import Skeleton from "react-native-reanimated-skeleton";
import { fromEpochSec, SleepLogic, StatsLogic } from '../db/logic';
import { DateTime, Interval } from 'luxon';
import { SleepSessionRecord } from '../db/types';
import Averages from '../components/Stats/Averages'
import Graph from '../components/Stats/Graph';
import { useSharedValue } from 'react-native-reanimated';
import useStats from '../hooks/useStats';

const PAGE_WIDTH = Dimensions.get('window').width * 0.9;

export default function StatsScreen() {
  useEffect(() => {
    useColorStore.getState().setBlur(0.8);
  }, []);

  // Refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setRefreshing(true);
    await useLocation.getState().refresh();
    await useColorStore.getState().refresh();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setRefreshing(false);
  }, []);

  const { isLoading, currentSessions, fetchedSessions, currentRange, setCurrentRange } = useStats(
    Interval.fromDateTimes(DateTime.now().minus({ day: 1 }), DateTime.now())
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ width: "100%" }}
        contentContainerStyle={{ alignItems: 'center' }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* TODO:  Pull header out of ScrollView */}
        <View style={styles.header}>
          <Text style={styles.title}>Statistics</Text>
          <View style={styles.selector}></View>
        </View>

        <TouchableOpacity
          style={{ marginTop: 20, padding: 40, borderRadius: 20, backgroundColor: '#19d1e6' }}
          onPress={() => {
            setCurrentRange(
              Interval.fromDateTimes(currentRange.start!.minus({ day: 1 }), currentRange.end!)
            )
            console.log(`
              ${currentRange.start?.toLocal()} -> ${currentRange.end?.toLocal()}
              ${currentSessions.value.map(x => fromEpochSec(x.end).toLocal())}
              ${fetchedSessions.value.map(x => fromEpochSec(x.end).toLocal())}
              `)
          }}
        />

        <View style={styles.statsWidgetsContainer}>
          {/* {!isLoading && (
            <Graph width={PAGE_WIDTH} height={200} records={sessions} />
          )} */}
        </View>

        <View style={styles.statsWidgetsContainer}>
          {/* {!isLoading && (
            <Averages width={PAGE_WIDTH} height={200} records={sessions} />
          )} */}
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    padding: 6,
    borderColor: "#ffffff99",
    borderBottomWidth: 2,
  },
  title: {
    fontFamily: "MonaSans-Regular",
    fontSize: 28,
    color: '#fff',
    fontWeight: '500',
  },
  selector: {
    backgroundColor: '#2e2e2e',
    width: 100,
    height: 40,
    borderRadius: 40 / 2,
    borderCurve: "continuous",
  },

  statsWidgetsContainer: {
    width: PAGE_WIDTH,
    paddingTop: 20,
  },
});