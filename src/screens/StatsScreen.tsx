import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import * as Haptics from 'expo-haptics';
import useLocation from '../hooks/useLocation';
import useColorStore from '../hooks/useColors';
import Skeleton from "react-native-reanimated-skeleton";

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

  useEffect(() => {
    useColorStore.getState().setBlur(0.8);
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

        <View style={styles.header}>
          <Text style={styles.title}>Statistics</Text>
          <View style={styles.selector}></View>
        </View>

        {/* <Skeleton
          containerStyle={styles.grid}
          isLoading={true}
          boneColor='#2e2e2e'
          highlightColor='#515151'
          animationDirection='diagonalTopLeft'
          layout={[
            { key: "steps", width: "100%", height: 220, marginBottom: 12,borderRadius:20 }, // cardLarge
            { key: "calories", width: "48%", height: 96, marginBottom: 12 }, // cardSmall
            { key: "distance", width: "48%", height: 96, marginBottom: 12 }, // cardSmall
            { key: "sleep", width: "100%", height: 120, marginBottom: 12 }, // cardWide
            { key: "heartRate", width: "48%", height: 96, marginBottom: 12 }, // cardMedium
            { key: "workouts", width: "48%", height: 96, marginBottom: 12 }, // cardMedium
          ]}
        >
          <View style={styles.grid}>
            <View style={[styles.card, styles.cardLarge]}>
              <Text style={styles.cardText}>Steps</Text>
            </View>

            <View style={[styles.card, styles.cardSmall]}>
              <Text style={styles.cardText}>Calories</Text>
            </View>
            <View style={[styles.card, styles.cardSmall]}>
              <Text style={styles.cardText}>Distance</Text>
            </View>

            <View style={[styles.card, styles.cardWide]}>
              <Text style={styles.cardText}>Sleep</Text>
            </View>

            <View style={[styles.card, styles.cardMedium]}>
              <Text style={styles.cardText}>Heart Rate</Text>
            </View>
            <View style={[styles.card, styles.cardMedium]}>
              <Text style={styles.cardText}>Workouts</Text>
            </View>
          </View>
        </Skeleton> */}

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

  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: "#2e2e2e",
    borderRadius: 24,
    padding: 16,
    justifyContent: "center",
    alignItems: 'flex-start',
  },
  cardText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500"
  },

  cardSmall: {
    width: "48%",
    aspectRatio: 1.5,
  },
  cardMedium: {
    width: "48%",
    aspectRatio: 1,
  },
  cardLarge: {
    width: "100%",
    aspectRatio: 1.5,
  },
  cardWide: {
    width: "100%",
    aspectRatio: 3,
  },
});