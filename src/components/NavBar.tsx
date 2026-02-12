import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
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
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => setNavState("Statistics")}>
        <PhChartBarBold fill={"white"}/>
        <Text style={styles.buttonText}>Statistics</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => setNavState("Home")}>
        <PhMoonBold fill={"white"}/>
        <Text style={styles.buttonText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => setNavState("Settings")}>
        <PhGearBold fill={"white"}/>
        <Text style={styles.buttonText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 10,
    paddingVertical: 17.5,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.15)",
    borderCurve: "continuous",
    borderStyle: "solid",
    borderWidth: 2,
    borderColor: "#434343",
    borderRadius: 30,
    width: Dimensions.get("window").width - 10 * 2,
  },

  button: {
    display: "flex",
    alignItems: "center"
  },
  
  buttonText: {
    fontWeight: "bold",
    color: "white",
  },

});