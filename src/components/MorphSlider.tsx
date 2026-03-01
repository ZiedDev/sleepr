import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, interpolateColor, Extrapolation, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { scheduleOnRN } from 'react-native-worklets';
// TODO: Haptics
const TRACK_WIDTH = 320;
const TRACK_HEIGHT = 64;
const THUMB_SIZE = 56;
const BUTTON_WIDTH = 200;
const PADDING = 4;

interface MorphSlider {

}

export default function MorphSlider() {
    const [completed, setCompleted] = useState(false);

    const translateX = useSharedValue(0);
    const morphWidth = useSharedValue(THUMB_SIZE);
    const isFinished = useSharedValue(0);

    const maxX = TRACK_WIDTH - THUMB_SIZE - (PADDING * 2);

    const resetSlider = () => {
        'worklet';
        translateX.value = withTiming(0, {
            duration: 400,
            easing: Easing.out(Easing.cubic),
        })
    };

    const morphToButton = () => {
        'worklet';
        translateX.value = withTiming(maxX, {
            duration: 200,
            easing: Easing.out(Easing.back(1.8)),
        }, () => {
            translateX.value = withTiming(0, { easing: Easing.out(Easing.poly(3)) });
            morphWidth.value = withTiming(BUTTON_WIDTH, { easing: Easing.out(Easing.poly(3)) });
            isFinished.value = withTiming(1, { easing: Easing.out(Easing.poly(3)) });
            scheduleOnRN(setCompleted, true);
        })
    };

    const morphToThumb = () => {
        'worklet';
        isFinished.value = withTiming(0);
        morphWidth.value = withTiming(THUMB_SIZE);
        scheduleOnRN(setCompleted, false);

    };

    const pan = Gesture.Pan()
        .enabled(!completed)
        .minDistance(4)
        .onUpdate((event) => {
            const progress = translateX.value / maxX;
            // const resistance = 1 - (progress * 0.5);
            const resistance = 1 - Math.pow(progress, 3) * 0.15;
            translateX.value = Math.max(0, Math.min(event.translationX * resistance, maxX));
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
            isFinished.value,
            [0, 1],
            ['#f0f8ff', '#4caf50']
        ),
    }));

    const vignetteStyle = useAnimatedStyle(() => ({
        opacity: interpolate( // TODO: add bezier
            translateX.value,
            [0, maxX],
            [0, 0.85],
            Extrapolation.CLAMP
        ),
    }));

    const thumbTextStyle = useAnimatedStyle(() => ({
        opacity: withTiming(isFinished.value === 0 ? 1 : 0),
    }));

    const buttonTextStyle = useAnimatedStyle(() => ({
        opacity: withTiming(isFinished.value === 1 ? 1 : 0),
    }));

    const trackStyle = useAnimatedStyle(() => ({
        width: interpolate(
            morphWidth.value,
            [THUMB_SIZE, BUTTON_WIDTH],
            [TRACK_WIDTH, BUTTON_WIDTH + PADDING * 2],
            Extrapolation.CLAMP
        )
    }));

    return (
        <Animated.View style={[styles.track, trackStyle]}>
            <GestureDetector gesture={pan}>
                <Pressable onPress={() => { if (completed) morphToThumb(); }}>
                    <Animated.View style={[styles.morph, animatedMorphStyle]}>
                        <Animated.Text style={[styles.thumbText, thumbTextStyle]}>➜</Animated.Text>
                        <Animated.Text style={[styles.buttonText, buttonTextStyle]}>Click Me</Animated.Text>
                    </Animated.View>
                </Pressable>
            </GestureDetector>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    track: {
        height: TRACK_HEIGHT,
        backgroundColor: "#222222",
        borderRadius: TRACK_HEIGHT / 2,
        justifyContent: 'center',
        paddingHorizontal: PADDING,
        overflow: 'hidden',
    },
    morph: {
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumbText: {
        position: 'absolute',
        fontSize: 22,
        color: '#000',
    },
    buttonText: {
        position: 'absolute',
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
});