import React, { memo, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle, Text } from 'react-native';
import Animated, { SharedValue, useSharedValue, withTiming, Easing, useDerivedValue, useAnimatedProps } from 'react-native-reanimated';
import { StatsLogic } from '../../db/logic';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { GraphDataPoint, GraphResults, SleepSessionRecord } from '../../db/types';
import * as Haptics from 'expo-haptics';
import { Canvas, RoundedRect } from '@shopify/react-native-skia';
import { Interval } from 'luxon';

interface GraphProps {
    width: number;
    height: number;

    fetchedSessions: SharedValue<SleepSessionRecord[]>;
    currentRange: Interval;
    setCurrentRange: React.Dispatch<React.SetStateAction<Interval>>;

    style?: StyleProp<ViewStyle>;
}

const BAR_WIDTH = 40;
const GAP = 20;

export default function Graph({
    width,
    height,

    fetchedSessions,
    currentRange,
    setCurrentRange,

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

    return (
        <GestureDetector gesture={gesture}>
            <View style={[styles.container, { width, height, borderRadius: width * 0.12 }, style]}>
                <Canvas style={{ flex: 1 }}>
                    {dataArray.map(([date, point], index) => (
                        <Bar
                            key={date}
                            index={index}
                            point={point}
                            width={width}
                            height={height}
                            translateX={translateX}
                            scaleX={scaleX}
                        />
                    ))}
                </Canvas>
            </View>
        </GestureDetector>
    );
};

const Bar = memo(({ index, point, width, height, translateX, scaleX, }: any) => {
    const x = useDerivedValue(() => {
        return (index * (BAR_WIDTH + GAP)) * scaleX.value + translateX.value;
    });

    const y = useDerivedValue(() => {
        return height - point.height - 40;
    });

    const rectWidth = useDerivedValue(() => {
        return BAR_WIDTH * scaleX.value;
    });

    const rectHeight = useDerivedValue(() => {
        return point.height;
    });

    return (
        <RoundedRect
            x={x}
            y={y}
            width={rectWidth}
            height={rectHeight}
            r={8}
            color="white"
        />
    );
});

const styles = StyleSheet.create({
    container: {
        borderCurve: "continuous",
        borderColor: "#ffffff99",
        borderWidth: 2,
        paddingHorizontal: 10,
    },
});