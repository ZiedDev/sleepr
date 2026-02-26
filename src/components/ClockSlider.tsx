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
const TOUCH_SLOP = 10;
const HANDLE_RADIUS = 15;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ClockSlider({ mode, onValueChange }: {
    mode: 'range' | 'single' | 'locked';
    onValueChange?: (start: number, end?: number) => void;
}) {
    // rad 0 -> 2*PI clockwise from positive x-axis
    const startAngle = useSharedValue(Math.PI * 1.5);
    const endAngle = useSharedValue(Math.PI * 0.5);

    const activeKnob = useSharedValue<'start' | 'end' | null>(null);

    const handleUpdate = (s: number, e: number) => {
        'worklet';
        if (onValueChange) scheduleOnRN(() => onValueChange(s, e));
        scheduleOnRN(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    };

    const polarToXY = (angle: number) => {
        'worklet';
        return { x: CENTER + RADIUS * Math.cos(angle), y: CENTER + RADIUS * Math.sin(angle) };
    };

    const pan = Gesture.Pan()
        .enabled(mode !== 'locked')
        .onStart((event) => {
            const x = event.x;
            const y = event.y;

            const { x: startX, y: startY } = polarToXY(startAngle.value);
            if (Math.hypot(event.x - startX, y - startY) < HANDLE_RADIUS + TOUCH_SLOP) {
                activeKnob.value = 'start';
                return;
            }

            if (mode === 'range') {
                const { x: endX, y: endY } = polarToXY(endAngle.value);
                if (Math.hypot(event.x - endX, y - endY) < HANDLE_RADIUS + TOUCH_SLOP) {
                    activeKnob.value = 'end';
                    return;
                }
            }
        })
        .onUpdate((event) => {
            const x = event.x - CENTER;
            const y = event.y - CENTER;
            let angle = Math.atan2(y, x);
            if (angle < 0) angle += (2 * Math.PI);

            const step = (2 * Math.PI) / (24 * 60 / 120);// 30 minute increments
            const quantizedAngle = Math.round(angle / step) * step;

            // TODO: onStart if single

            if (activeKnob.value == 'start' && quantizedAngle !== startAngle.value) startAngle.value = quantizedAngle;
            if (activeKnob.value == 'end' && quantizedAngle !== endAngle.value) endAngle.value = quantizedAngle;
            // if (quantizedAngle !== startAngle.value) {
            //     // console.log(angle, quantizedAngle);
            //     startAngle.value = quantizedAngle;
            //     // handleUpdate(startAngle.value, endAngle.value);
            // }
        })
        .onEnd(() => {
            activeKnob.value = null;
        });


    const startKnobProps = useAnimatedProps(() => {
        const { x, y } = polarToXY(startAngle.value);
        return { cx: x, cy: y };
    });

    const endKnobProps = useAnimatedProps(() => {
        const { x, y } = polarToXY(endAngle.value);
        return { cx: x, cy: y };
    });

    const arcProps = useAnimatedProps(() => ({

    }));

    return (
        <GestureDetector gesture={pan}>
            <View style={{ width: SIZE, height: SIZE }}>
                <Svg width={SIZE} height={SIZE}>
                    {/* Background Track */}
                    <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke="#222" strokeWidth={30} fill="none" />

                    {/* Start Knob */}
                    <AnimatedCircle
                        animatedProps={startKnobProps}
                        r={HANDLE_RADIUS} fill="white"
                    />

                    {/* End Knob */}
                    {mode === 'range' && (
                        <AnimatedCircle
                            animatedProps={endKnobProps}
                            r={HANDLE_RADIUS} fill="#6f6f6f"
                        />
                    )}
                </Svg>
            </View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({

});