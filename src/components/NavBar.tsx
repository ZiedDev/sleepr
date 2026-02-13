import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import SafeBlurView from './SafeBlurView';
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
    <SafeBlurView
      style={styles.container}
      tint="systemChromeMaterialDark"
      intensity={42}
      experimentalBlurMethod='dimezisBlurView'
      blurReductionFactor={20}
    >

      <TouchableOpacity style={styles.button} onPress={() => setNavState("Statistics")}>
        <PhChartBarBold style={navState == "Statistics" ? styles.iconSelected : ""} fill={navState == "Statistics" ? "#13b4e6" : "white"} />
        <Text style={[styles.buttonText, navState == "Statistics" ? styles.textSelected : ""]}>Statistics</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => setNavState("Home")}>
        <PhMoonBold style={navState == "Home" ? styles.iconSelected : ""} fill={navState == "Home" ? "#13b4e6" : "white"} />
        <Text style={[styles.buttonText, navState == "Home" ? styles.textSelected : ""]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => setNavState("Settings")}>
        <PhGearBold style={navState == "Settings" ? styles.iconSelected : ""} fill={navState == "Settings" ? "#13b4e6" : "white"} />
        <Text style={[styles.buttonText, navState == "Settings" ? styles.textSelected : ""]}>Settings</Text>
      </TouchableOpacity>
    </SafeBlurView>
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
    backgroundColor: "rgba(17, 0, 48, 0.15)",
    borderCurve: "continuous",
    borderStyle: "solid",
    borderWidth: 2,
    borderColor: "rgba(67, 67, 67, 0.6)",
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
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  },
  temp: {
    width: "33.333%",
    backgroundColor: "#fff0000"
  },
});