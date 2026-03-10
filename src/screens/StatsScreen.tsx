import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import useLocation from '../hooks/useLocation';
import useColorStore from '../hooks/useColors';
import Skeleton from "react-native-reanimated-skeleton";
import { SleepLogic, StatsLogic } from '../db/logic';
import { DateTime } from 'luxon';
import { SleepSessionRecord } from '../db/types';
import Averages from '../components/Stats/Averages'

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

  // Stats
  const [isLoading, setLoading] = useState(true);
  const now = DateTime.now();
  const [range, setRange] = useState({
    rangeStart: now.minus({ year: 1 }),
    rangeEnd: now,
  });
  const [sessions, setSessions] = useState<SleepSessionRecord[]>([]);

  useEffect(() => {
    const getStats = async () => {
      setLoading(true);
      const sessions = await SleepLogic.list(range);
      setSessions(sessions);
      setLoading(false);
    }
    getStats();
  }, [range]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ width: "100%" }}
        contentContainerStyle={{ alignItems: 'center' }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        <View style={styles.header}>
          <Text style={styles.title}>Statistics</Text>
          <View style={styles.selector}></View>
        </View>

        <View style={styles.statsWidgetsContainer}>
          {!isLoading && (
            <Averages width={PAGE_WIDTH} height={200} records={sessions} />
          )}
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