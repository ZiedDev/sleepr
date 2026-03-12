import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedProps, useSharedValue, useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { scheduleOnRN } from 'react-native-worklets';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ClockSliderProps {
    // Mode
    size: number;
    mode: 'single' | 'range';
    locked?: boolean;

    // Updates
    onValueChange?: (start: number, end: number) => void;
    onValueSet?: (start: number, end: number) => void;

    // Knobs
    touchSlop?: number;
    knobRadius?: number;
    targetKnobRadius?: number;
    iconSize?: number;

    startAngle?: SharedValue<number>; // rad 0 -> 2*PI clockwise from positive x-axis
    startColor?: string;
    startIcon?: React.ReactNode;

    endAngle?: SharedValue<number>;
    endColor?: string;
    endIcon?: React.ReactNode;

    startTargetAngle?: number | null;
    startTargetColor?: string;
    startTargetIcon?: React.ReactNode;

    endTargetAngle?: number | null;
    endTargetColor?: string;
    endTargetIcon?: React.ReactNode;

    // Arc
    arcWidth?: number;
    arcColor?: string;

    arcTargetWidth?: number;
    arcTargetColor?: string;

    // Track
    trackWidth?: number;
    trackColor?: string;
    tickOptions?: {
        div: number;
        length: number;
        color: string;
    }[];

    // Movement
    step?: number;
    quantize?: boolean;
    forwardDifference?: number;
    backwardDifference?: number;
    phaseAngle?: number;

    style?: StyleProp<ViewStyle>;
}

