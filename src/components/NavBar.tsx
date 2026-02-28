import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Button } from 'react-native';
import Animated, { cubicBezier, interpolateColor, useDerivedValue, useSharedValue, withTiming, Easing, useAnimatedStyle, SharedValue, withSpring } from 'react-native-reanimated';
import SafeBlurView from './SafeBlurView';
import PhMoonBold from '../../assets/svgs/PhMoonBold';
import PhChartBarBold from '../../assets/svgs/PhChartBarBold';
import PhGearBold from '../../assets/svgs/PhGearBold';
import { Gesture, GestureDetector, GestureStateChangeEvent, GestureUpdateEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';


const navOptions = [
  { key: "Statistics", icon: PhChartBarBold },
  { key: "Home", icon: PhMoonBold },
  { key: "Settings", icon: PhGearBold },
] as const;

type NavState = typeof navOptions[number]["key"];

const { width } = Dimensions.get('window');
const HORIZONTAL_PADDING = 20;
const BUTTON_WIDTH = (width - HORIZONTAL_PADDING - 8) / navOptions.length;
const BUTTON_HEIGHT = 82;
const AnimatedText = Animated.createAnimatedComponent(Text);

export default function NavBar({
  navState,
  setNavState,
}: {
  navState: NavState;
  setNavState: React.Dispatch<React.SetStateAction<NavState>>;
}) {
  const selectedIndex = useSharedValue(
    navOptions.findIndex(n => n.key === navState)
  );
  const translationX = useSharedValue(0);

  useEffect(() => {
    selectedIndex.value = navOptions.findIndex(n => n.key === navState);
  }, [navState]);

  const selectorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translationX.value }],
  }));

  const handleGesture = (event:
    GestureStateChangeEvent<PanGestureHandlerEventPayload> |
    GestureUpdateEvent<PanGestureHandlerEventPayload>) => {

    selectedIndex.value = Math.min(Math.max(0, (event.x - BUTTON_WIDTH / 2) / BUTTON_WIDTH), (navOptions.length - 1));

    translationX.value = withSpring(Math.min(Math.max(0, event.x - BUTTON_WIDTH / 2), BUTTON_WIDTH * (navOptions.length - 1)), {
      damping: 20,
      stiffness: 280,
      mass: 1,
      overshootClamping: false,
    });
  }

  const pan = Gesture.Pan()
    .onBegin(handleGesture)
    .onUpdate(handleGesture)
    .onFinalize(event => {
      selectedIndex.value = Math.min(Math.max(0, Math.round(selectedIndex.value)), (navOptions.length - 1));
      translationX.value = withSpring(BUTTON_WIDTH * selectedIndex.value, {
        damping: 20,
        stiffness: 240,
        mass: 1,
        overshootClamping: false,
      });

      scheduleOnRN(setNavState, navOptions[selectedIndex.value].key);
    });

  return (
    <GestureDetector gesture={pan}>
      <View>

        <SafeBlurView style={styles.container} intensity={15}>

          {/* Nav Buttons */}
          {navOptions.map((option, index) => (<NavButton
            key={option.key}
            label={option.key}
            Icon={option.icon}
            index={index}
            selectedIndex={selectedIndex}
          // onPress={() => setNavState(option.key)}
          />))}
        </SafeBlurView>

        <View style={styles.navSelectorContainer}>
          {/* Selector */}
          <Animated.View style={[styles.navSelector, selectorStyle]}/>
        </View>
      </View>


    </GestureDetector>
  );
}

const NavButton = ({ label, Icon, index, selectedIndex, onPress }: {
  label: string,
  Icon: React.ComponentType<any>,
  index: number,
  selectedIndex: SharedValue<number>,
  onPress?: () => void,
}) => {
  const textStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      selectedIndex.value,
      [index - 1, index, index + 1],
      ["#ffffff", "#13b4e6", "#ffffff"],
    );

    const glow = interpolateColor(
      selectedIndex.value,
      [index - 1, index, index + 1],
      ["#ffffff", "#109dc9", "#ffffff"],
    );

    return {
      color,
      textShadowColor: glow,
      textShadowRadius: 2.5,
      textShadowOffset: { width: 0, height: 0 }
    }
  });

  const iconColor = useDerivedValue(() => interpolateColor(
    selectedIndex.value,
    [index - 1, index, index + 1],
    ["#ffffff", "#13b4e6", "#ffffff"],
  ));

  const iconStyle = useAnimatedStyle(() => {
    const glow = interpolateColor(
      selectedIndex.value,
      [index - 1, index, index + 1],
      ["#ffffff", "#109dc9", "#ffffff"],
    );

    return {
      shadowColor: glow,
      shadowOffset: { width: 0, height: 0, },
      shadowOpacity: 1,
      shadowRadius: 2.5,
    }
  });

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Icon color={iconColor} />
      <AnimatedText style={[styles.buttonText, textStyle]}>{label}</AnimatedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    marginHorizontal: HORIZONTAL_PADDING / 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17, 0, 48, 0.15)",
    borderCurve: "continuous",
    borderStyle: "solid",
    borderWidth: 2,
    borderColor: "rgba(67, 67, 67, 0.6)",
    borderRadius: 30,
    width: width - HORIZONTAL_PADDING,
    height: BUTTON_HEIGHT,
    paddingVertical: 17.5,
  },

  button: {
    height: "100%",
    width: BUTTON_WIDTH,
    display: "flex",
    alignItems: "center",
    position: "relative",
    zIndex: 2,
  },

  buttonText: {
    fontWeight: "bold",
    color: "white",
  },

  navSelectorContainer: {
    position: "absolute",
    bottom: 0,
    marginHorizontal: HORIZONTAL_PADDING / 2,
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0)",
    width: width - HORIZONTAL_PADDING,
    paddingVertical: 17.5,
    height: BUTTON_HEIGHT
  },

  navSelector: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: BUTTON_WIDTH - 12,
    backgroundColor: "rgba(17, 0, 48, 0.15)",
    margin: 6,
    borderCurve: "continuous",
    borderStyle: "solid",
    borderWidth: 2,
    borderColor: "rgba(50, 50, 50, 0.6)",
    borderRadius: 24,
    boxSizing: "content-box",
    overflow: "hidden",
    transformOrigin: "left",
  },
});