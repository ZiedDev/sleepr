import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, interpolateColor, Extrapolation, Easing, SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

interface AnimationPlugin {
    val: SharedValue<number> | null;

    onUpdate?: (progress: number, delta: number) => number;
    onEnd?: (atEnd: boolean) => number;
    onReset?: () => number;
    onMorphButton?: () => number;
    onMorphThumb?: () => number;
}

interface MorphSliderProps {
    trackWidth?: number;
    trackHeight?: number;
    thumbSize?: number;
    buttonWidth?: number;
    padding?: number;

    trackColor?: string;
    trackText?: string; // TODO: add middle line text
    trackTextColor?: string;

    thumbColor?: string;
    thumbText?: string;
    thumbTextColor?: string;

    buttonColor?: string;
    buttonText?: string;
    buttonTextColor?: string;

    isInitialComplete?: boolean;
    endPercentage?: number;
    animationPlugins?: AnimationPlugin[];
}

export default function MorphSlider({
    trackWidth = 250,
    trackHeight = 64,
    thumbSize = 56,
    buttonWidth = 200,
    padding = 4,

    trackColor = "#222222",

    thumbColor = "#f0f8ff",
    thumbText = "➜",
    thumbTextColor = "#000",

    buttonColor = "#4caf50",
    buttonText = "Click Me",
    buttonTextColor = "#fff",

    isInitialComplete = false,
    endPercentage = 0.75,
    animationPlugins = [],
}: MorphSliderProps) {
    const [completed, setCompleted] = useState(isInitialComplete);
    const [atEnd, setAtEnd] = useState(isInitialComplete);

    const translateX = useSharedValue(Number(isInitialComplete));
    const morphWidth = useSharedValue(isInitialComplete ? buttonWidth : thumbSize);
    const isAnimFinish = useSharedValue(Number(isInitialComplete));

    const maxX = trackWidth - thumbSize - (padding * 2);

    const allPlugins = React.useMemo(() => {
        const internalPlugins: AnimationPlugin[] = [
            {
                val: translateX,
                onUpdate: (t, d) => {
                    'worklet';
                    const resistance = 1 - 0.00223888324365 * (Math.exp(3 * t) - 1);
                    return Math.max(0, Math.min(d * resistance, maxX));
                },
                onReset: () => { 'worklet'; return withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }) },
                onMorphButton: () => { 'worklet'; return withTiming(0, { easing: Easing.out(Easing.poly(3)) }) },
            }, {
                val: morphWidth,
                onMorphButton: () => { 'worklet'; return withTiming(buttonWidth, { easing: Easing.out(Easing.poly(3)) }) },
                onMorphThumb: () => { 'worklet'; return withTiming(thumbSize) },
            }, {
                val: isAnimFinish,
                onMorphButton: () => { 'worklet'; return withTiming(1, { duration: 50, easing: Easing.out(Easing.poly(4)) }) },
                onMorphThumb: () => { 'worklet'; return withTiming(0, { duration: 50, easing: Easing.out(Easing.poly(4)) }) },
            },
        ];

        return [...animationPlugins, ...internalPlugins];
    }, [animationPlugins]);

    // Callback triggers
    const triggerUpdate = (progress: number, delta: number) => {
        'worklet';

        for (let i = 0; i < allPlugins.length; i++) {
            const plugin = allPlugins[i];
            if (plugin.onUpdate) {
                if (plugin.val) {
                    plugin.val.value = plugin.onUpdate(progress, delta);
                }
                else
                    plugin.onUpdate(progress, delta);
            }
        }
    };

    const triggerEnd = (atEnd: boolean) => {
        'worklet';
        for (let i = 0; i < allPlugins.length; i++) {
            const plugin = allPlugins[i];
            if (plugin.onEnd) {
                if (plugin.val)
                    plugin.val.value = plugin.onEnd(atEnd);
                else
                    plugin.onEnd(atEnd);
            }
        }
    };

    const triggerReset = () => {
        'worklet';
        for (let i = 0; i < allPlugins.length; i++) {
            const plugin = allPlugins[i];
            if (plugin.onReset) {
                if (plugin.val)
                    plugin.val.value = plugin.onReset();
                else
                    plugin.onReset();
            }
        }
    };

    const triggerMorphButton = () => {
        'worklet';
        for (let i = 0; i < allPlugins.length; i++) {
            const plugin = allPlugins[i];
            if (plugin.onMorphButton) {
                if (plugin.val)
                    plugin.val.value = plugin.onMorphButton();
                else
                    plugin.onMorphButton();
            }
        }
    };

    const triggeronMorphThumb = () => {
        'worklet';
        for (let i = 0; i < allPlugins.length; i++) {
            const plugin = allPlugins[i];
            if (plugin.onMorphThumb) {
                if (plugin.val)
                    plugin.val.value = plugin.onMorphThumb();
                else
                    plugin.onMorphThumb();
            }
        }
    };

    // Gesture
    const pan = Gesture.Pan()
        .enabled(!completed)
        .minDistance(4)
        .onUpdate((event) => {
            const t = translateX.value / maxX;
            triggerUpdate(t, event.translationX);

            const a = translateX.value > maxX * endPercentage;
            if (atEnd != a) {
                scheduleOnRN(setAtEnd, a);
                triggerEnd(atEnd);
            }
        })
        .onEnd((event) => {
            if (translateX.value > maxX * endPercentage) {
                translateX.value = withTiming(maxX, {
                    duration: 200,
                    easing: Easing.out(Easing.back(1.8)),
                }, () => {
                    scheduleOnRN(setCompleted, true);
                    triggerMorphButton();
                });
            } else {
                triggerReset();
            }
        });

    // Animated Styles
    const animatedMorphStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
        width: morphWidth.value,
        backgroundColor: interpolateColor(
            morphWidth.value,
            [thumbSize, buttonWidth],
            [thumbColor, buttonColor]
        ),
    }));

    const thumbTextStyle = useAnimatedStyle(() => ({
        opacity: withTiming(isAnimFinish.value === 0 ? 1 : 0),
        color: interpolateColor(
            isAnimFinish.value,
            [0, 1],
            [thumbTextColor, buttonColor]
        )
    }));

    const buttonTextStyle = useAnimatedStyle(() => ({
        opacity: withTiming(isAnimFinish.value === 1 ? 1 : 0),
    }));

    const trackStyle = useAnimatedStyle(() => ({
        width: interpolate(
            morphWidth.value,
            [thumbSize, buttonWidth],
            [trackWidth, buttonWidth + padding * 2],
            Extrapolation.CLAMP
        )
    }));

    return (
        <Animated.View style={[
            styles.track,
            trackStyle,
            {
                height: trackHeight,
                backgroundColor: trackColor,
                borderRadius: trackHeight / 2,
                paddingHorizontal: padding
            }
        ]}>
            <GestureDetector gesture={pan}>
                <Pressable onPress={() => {
                    if (completed) {
                        scheduleOnRN(setCompleted, false);
                        triggeronMorphThumb();
                        scheduleOnRN(setAtEnd, false);
                        triggerEnd(atEnd);
                    }
                }}>
                    <Animated.View style={[
                        styles.morph,
                        animatedMorphStyle,
                        { height: thumbSize, borderRadius: thumbSize / 2 }
                    ]}>
                        <Animated.Text style={[styles.thumbText, thumbTextStyle]}>{thumbText}</Animated.Text>
                        <Animated.Text style={[
                            styles.buttonText,
                            buttonTextStyle,
                            { color: buttonTextColor }
                        ]}>{buttonText}</Animated.Text>
                    </Animated.View>
                </Pressable>
            </GestureDetector>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    track: {
        backgroundColor: "#222222",
        justifyContent: 'center',
        overflow: 'hidden',
    },
    morph: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumbText: {
        position: 'absolute',
        fontSize: 22,
    },
    buttonText: {
        position: 'absolute',
        fontSize: 18,
        fontWeight: '600',
    },
});