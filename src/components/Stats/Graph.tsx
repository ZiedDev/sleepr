import React, { memo, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle, Text } from 'react-native';
import Animated, { SharedValue, useSharedValue, withTiming, Easing, useDerivedValue, useAnimatedProps } from 'react-native-reanimated';
import { StatsLogic } from '../../db/logic';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { GraphDataPoint, GraphResults, SleepSessionRecord } from '../../db/types';
import * as Haptics from 'expo-haptics';
import { Canvas, Group, RoundedRect, SkFont, Text as SkiaText, useFont } from '@shopify/react-native-skia';
import { Interval } from 'luxon';

interface GraphProps {
    width: number;
    height: number;

    fetchedSessions: SleepSessionRecord[];
    fetchedRange: Interval;
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
    fetchedRange,
    currentRange,
    setCurrentRange,

    style,
}: GraphProps) {
    const font = useFont(require('../../../assets/fonts/Mona Sans/TTF/MonaSans-Regular.ttf'), 12);

    const graphData: GraphResults = useMemo(() =>
        fetchedSessions.length > 0 ? StatsLogic.getGraph(fetchedSessions, 100) : {},
        [fetchedSessions]);
    const dataArray = Object.entries(graphData);
    // console.log(JSON.stringify(dataArray, null, 2));



    // Interaction States
    const initalOffset = currentRange.start!.diff(fetchedRange.start!, 'seconds').seconds / fetchedRange.start!.diff(fetchedRange.end!, 'seconds').seconds * width
    const translateX = useSharedValue<number>(initalOffset);
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

    const groupTranslation = useDerivedValue(() => [{ translateX: translateX.value }]);

    return (
        <GestureDetector gesture={gesture}>
            <View style={[styles.container, { width, height, borderRadius: width * 0.12 }, style]}>
                <Canvas style={{ flex: 1 }}>
                    <Group transform={groupTranslation}>
                        {dataArray.map(([date, point], index) => (
                            <Bar
                                key={date}
                                index={index}
                                point={point}
                                height={height}
                                font={font!}
                            />
                        ))}
                    </Group>
                </Canvas>
            </View>
        </GestureDetector>
    );
};

const Bar = memo(({ index, point, height, font }: {
    index: number;
    point: GraphDataPoint;
    height: number;
    font: SkFont;
}) => {
    const x = useDerivedValue(() => {
        return (index * (BAR_WIDTH + GAP));
    });

    const y = useDerivedValue(() => {
        return height - point.height - 20;
    });

    const rectHeight = useDerivedValue(() => {
        return point.height;
    });

    const rectText = useDerivedValue(() => {
        return point.durationTime;
    });

    return (<>
        <RoundedRect
            x={x}
            y={y}
            width={BAR_WIDTH}
            height={rectHeight}
            r={8}
            color="white"
        />
        <SkiaText
            x={x}
            y={y}
            text={rectText}
            font={font}
            color="white"
        />
    </>);
});

const styles = StyleSheet.create({
    container: {
        borderCurve: "continuous",
        borderColor: "#ffffff99",
        borderWidth: 2,
        paddingHorizontal: 10,
    },
});