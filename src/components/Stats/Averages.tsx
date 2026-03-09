import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle, Text } from 'react-native';
import Animated, { SharedValue, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { StatsLogic } from '../../db/logic';
import { SleepSessionRecord } from '../../db/types';
import ClockSlider from '../ClockSlider';

interface AveragesProps {
    width: number;
    height: number;
    records: SleepSessionRecord[];

    style?: StyleProp<ViewStyle>;
}

export default function Averages({
    width,
    height,
    records,

    style,
}: AveragesProps) {
    const avgs = StatsLogic.getAverages(records);

    const startAngle = useSharedValue(0);
    startAngle.value = withTiming(avgs.start.meanSeconds / 86400 * Math.PI * 2, {
        duration: 1000,
        easing: Easing.out(Easing.exp),
    });

    const endAngle = useSharedValue(0);
    endAngle.value = withTiming(avgs.end.meanSeconds / 86400 * Math.PI * 2, {
        duration: 1000,
        easing: Easing.out(Easing.exp),
    });

    return (
        <View style={[{ width, height }, styles.container, style]}>
            <View style={styles.textContainer}>
                <Text>{`${avgs.start.meanTime} -> ${avgs.end.meanTime}`}</Text>
                <Text>{avgs.duration.meanTime}</Text>
            </View>

            <ClockSlider
                mode='range'
                size={width / 2}
                locked
                startAngle={startAngle}
                endAngle={endAngle}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    textContainer: {

    },
});