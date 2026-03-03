import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, interpolateColor, Extrapolation, Easing, SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { scheduleOnRN } from 'react-native-worklets';

interface MorphSliderProps {
    trackWidth?: number;
    trackHeight?: number;
    thumbSize?: number;
    buttonWidth?: number;
    padding?: number;

    trackColor?: string;
    thumbColor?: string;
    thumbTextColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;

    thumbText?: string;
    buttonText?: string;

    onComplete?: () => void;
    onReset?: () => void;

    isInitialComplete?: boolean;
    progress?:SharedValue<number>;
}

export default function MorphSlider({
    trackWidth = 320,
    trackHeight = 64,
    thumbSize = 56,
    buttonWidth = 200,
    padding = 4,

    trackColor = "#222222",
    thumbColor = "#f0f8ff",
    thumbTextColor = "#000",
    buttonColor = "#4caf50",
    buttonTextColor = "#fff",

    thumbText = "➜",
    buttonText = "Click Me",

    onComplete,
    onReset,

    isInitialComplete = false,
    progress = useSharedValue(Number(isInitialComplete)),

}: MorphSliderProps) {
    const [completed, setCompleted] = useState(isInitialComplete);

    const translateX = useSharedValue(Number(isInitialComplete));
    const morphWidth = useSharedValue(isInitialComplete ? buttonWidth : thumbSize);
    const inAnimFinish = useSharedValue(Number(isInitialComplete));

    const maxX = trackWidth - thumbSize - (padding * 2);

    const resetSlider = () => {
        'worklet';
        translateX.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
        progress.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.cubic) });
    };

    const morphToButton = () => {
        'worklet';
        translateX.value = withTiming(maxX, {
            duration: 200,
            easing: Easing.out(Easing.back(1.8)),
        }, () => {
            translateX.value = withTiming(0, { easing: Easing.out(Easing.poly(3)) });
            morphWidth.value = withTiming(buttonWidth, { easing: Easing.out(Easing.poly(3)) });
            inAnimFinish.value = withTiming(1, { duration: 50, easing: Easing.out(Easing.poly(4)) });
            scheduleOnRN(setCompleted, true);
            scheduleOnRN(Haptics.notificationAsync, Haptics.NotificationFeedbackType.Success);
            if (onComplete) scheduleOnRN(onComplete);
        })
    };

    const morphToThumb = () => {
        'worklet';
        morphWidth.value = withTiming(thumbSize);
        inAnimFinish.value = withTiming(0, { duration: 50, easing: Easing.out(Easing.poly(4)) });
        progress.value = withTiming(0, { duration: 700 });
        scheduleOnRN(setCompleted, false);
        if (onReset) scheduleOnRN(onReset);
    };

    const pan = Gesture.Pan()
        .enabled(!completed)
        .minDistance(4)
        .onUpdate((event) => {
            const t = translateX.value / maxX;
            const resistance = 1 - 0.00373147207275 * (Math.exp(4 * t) - 1);
            translateX.value = Math.max(0, Math.min(event.translationX * resistance, maxX));

            progress.value = t;
        })
        .onEnd((event) => {
            if (translateX.value > maxX * 0.8) {
                morphToButton();
            } else {
                resetSlider();
            }
        });

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
        opacity: withTiming(inAnimFinish.value === 0 ? 1 : 0),
        color: interpolateColor(
            inAnimFinish.value,
            [0, 1],
            [thumbTextColor, buttonColor]
        )
    }));

    const buttonTextStyle = useAnimatedStyle(() => ({
        opacity: withTiming(inAnimFinish.value === 1 ? 1 : 0),
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
                <Pressable onPress={() => { if (completed) { morphToThumb(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning) } }}>
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