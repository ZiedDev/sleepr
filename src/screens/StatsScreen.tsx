import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import useLocation from '../hooks/useLocation';
import useColorStore from '../hooks/useColors';
import Skeleton from "react-native-reanimated-skeleton";
import { SleepLogic, StatsLogic } from '../db/logic';
import { DateTime, Interval } from 'luxon';
import { SleepSessionRecord } from '../db/types';
import Averages from '../components/Stats/Averages'
import Graph from '../components/Stats/Graph';
import { useSharedValue } from 'react-native-reanimated';

const PAGE_WIDTH = Dimensions.get('window').width * 0.9;
const POLL_SIZE = 2;
const LOADING_TIMEOUT = 300;

const expandInterval = (interval: Interval, n: number) => {
  if (!interval?.isValid || !interval.start || !interval.end) {
    throw new Error(`[StatsScreen] Invalid Luxon interval: ${interval?.invalidExplanation}`);
  }

  const durationMs = interval.toDuration().as("milliseconds");
  const shift = durationMs * n;

  return Interval.fromDateTimes(
    interval.start.minus({ milliseconds: shift }),
    interval.end.plus({ milliseconds: shift })
  );
}

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

  // Stats
  const [isLoading, setLoading] = useState(true);
  const [currentRange, setCurrentRange] = useState(Interval.fromDateTimes(
    DateTime.now().minus({ week: 1 }),
    DateTime.now()
  ));
  const [fetchedRange, setFetchedRange] = useState(expandInterval(currentRange, POLL_SIZE));
  const fetchedSessions = useSharedValue<SleepSessionRecord[]>([]);
  const currentSessions = useSharedValue<SleepSessionRecord[]>([]);

  useEffect(() => {
    const getStats = async () => {
      if (!fetchedRange || !currentRange) return;
      const startNearEdge = currentRange.start! <= fetchedRange.start!.plus({ milliseconds: 100 });
      const endNearEdge = currentRange.end! >= fetchedRange.end!.minus({ milliseconds: 100 });

      if (startNearEdge || endNearEdge) {
        let loadingShown = false;
        const timer = setTimeout(() => {
          setLoading(true);
          loadingShown = true;
        }, LOADING_TIMEOUT);

        const newRange = expandInterval(currentRange, POLL_SIZE);

        try {
          const newSessions = await SleepLogic.list({
            rangeStart: newRange.start!,
            rangeEnd: newRange.end!,
          });
          fetchedSessions.value = newSessions;
          // newRange.divideEqually()
          // TODO: update currentSessions.value
          setFetchedRange(newRange);
        } finally {
          clearTimeout(timer);
          if (loadingShown) setLoading(false);
        }
      }
    }
    getStats();
  }, [currentRange]);

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