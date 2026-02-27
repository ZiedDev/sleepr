import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedProps, useSharedValue, runOnJS, useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { scheduleOnRN } from 'react-native-worklets';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ClockSliderProps {
    // rad 0 -> 2*PI clockwise from positive x-axis
    startAngle?: SharedValue<number>;
    onValueChange?: (start: number) => void;
    onValueSet?: (start: number) => void;

    startIcon?: React.ReactNode;
    iconSize?: number;

    step?: number;

    size: number;
    touchSlop?: number;
    knobRadius?: number;
    trackWidth?: number;
    tickOptions?: {
        div: number;
        length: number;
        color: string;
    }[];

    trackColor?: string;
    tickColor?: string;
    startKnobColor?: string;

    style?: StyleProp<ViewStyle>;
}

export default function ClockSlider({
    startAngle = useSharedValue(Math.PI * 1.5),
    onValueChange,
    onValueSet,

    startIcon,
    iconSize = 25,

    step = (2 * Math.PI) / (12 * 60) * 30, // 30 minute increments

    size,
    touchSlop = 10,
    knobRadius = 15,
    trackWidth = 30,
    tickOptions = [
        { div: 4, length: 14, color: "#444444ff" },
        { div: 2, length: 8, color: "#44444499" },
        { div: 1, length: 4, color: "#44444499" }
    ],

    trackColor = "#222",
    startKnobColor = "#ee872d",

    style,
}: ClockSliderProps) {
    const RADIUS = size / 2 - 20;
    const CENTER = size / 2;

    const activeKnob = useSharedValue<'start' | null>(null);

    const handleUpdate = (s: number) => {
        'worklet';
        if (onValueChange) scheduleOnRN(onValueChange, s);
        scheduleOnRN(Haptics.selectionAsync);
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
            const x = event.x - CENTER;
            const y = event.y - CENTER;

            const dist = Math.hypot(x, y);

            if ((dist < RADIUS - trackWidth / 2 - touchSlop / 2) ||
                (dist > RADIUS + trackWidth / 2 + touchSlop / 2)) return;

            const { x: startX, y: startY } = polarToXY(startAngle.value);
            if (Math.hypot(event.x - startX, event.y - startY) < knobRadius + touchSlop) {
                activeKnob.value = 'start';
                return;
            }
        })
        .onUpdate((event) => {
            const x = event.x - CENTER;
            const y = event.y - CENTER;
            let angle = Math.atan2(y, x);
            if (angle < 0) angle += (2 * Math.PI);

            const quantizedAngle = Math.round(angle / step) * step;


            if (activeKnob.value == 'start' && quantizedAngle % (2 * Math.PI) !== startAngle.value % (2 * Math.PI)) {
                startAngle.value = quantizedAngle;
                handleUpdate(startAngle.value);
            }
        })
        .onEnd(() => {
            activeKnob.value = null;
            if (onValueSet) scheduleOnRN(onValueSet, startAngle.value);
        });


    const startKnobProps = useAnimatedProps(() => {
        const { x, y } = polarToXY(startAngle.value);
        return { cx: x, cy: y };
    });

    const startIconProps = useAnimatedStyle(() => {
        const { x, y } = polarToXY(startAngle.value);
        return {
            position: 'absolute',
            left: x - iconSize / 2,
            top: y - iconSize / 2,
            width: iconSize,
            height: iconSize,
        };
    });

    return (
        <GestureDetector gesture={pan}>
            <View style={[{ width: size, height: size }, style]}>
                <Svg width={size} height={size}>
                    {/* Track */}
                    <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke={trackColor} strokeWidth={trackWidth} fill="none" />

                    {/* Ticks */}
                    {Array.from({ length: Math.round((2 * Math.PI) / step) }).map((_, i) => {
                        const angle = i * step;
                        const option = tickOptions.find(option => i % option.div === 0);
                        if (!option) return;

                        const outerRadius = RADIUS + option.length / 2;
                        const outerX = CENTER + outerRadius * Math.cos(angle);
                        const outerY = CENTER + outerRadius * Math.sin(angle);

                        const innerRadius = RADIUS - option.length / 2;
                        const innerX = CENTER + innerRadius * Math.cos(angle);
                        const innerY = CENTER + innerRadius * Math.sin(angle);

                        return (
                            <Line
                                key={`tick-${i}`}
                                x1={innerX}
                                y1={innerY}
                                x2={outerX}
                                y2={outerY}
                                stroke={option.color}
                                strokeWidth={2}
                                strokeLinecap="round"
                            />
                        );
                    })}

                    {/* Start Knob */}
                    <AnimatedCircle animatedProps={startKnobProps} r={knobRadius} fill={startKnobColor} />
                </Svg>

                {/* Start Icon */}
                {startIcon && (
                    <Animated.View style={startIconProps}>
                        {startIcon}
                    </Animated.View>
                )}
            </View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({

});