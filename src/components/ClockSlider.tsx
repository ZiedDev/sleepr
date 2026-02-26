import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedProps, useSharedValue, SharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { scheduleOnRN } from 'react-native-worklets';

const { width, height } = Dimensions.get('window');
const SIZE = width * 0.8;
const RADIUS = SIZE / 2 - 20;
const CENTER = SIZE / 2;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

export default function ClockSlider({ mode, onValueChange }: {
    mode: 'range' | 'single' | 'locked';
    onValueChange?: (start: number, end?: number) => void;
}) {
    const translationX = useSharedValue(0);
    const translationY = useSharedValue(0);
    const prevTranslationX = useSharedValue(0);
    const prevTranslationY = useSharedValue(0);

    const animatedStyles = useAnimatedStyle(() => ({
        transform: [
            { translateX: translationX.value },
            { translateY: translationY.value },
        ],
    }));

    const pan = Gesture.Pan()
        .onStart(() => {
            prevTranslationX.value = translationX.value;
            prevTranslationY.value = translationY.value;
        })
        .onUpdate((event) => {
            const maxTranslateX = width / 2 * 0.5;
            const maxTranslateY = height / 2 * 0.5;

            translationX.value = Math.min(
                Math.max(prevTranslationX.value + event.translationX, -maxTranslateX),
                maxTranslateX
            );

            translationY.value = Math.min(
                Math.max(prevTranslationY.value + event.translationY, -maxTranslateY),
                maxTranslateY
            );
        })

    return (
        <GestureDetector gesture={pan}>
            <Animated.View style={[animatedStyles, styles.box]}></Animated.View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    box: {
        width: 100,
        height: 100,
        backgroundColor: '#b58df1',
        borderRadius: 20,
    },
});