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
    const avgs = records.length > 0
        ? StatsLogic.getAverages(records)
        : {
            start: { meanSeconds: 0, meanTime: '--:--' },
            end: { meanSeconds: 0, meanTime: '--:--' },
            duration: { meanTime: '--:--' },
        };

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
        <View style={[{ width, height, borderRadius: width * 0.12 }, styles.container, style]}>
            <View style={styles.textContainer}>
                <Text style={{fontFamily: "MonaSans-Regular",}}>Averages</Text>
                <Text style={{fontFamily: "MonaSans-Regular",}}>{`${avgs.start.meanTime} -> ${avgs.end.meanTime}`}</Text>
                <Text style={{fontFamily: "MonaSans-Regular",}}>{avgs.duration.meanTime}</Text>
            </View>

            <ClockSlider
                mode='range'
                size={width / 2}
                knobRadius={0}
                startColor="#126ded"
                endColor="#126ded"
                arcColor="#468df1"
                locked
                startAngle={startAngle}
                endAngle={endAngle}

            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderCurve: "continuous",
        // backgroundColor: "#126ded",
        borderColor: "#ffffff99",
        borderWidth: 2,
        paddingHorizontal: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    textContainer: {

    },
});