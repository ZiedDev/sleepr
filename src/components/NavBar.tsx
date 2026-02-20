import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import SafeBlurView from './SafeBlurView';
import PhMoonBold from '../../assets/svgs/PhMoonBold';
import PhChartBarBold from '../../assets/svgs/PhChartBarBold';
import PhGearBold from '../../assets/svgs/PhGearBold';

const navOptions = ["Statistics", "Home", "Settings"] as const;

type NavState = typeof navOptions[number];

const NavSelectorComponent = Animated.createAnimatedComponent(SafeBlurView);
const AnimatedText = Animated.createAnimatedComponent(Text);

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
        <AnimatedText style={[{ transitionDuration: 500, transitionTimingFunction: cubicBezier(.5, .05, .53, 1.3), transitionProperty: 'all' }, [styles.buttonText, navState == "Statistics" ? styles.textSelected : ""]]}>Statistics</AnimatedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => setNavState("Home")}>
        <PhMoonBold style={navState == "Home" ? styles.iconSelected : ""} fill={navState == "Home" ? "#13b4e6" : "white"} />
        <AnimatedText style={[{ transitionDuration: 500, transitionTimingFunction: cubicBezier(.5, .05, .53, 1.3), transitionProperty: 'all' }, [styles.buttonText, navState == "Home" ? styles.textSelected : ""]]}>Home</AnimatedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => setNavState("Settings")}>
        <PhGearBold style={navState == "Settings" ? styles.iconSelected : ""} fill={navState == "Settings" ? "#13b4e6" : "white"} />
        <AnimatedText style={[{ transitionDuration: 500, transitionTimingFunction: cubicBezier(.5, .05, .53, 1.3), transitionProperty: 'all' }, [styles.buttonText, navState == "Settings" ? styles.textSelected : ""]]}>Settings</AnimatedText>
      </TouchableOpacity>

      <NavSelectorComponent
        style={[styles.navSelector, { transitionDuration: 500, transitionTimingFunction: cubicBezier(.5, .05, .53, 1.3), transitionProperty: 'left', left: (Dimensions.get("window").width - 32) / 3 * navOptions.indexOf(navState), }]}
        tint="systemChromeMaterialDark"
        intensity={42}
        experimentalBlurMethod='dimezisBlurView'
        blurReductionFactor={20} />

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
    position: "relative",
    zIndex: 2,
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

  navSelector: {
    position: "absolute",
    top: 0,
    left: (Dimensions.get("window").width - 32) / 3 * 1,
    width: (Dimensions.get("window").width - 32) / 3,
    bottom: 0,
    backgroundColor: "rgba(17, 0, 48, 0.15)",
    margin: 6,
    borderCurve: "continuous",
    borderStyle: "solid",
    borderWidth: 2,
    borderColor: "rgba(67, 67, 67, 0.6)",
    borderRadius: 24,
    overflow: "hidden",
  },
});