export default function ClockSlider({
    size,
    mode,
    locked = false,

    onValueChange,
    onValueSet,

    touchSlop = 20,
    knobRadius = 15,
    targetKnobRadius = 0,
    iconSize = 25,

    startAngle = useSharedValue(Math.PI * 1.5),
    startColor = "#ee882f",
    startIcon,

    endAngle = useSharedValue(Math.PI * 0.5),
    endColor = "#ee882f",
    endIcon,

    startTargetAngle = null,
    startTargetColor = "#2f7cee",
    startTargetIcon,

    endTargetAngle = null,
    endTargetColor = "#2f7cee",
    endTargetIcon,

    arcWidth = 30,
    arcColor = "#f19646",

    arcTargetWidth = 10,
    arcTargetColor = "#468af1cc",

    trackWidth = 30,
    trackColor = "#222",
    tickOptions = [
        { div: 4, length: 14, color: "#444444ff" },
        { div: 2, length: 8, color: "#44444499" },
        { div: 1, length: 4, color: "#44444499" }
    ],

    step = (2 * Math.PI) / (12 * 60) * 30, // 30 minute increments
    quantize = true,
    forwardDifference = 2,
    backwardDifference = 4,
    phaseAngle = Math.PI / 2,

    style,
}: ClockSliderProps) {
    const RADIUS = size / 2 - 20;
    const CENTER = size / 2;
    const MIN_DIFF_FORWARD = forwardDifference * step;
    const MIN_DIFF_BACKWARD = backwardDifference * step;

    const activeKnob = useSharedValue<'start' | 'end' | 'middle' | null>(null);
    const midAngle = useSharedValue<number>(0);

    // Helpers
    const handleUpdate = (s: number, e: number) => {
        'worklet';
        if (onValueChange) scheduleOnRN(onValueChange, s, e);
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

    // Gesture
    const pan = Gesture.Pan()
        .enabled(!locked)
        .manualActivation(true)
        .onTouchesDown((event, stateManager) => {
            const x = event.allTouches[0].x;
            const y = event.allTouches[0].y;

            const dist = Math.hypot(x - CENTER, y - CENTER);

            if ((dist < RADIUS - trackWidth / 2 - touchSlop / 2) ||
                (dist > RADIUS + trackWidth / 2 + touchSlop / 2)) return;

            const { x: startX, y: startY } = polarToXY(startAngle.value);
            if (Math.hypot(x - startX, y - startY) < knobRadius + touchSlop) {
                activeKnob.value = 'start';
                stateManager.activate();
                return;
            }

            if (mode === 'single') return;

            const { x: endX, y: endY } = polarToXY(endAngle.value);
            if (Math.hypot(x - endX, y - endY) < knobRadius + touchSlop) {
                activeKnob.value = 'end';
                stateManager.activate();
                return;
            }

            let angle = Math.atan2(y - CENTER, x - CENTER);
            if (angle < 0) angle += (2 * Math.PI);

            if (absoluteAngleDelta(startAngle.value, angle) <
                absoluteAngleDelta(startAngle.value, endAngle.value)) {
                activeKnob.value = 'middle';
                const quantizedAngle = Math.round(angle / step) * step;
                midAngle.value = quantizedAngle;
                stateManager.activate();
                return;
            }
        })
        .onUpdate((event) => {
            if (activeKnob.value == null) return;
            const x = event.x - CENTER;
            const y = event.y - CENTER;

            const dist = Math.hypot(x, y);
            const gain = dist < RADIUS * 0.5 ? dist / RADIUS / 2 : 1;

            let fingerAngle = Math.atan2(y, x);
            if (fingerAngle < 0) fingerAngle += 2 * Math.PI;

            if (activeKnob.value == 'start') {
                const delta = signedAngleDelta(startAngle.value, fingerAngle);

                const angle = startAngle.value + delta * gain;
                const quantizedAngle = quantize ? Math.round(angle / step) * step : angle;
                const normalizedAngle = (quantizedAngle + 2 * Math.PI) % (2 * Math.PI);

                if (normalizedAngle !== startAngle.value) {
                    if (mode === 'range') {
                        const arcLength = Math.min(Math.max(
                            absoluteAngleDelta(normalizedAngle, endAngle.value)
                            , MIN_DIFF_FORWARD)
                            , 2 * Math.PI - MIN_DIFF_BACKWARD);

                        endAngle.value = (normalizedAngle + arcLength) % (2 * Math.PI);
                    }

                    startAngle.value = normalizedAngle;
                    handleUpdate(startAngle.value, endAngle.value);
                }
            }
            else if (mode === 'single') return;
            else if (activeKnob.value == 'end') {
                const delta = signedAngleDelta(endAngle.value, fingerAngle);

                const angle = endAngle.value + delta * gain;
                const quantizedAngle = quantize ? Math.round(angle / step) * step : angle;
                const normalizedAngle = (quantizedAngle + 2 * Math.PI) % (2 * Math.PI);

                if (normalizedAngle !== endAngle.value) {
                    const arcLength = Math.min(Math.max(
                        absoluteAngleDelta(startAngle.value, normalizedAngle)
                        , MIN_DIFF_FORWARD)
                        , 2 * Math.PI - MIN_DIFF_BACKWARD);

                    startAngle.value = (normalizedAngle - arcLength + 2 * Math.PI) % (2 * Math.PI);

                    endAngle.value = normalizedAngle;
                    handleUpdate(startAngle.value, endAngle.value);
                }
            }
            else if (activeKnob.value == 'middle') {
                const delta = signedAngleDelta(midAngle.value, fingerAngle);

                const angle = midAngle.value + delta * gain;
                const quantizedAngle = quantize ? Math.round(angle / step) * step : angle;
                const normalizedAngle = (quantizedAngle + 2 * Math.PI) % (2 * Math.PI);

                const diff = signedAngleDelta(midAngle.value, normalizedAngle);
                if (diff !== 0) {
                    startAngle.value = (startAngle.value + diff) % (2 * Math.PI);
                    endAngle.value = (endAngle.value + diff) % (2 * Math.PI);
                    midAngle.value = normalizedAngle;
                    handleUpdate(startAngle.value, endAngle.value);
                }
            }
        })
        .onEnd(() => {
            activeKnob.value = null;
            if (onValueSet) scheduleOnRN(onValueSet, startAngle.value, endAngle.value);
        });


    // Props
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
        const largeArc = absoluteAngleDelta(startAngle.value, endAngle.value) > Math.PI ? 1 : 0;

        return { d: `M ${startX} ${startY} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${endX} ${endY}` };
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

                    {/* Arc */}
                    {mode === 'range' &&
                        <AnimatedPath animatedProps={arcProps} stroke={arcColor} strokeWidth={arcWidth} strokeLinecap="round" fill="none" />
                    }

                    {/* Start Knob */}
                    <AnimatedCircle animatedProps={startKnobProps} r={knobRadius} fill={startColor} />

                    {/* End Knob */}
                    {mode === 'range' &&
                        <AnimatedCircle animatedProps={endKnobProps} r={knobRadius} fill={endColor} />
                    }

                    {/* Target Arc */}
                    {mode === 'range' && startTargetAngle && endTargetAngle &&
                        <Path
                            {...(() => {
                                const { x: startX, y: startY } = polarToXY(startTargetAngle);
                                const { x: endX, y: endY } = polarToXY(endTargetAngle);
                                const largeArc = absoluteAngleDelta(startTargetAngle, endTargetAngle) > Math.PI ? 1 : 0;

                                return { d: `M ${startX} ${startY} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${endX} ${endY}` };
                            })()}
                            stroke={arcTargetColor} strokeWidth={arcTargetWidth} strokeLinecap="round" fill="none"
                        />
                    }

                    {/* Target Start Knob */}
                    {startTargetAngle &&
                        <AnimatedCircle
                            {...((p) => ({ cx: p.x, cy: p.y }))(polarToXY(startTargetAngle))}
                            r={targetKnobRadius} fill={startTargetColor}
                        />
                    }

                    {/* Target End Knob */}
                    {mode === 'range' && endTargetAngle &&
                        <AnimatedCircle
                            {...((p) => ({ cx: p.x, cy: p.y }))(polarToXY(endTargetAngle))}
                            r={targetKnobRadius} fill={endTargetColor}
                        />
                    }
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

                {/* Start Target Icon */}
                {startTargetAngle && startTargetIcon && (
                    <View style={(() => {
                        const { x, y } = polarToXY(startTargetAngle);
                        return {
                            position: 'absolute',
                            left: x - iconSize / 2,
                            top: y - iconSize / 2,
                            width: iconSize,
                            height: iconSize,
                        };
                    })()}>
                        {startTargetIcon}
                    </View>
                )}

                {/* End Target Icon */}
                {mode === 'range' && endTargetAngle && endTargetIcon && (
                    <View style={(() => {
                        const { x, y } = polarToXY(endTargetAngle);
                        return {
                            position: 'absolute',
                            left: x - iconSize / 2,
                            top: y - iconSize / 2,
                            width: iconSize,
                            height: iconSize,
                        };
                    })()}>
                        {endTargetIcon}
                    </View>
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