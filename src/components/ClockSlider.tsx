import React from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedProps, useSharedValue, SharedValue, useAnimatedStyle, withTiming, Easing, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { scheduleOnRN } from 'react-native-worklets';

const { width, height } = Dimensions.get('window');
const SIZE = width * 0.5;
const RADIUS = SIZE / 2 - 20;
const CENTER = SIZE / 2;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

export default function ClockSlider({ mode, onValueChange }: {
    mode: 'range' | 'single' | 'locked';
    onValueChange?: (start: number, end?: number) => void;
}) {
    // rad 0 -> 2*PI clockwise from positive x-axis
    const startAngle = useSharedValue(Math.PI * 1.5);
    const endAngle = useSharedValue(Math.PI * 0.5);

    const handleUpdate = (s: number, e: number) => {
        'worklet';
        if (onValueChange) scheduleOnRN(() => onValueChange(s, e));
        scheduleOnRN(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    };

    const pan = Gesture.Pan()
        .onUpdate((event) => {
            const x = event.x - CENTER;
            const y = event.y - CENTER;
            let angle = Math.atan2(y, x);
            startAngle.value = angle;
            console.log(angle)
        })

    const animatedProps = useAnimatedProps(() => ({
        cx: CENTER + RADIUS * Math.cos(startAngle.value),
        cy: CENTER + RADIUS * Math.sin(startAngle.value),
    }));

    return (
        <GestureDetector gesture={pan}>
            <View style={{ width: SIZE, height: SIZE }}>
                <Svg width={SIZE} height={SIZE}>
                    <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke="#222" strokeWidth={30} fill="none" />
                    <AnimatedCircle
                        animatedProps={animatedProps}
                        r={15} fill="white"
                    />
                </Svg>
            </View>
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