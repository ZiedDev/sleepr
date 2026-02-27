import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedProps, useSharedValue, useAnimatedStyle, SharedValue } from 'react-native-reanimated';
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
    quantize?: boolean;

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
    quantize = true,

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

    const absoluteAngleDelta = (from: number, to: number) => {
        'worklet';
        let diff = to - from;
        diff = (diff + 2 * Math.PI) % (2 * Math.PI);
        return (diff < 1e-10 || Math.abs(diff - 2 * Math.PI) < 1e-10) ? 0 : diff;
    };

    const signedAngleDelta = (from: number, to: number) => {
        'worklet';
        const diffP = absoluteAngleDelta(from, to);
        const diffN = absoluteAngleDelta(to, from);
        let diff = diffP < diffN ? diffP : -diffN;
        diff = (diff + Math.PI) % (2 * Math.PI) - Math.PI;
        return diff;
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
            if (activeKnob.value == null) return;
            const x = event.x - CENTER;
            const y = event.y - CENTER;

            const dist = Math.hypot(x, y);

            let fingerAngle = Math.atan2(y, x);
            if (fingerAngle < 0) fingerAngle += 2 * Math.PI;

            const delta = signedAngleDelta(startAngle.value, fingerAngle);
            const gain = dist < RADIUS * 0.5 ? dist / RADIUS / 2 : 1;

            const angle = startAngle.value + delta * gain;
            const quantizedAngle = quantize ? Math.round(angle / step) * step : angle;
            const normalizedAngle = (quantizedAngle + 2 * Math.PI) % (2 * Math.PI);

            if (normalizedAngle !== startAngle.value) {
                startAngle.value = normalizedAngle;
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

    const ticks = tickOptions ? React.useMemo(
        () => buildTicks(RADIUS, CENTER, step, tickOptions),
        [RADIUS, CENTER, step, tickOptions]
    ) : null;

    return (
        <GestureDetector gesture={pan}>
            <View style={[{ width: size, height: size }, style]}>
                <Svg width={size} height={size}>
                    {/* Track */}
                    <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke={trackColor} strokeWidth={trackWidth} fill="none" />

                    {/* Ticks */}
                    {ticks && ticks.map(t => (
                        <Line
                            key={t.key}
                            x1={t.x1}
                            y1={t.y1}
                            x2={t.x2}
                            y2={t.y2}
                            stroke={t.color}
                            strokeWidth={2}
                            strokeLinecap="round"
                        />
                    ))}

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

const buildTicks = (
    radius: number, center: number, step: number,
    tickOptions: { div: number; length: number; color: string; }[]
) => {
    const total = Math.round((2 * Math.PI) / step);
    const lines = [];

    for (let i = 0; i < total; i++) {
        const option = tickOptions.find(o => i % o.div === 0);
        if (!option) continue;

        const angle = i * step;

        const outerR = radius + option.length / 2;
        const innerR = radius - option.length / 2;

        lines.push({
            key: `tick-${i}`,
            x1: center + innerR * Math.cos(angle),
            y1: center + innerR * Math.sin(angle),
            x2: center + outerR * Math.cos(angle),
            y2: center + outerR * Math.sin(angle),
            color: option.color
        });
    }

    return lines;
};

const styles = StyleSheet.create({

});