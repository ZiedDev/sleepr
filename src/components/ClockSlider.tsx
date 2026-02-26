import React from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedProps, useSharedValue, runOnJS, useAnimatedStyle } from 'react-native-reanimated';
import PhMoonBold from '../../assets/svgs/PhMoonBold';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const SIZE = width * 0.5;
const RADIUS = SIZE / 2 - 20;
const CENTER = SIZE / 2;
const TOUCH_SLOP = 10;
const HANDLE_RADIUS = 15;
const TICK_LENGTH = 10;
const STEP = (2 * Math.PI) / (12 * 60) * 30;// 30 minute increments
const MIN_DIFF_FORWARD = 2 * STEP;
const MIN_DIFF_BACKWARD = 4 * STEP;

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
        if (onValueChange) runOnJS(onValueChange)(s, e);
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    };

    const polarToXY = (angle: number) => {
        'worklet';
        return { x: CENTER + RADIUS * Math.cos(angle), y: CENTER + RADIUS * Math.sin(angle) };
    };

    const angleDiff = (angle1: number, angle2: number) => {
        'worklet';
        let diff = angle2 - angle1;
        diff = (diff + 2 * Math.PI) % (2 * Math.PI);
        return (diff < 1e-10 || Math.abs(diff - 2 * Math.PI) < 1e-10) ? 0 : diff;
    };

    const pan = Gesture.Pan()
        .onStart((event) => {
            const x = event.x;
            const y = event.y;

            const { x: startX, y: startY } = polarToXY(startAngle.value);
            if (Math.hypot(event.x - startX, y - startY) < HANDLE_RADIUS + TOUCH_SLOP) {
                activeKnob.value = 'start';
                return;
            }

            const { x: endX, y: endY } = polarToXY(endAngle.value);
            if (Math.hypot(event.x - endX, y - endY) < HANDLE_RADIUS + TOUCH_SLOP) {
                activeKnob.value = 'end';
                return;
            }
        })
        .onUpdate((event) => {
            const x = event.x - CENTER;
            const y = event.y - CENTER;
            let angle = Math.atan2(y, x);
            if (angle < 0) angle += (2 * Math.PI);

            const quantizedAngle = Math.round(angle / STEP) * STEP;


            if (activeKnob.value == 'start' && quantizedAngle % (2 * Math.PI) !== startAngle.value % (2 * Math.PI)) {
                const direction = angleDiff(startAngle.value, quantizedAngle) <= Math.PI;

                if (direction) {
                    const diff = angleDiff(quantizedAngle, endAngle.value);
                    if (diff < MIN_DIFF_FORWARD) endAngle.value = quantizedAngle + MIN_DIFF_FORWARD;
                } else {
                    const diff = angleDiff(endAngle.value, quantizedAngle);
                    if (diff < MIN_DIFF_BACKWARD) endAngle.value = quantizedAngle - MIN_DIFF_BACKWARD;
                }

                startAngle.value = quantizedAngle;
                handleUpdate(startAngle.value, endAngle.value);
            }
            if (activeKnob.value == 'end' && quantizedAngle % (2 * Math.PI) !== endAngle.value % (2 * Math.PI)) {
                const direction = angleDiff(endAngle.value, quantizedAngle) <= Math.PI;

                if (direction) {
                    const diff = angleDiff(quantizedAngle, startAngle.value);
                    if (diff < MIN_DIFF_BACKWARD) startAngle.value = quantizedAngle + MIN_DIFF_BACKWARD;
                } else {
                    const diff = angleDiff(startAngle.value, quantizedAngle);
                    if (diff < MIN_DIFF_FORWARD) startAngle.value = quantizedAngle - MIN_DIFF_FORWARD;
                }

                endAngle.value = quantizedAngle;
                handleUpdate(startAngle.value, endAngle.value);
            }
        })
        .onEnd(() => {
            activeKnob.value = null;
        });


    const startKnobProps = useAnimatedProps(() => {
        const { x, y } = polarToXY(startAngle.value);
        return { cx: x, cy: y };
    });

    const startIconProps = useAnimatedStyle(() => {
        const { x, y } = polarToXY(startAngle.value);
        return { transform: [{ translateX: x - 25 / 2 }, { translateY: y - 25 / 2 }] };
    });

    const endKnobProps = useAnimatedProps(() => {
        const { x, y } = polarToXY(endAngle.value);
        return { cx: x, cy: y };
    });

    const endIconProps = useAnimatedStyle(() => {
        const { x, y } = polarToXY(startAngle.value);
        return { transform: [{ translateX: x }, { translateY: y }] };
    });

    const arcProps = useAnimatedProps(() => {
        const { x: startX, y: startY } = polarToXY(startAngle.value);
        const { x: endX, y: endY } = polarToXY(endAngle.value);
        const largeArc = angleDiff(startAngle.value, endAngle.value) > Math.PI ? 1 : 0;

        return { d: `M ${startX} ${startY} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${endX} ${endY}` };
    });

    return (
        <GestureDetector gesture={pan}>
            <View style={{ width: SIZE, height: SIZE }}>
                <Svg width={SIZE} height={SIZE}>
                    {/* Track */}
                    <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke="#222" strokeWidth={30} fill="none" />

                    {/* Ticks */}
                    {renderTicks()}

                    {/* Arc */}
                    <AnimatedPath animatedProps={arcProps} stroke="#f19848" strokeWidth={30} fill="none" />

                    {/* Start Knob */}
                    <AnimatedCircle animatedProps={startKnobProps} r={HANDLE_RADIUS} fill="#ee872d" />
                    <Animated.View style={startIconProps}>
                        <Svg width={25} height={25} viewBox="0 0 256 256">
                            <Path fill="#812812" d="M236.37 139.4a12 12 0 0 0-12-3A84.07 84.07 0 0 1 119.6 31.59a12 12 0 0 0-15-15a108.86 108.86 0 0 0-54.91 38.48A108 108 0 0 0 136 228a107.1 107.1 0 0 0 64.93-21.69a108.86 108.86 0 0 0 38.44-54.94a12 12 0 0 0-3-11.97m-49.88 47.74A84 84 0 0 1 68.86 69.51a84.9 84.9 0 0 1 23.41-21.22Q92 52.13 92 56a108.12 108.12 0 0 0 108 108q3.87 0 7.71-.27a84.8 84.8 0 0 1-21.22 23.41" />
                        </Svg>
                    </Animated.View>

                    {/* End Knob */}
                    <AnimatedCircle animatedProps={endKnobProps} r={HANDLE_RADIUS} fill="#ee872d" />
                </Svg>
            </View>
        </GestureDetector>
    );
};

const renderTicks = () => {
    const ticks = [];

    for (let i = 0; i < Math.round((2 * Math.PI) / STEP); i++) {
        const angle = i * STEP;

        const outerRadius = RADIUS + TICK_LENGTH / 2;
        const outerX = CENTER + outerRadius * Math.cos(angle);
        const outerY = CENTER + outerRadius * Math.sin(angle);

        const innerRadius = RADIUS - TICK_LENGTH / 2;
        const innerX = CENTER + innerRadius * Math.cos(angle);
        const innerY = CENTER + innerRadius * Math.sin(angle);

        ticks.push(
            <Line
                key={`tick-${i}`}
                x1={innerX}
                y1={innerY}
                x2={outerX}
                y2={outerY}
                stroke="#444"
                strokeWidth={2}
                strokeLinecap="round"
            />
        );
    }

    return ticks;
};

const styles = StyleSheet.create({

});