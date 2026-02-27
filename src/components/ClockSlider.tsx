import React from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedProps, useSharedValue, runOnJS, useAnimatedStyle, SharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ClockSliderProps {
    // rad 0 -> 2*PI clockwise from positive x-axis
    startAngle?: SharedValue<number>;
    endAngle?: SharedValue<number>;
    onValueChange?: (start: number, end: number) => void;

    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    iconSize?: number;

    step?: number;
    forwardDifference?: number;
    backwardDifference?: number;

    size: number;
    touchSlop?: number;
    knobRadius?: number;
    trackWidth?: number;
    arcWidth?: number;
    tickOptions?: {
        div: number;
        length: number;
        color: string;
    }[];

    trackColor?: string;
    tickColor?: string;
    arcColor?: string;
    startKnobColor?: string;
    endKnobColor?: string;
}

export default function ClockSlider({
    startAngle = useSharedValue(Math.PI * 1.5),
    endAngle = useSharedValue(Math.PI * 0.5),
    onValueChange,

    startIcon,
    endIcon,
    iconSize = 25,

    step = (2 * Math.PI) / (12 * 60) * 30, // 30 minute increments
    forwardDifference = 2,
    backwardDifference = 4,

    size,
    touchSlop = 10,
    knobRadius = 15,
    trackWidth = 30,
    arcWidth = 30,
    tickOptions = [
        { div: 4, length: 14, color: "#444444ff" },
        { div: 2, length: 8, color: "#44444499" },
        { div: 1, length: 4, color: "#44444499" }
    ],

    trackColor = "#222",
    arcColor = "#f19848",
    startKnobColor = "#ee872d",
    endKnobColor = "#ee872d",
}: ClockSliderProps) {
    const RADIUS = size / 2 - 20;
    const CENTER = size / 2;
    const MIN_DIFF_FORWARD = forwardDifference * step;
    const MIN_DIFF_BACKWARD = backwardDifference * step;

    const activeKnob = useSharedValue<'start' | 'end' | 'middle' | null>(null);
    const midAngle = useSharedValue<number>(0);

    const handleUpdate = (s: number, e: number) => {
        'worklet';
        if (onValueChange) runOnJS(onValueChange)(s, e);
        runOnJS(Haptics.selectionAsync)();
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

            const { x: endX, y: endY } = polarToXY(endAngle.value);
            if (Math.hypot(event.x - endX, event.y - endY) < knobRadius + touchSlop) {
                activeKnob.value = 'end';
                return;
            }

            let angle = Math.atan2(y, x);
            if (angle < 0) angle += (2 * Math.PI);

            if (angleDiff(startAngle.value, angle) < angleDiff(startAngle.value, endAngle.value)) {
                activeKnob.value = 'middle';
                const quantizedAngle = Math.round(angle / step) * step;
                midAngle.value = quantizedAngle;
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
            else if (activeKnob.value == 'end' && quantizedAngle % (2 * Math.PI) !== endAngle.value % (2 * Math.PI)) {
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
            else if (activeKnob.value == 'middle' && quantizedAngle % (2 * Math.PI) !== midAngle.value % (2 * Math.PI)) {
                const diff = angleDiff(midAngle.value, quantizedAngle);
                const direction = diff <= Math.PI ? 1 : -1;
                const v = direction * Math.min(diff, angleDiff(quantizedAngle, midAngle.value))

                startAngle.value += v;
                endAngle.value += v;
                midAngle.value = quantizedAngle;
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
        return {
            position: 'absolute',
            left: x - iconSize / 2,
            top: y - iconSize / 2,
            width: iconSize,
            height: iconSize,
        };
    });

    const endKnobProps = useAnimatedProps(() => {
        const { x, y } = polarToXY(endAngle.value);
        return { cx: x, cy: y };
    });

    const endIconProps = useAnimatedStyle(() => {
        const { x, y } = polarToXY(endAngle.value);
        return {
            position: 'absolute',
            left: x - iconSize / 2,
            top: y - iconSize / 2,
            width: iconSize,
            height: iconSize,
        };
    });

    const arcProps = useAnimatedProps(() => {
        const { x: startX, y: startY } = polarToXY(startAngle.value);
        const { x: endX, y: endY } = polarToXY(endAngle.value);
        const largeArc = angleDiff(startAngle.value, endAngle.value) > Math.PI ? 1 : 0;

        return { d: `M ${startX} ${startY} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${endX} ${endY}` };
    });

    return (
        <GestureDetector gesture={pan}>
            <View style={{ width: size, height: size }}>
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

                    {/* Arc */}
                    <AnimatedPath animatedProps={arcProps} stroke={arcColor} strokeWidth={arcWidth} fill="none" />

                    {/* Start Knob */}
                    <AnimatedCircle animatedProps={startKnobProps} r={knobRadius} fill={startKnobColor} />

                    {/* End Knob */}
                    <AnimatedCircle animatedProps={endKnobProps} r={knobRadius} fill={endKnobColor} />
                </Svg>

                {/* Start Icon */}
                {startIcon && (
                    <Animated.View style={startIconProps}>
                        {startIcon}
                    </Animated.View>
                )}

                {/* End Icon */}
                {endIcon && (
                    <Animated.View style={endIconProps}>
                        {endIcon}
                    </Animated.View>
                )}
            </View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({

});