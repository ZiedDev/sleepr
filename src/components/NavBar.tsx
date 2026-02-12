import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import PhMoonBold from '../../assets/svgs/PhMoonBold';
import PhChartBarBold from '../../assets/svgs/PhChartBarBold';
import PhGearBold from '../../assets/svgs/PhGearBold';

type NavState = "Home" | "Statistics" | "Settings";

export default function NavBar({
  navState,
  setNavState,
}: {
  navState: NavState;
  setNavState: React.Dispatch<React.SetStateAction<NavState>>;
}) {

  return (
    <BlurView intensity={30} style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => setNavState("Statistics")}>
        <PhChartBarBold style={navState == "Statistics" ?  styles.iconSelected: ""} fill={navState == "Statistics" ?  "#13b4e6": "white"} />
        <Text style={[styles.buttonText, navState == "Statistics" ?  styles.textSelected: ""]}>Statistics</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => setNavState("Home")}>
        <PhMoonBold style={navState == "Home" ?  styles.iconSelected: ""} fill={navState == "Home" ?  "#13b4e6": "white"} />
        <Text style={[styles.buttonText, navState == "Home" ?  styles.textSelected: ""]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => setNavState("Settings")}>
        <PhGearBold style={navState == "Settings" ?  styles.iconSelected: ""} fill={navState == "Settings" ?  "#13b4e6": "white"} />
        <Text style={[styles.buttonText, navState == "Settings" ?  styles.textSelected: ""]}>Settings</Text>
      </TouchableOpacity>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    marginHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
    borderCurve: "continuous",
    borderStyle: "solid",
    borderWidth: 2,
    borderColor: "#434343",
    borderRadius: 30,
    width: Dimensions.get("window").width - 10 * 2,
    paddingVertical: 17.5,
  },

  button: {
    display: "flex",
    alignItems: "center",
    width: "33.333%"
  },

  buttonText: {
    fontWeight: "bold",
    color: "white",
  },

  iconSelected: {
    shadowColor: "#109dc9", 
    shadowOffset: { width: 0, height: 0, },
    shadowOpacity: 1,
    shadowRadius: 2.5,
  },

  textSelected: {
    color: "#13b4e6",
    textShadowColor: "#109dc9",
    textShadowRadius: 2.5,
    textShadowOffset: { width: 0, height: 0 }
  },
});