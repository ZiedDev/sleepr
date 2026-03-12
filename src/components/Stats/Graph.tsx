import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle, Text } from 'react-native';
import Animated, { SharedValue, useSharedValue, withTiming, Easing, useDerivedValue } from 'react-native-reanimated';
import { StatsLogic } from '../../db/logic';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { GraphResults, SleepSessionRecord } from '../../db/types';
import * as Haptics from 'expo-haptics';
import { Canvas, RoundedRect } from '@shopify/react-native-skia';

interface GraphProps {
    width: number;
    height: number;
    records: SleepSessionRecord[];

    style?: StyleProp<ViewStyle>;
}

const BAR_WIDTH = 40;
const GAP = 20;

export default function Graph({
    width,
    height,
    records,

    style,
}: GraphProps) {
    const graphData: GraphResults = useMemo(() =>
        records.length > 0 ? StatsLogic.getGraph(records) : {},
        [records]);
    const dataArray = Object.entries(graphData);
    console.log(JSON.stringify(dataArray, null, 2));

    // Interaction States
    const translateX = useSharedValue(100);
    const scaleX = useSharedValue(1);
    const savedScaleX = useSharedValue(1);
    const savedTranslateX = useSharedValue(0);

    // Gesture
    const pan = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = savedTranslateX.value + event.translationX;
        })
        .onEnd((event) => {
            // Optional: Add withDecay for momentum scrolling
            savedTranslateX.value = translateX.value;
        });
    const pinch = Gesture.Pinch()
        .onUpdate((event) => {
            // scaleX.value = savedScaleX.value * e.scale;
        })
        .onEnd((event) => {
            // savedScaleX.value = scaleX.value;
        });

    const gesture = Gesture.Simultaneous(pan, pinch);

    const bars = useDerivedValue(() => {
        return dataArray.map(([date, point], index) => {
            const x = (index * (BAR_WIDTH + GAP)) * scaleX.value + translateX.value;
            if (x < -BAR_WIDTH || x > width) return null;
            return {
                key: date,
                x,
                y: height - point.height - 40,
                width: BAR_WIDTH * scaleX.value,
                height: point.height,
            };
        });
    }, [dataArray, width, height]);

    return (
        <GestureDetector gesture={gesture}>
            <View style={[styles.container, { width, height, borderRadius: width * 0.12 }, style]}>
                <Canvas style={{ flex: 1 }}>
                    {bars.value.map((bar) => {
                        if (!bar) return null;
                        return (
                            <RoundedRect
                                key={bar.key}
                                x={bar.x}
                                y={bar.y}
                                width={bar.width}
                                height={bar.height}
                                r={8}
                                color="white"
                            />
                        );
                    })}
                </Canvas>
            </View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    container: {
        borderCurve: "continuous",
        borderColor: "#ffffff99",
        borderWidth: 2,
        paddingHorizontal: 10,
    },
});