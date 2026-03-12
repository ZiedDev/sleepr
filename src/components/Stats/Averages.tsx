import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle, Text } from 'react-native';
import Animated, { SharedValue, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { StatsLogic } from '../../db/logic';
import { AveragesResult, SleepSessionRecord } from '../../db/types';
import ClockSlider from '../ClockSlider';
import { DateTime, Duration } from 'luxon';
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
    const avgs: AveragesResult = records.length > 0
        ? StatsLogic.getAverages(records) :
        {
            start: { meanSeconds: 0, meanTime: '--:--', concentration: 0 },
            end: { meanSeconds: 0, meanTime: '--:--', concentration: 0 },
            duration: { meanSeconds: 0, meanTime: '--:--' },
        };

    const duration = Duration.fromISOTime(avgs.duration.meanTime);
    const dataString = {
        durationText: `${isNaN(duration.hours) ? "- " : duration.hours}h ${isNaN(duration.minutes) ? "- " : duration.minutes}m`,
        startString: `${DateTime.fromISO(avgs.start.meanTime).toFormat("hh:mm a")}`,
        endString: `${DateTime.fromISO(avgs.end.meanTime).toFormat("hh:mm a")}`,
    }

    const startAngle = useSharedValue(0);
    const endAngle = useSharedValue(0);
    useEffect(() => {
        startAngle.value = withTiming(avgs.start.meanSeconds / 86400 * Math.PI * 2, {
            duration: 1000,
            easing: Easing.out(Easing.exp),
        });

        endAngle.value = withTiming(avgs.end.meanSeconds / 86400 * Math.PI * 2, {
            duration: 1000,
            easing: Easing.out(Easing.exp),
        });
    });

    return (
        <View style={[{ width, borderRadius: width * 0.12, padding: width * 0.055, }, styles.container, style]}>
            <View style={styles.widgetTop}>
                <View style={styles.widgetTopLeft}>
                    <Text style={styles.widgetTitleText}>Averages</Text>
                    <View style={styles.widgetDuration}>
                        <Text style={styles.widgetDurationText}>{dataString.durationText}</Text>
                        <Text style={styles.widgetDurationDiffText}>▲20</Text>
                    </View>
                </View>

                <ClockSlider
                    mode='range'
                    size={width * 0.41}
                    knobRadius={0}
                    arcColor="#468df1"
                    locked
                    startAngle={startAngle}
                    endAngle={endAngle}
                />
            </View>
            <View>
                <View style={styles.widgetTime}>
                    <View>
                        <Text style={styles.sleepTimeTitle}>{`Sleep Time`}</Text>
                        <Text style={styles.sleepTime}>{`${dataString.startString}`}</Text>
                    </View>
                    <View>
                        <Text style={styles.arrow}>{`→`}</Text>
                    </View>
                    <View style={styles.wakeTimeContainer}>
                        <Text style={styles.wakeTimeTitle}>{`Wake Time`}</Text>
                        <Text style={styles.wakeTime}>{`${dataString.endString}`}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.widgetConsistency}>
                <Text style={styles.consistencyTitle}>Overall Consistency</Text>
                <Text style={styles.consistencyPercentage}>95%</Text>
                <View style={styles.consistencyProgressContainer}>
                    <View style={styles.consistencyProgressBar}></View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderCurve: "continuous",
        borderColor: "#ffffff99",
        borderWidth: 2,
        gap: 5,
    },
    widgetTop: {
        flexDirection: "row",
        justifyContent: 'space-between',
    },
    widgetTopLeft: {
        gap: 10,
    },
    widgetTitleText: {
        color: "#ffffff",
        marginTop: 6,
        fontFamily: "MonaSans-ExtraBold",
        fontSize: 24,
    },
    widgetDuration: {
        justifyContent: "space-between",
    },
    widgetDurationText: {
        marginTop: 10,
        color: "#468df1",
        fontFamily: "MonaSans-BlackItalic",
        fontSize: 32,
    },
    widgetDurationDiffText: {
        color: "#66cb66",
        fontFamily: "MonaSans-BlackItalic",
        fontSize: 18,
    },
    widgetTime: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
    },
    sleepTimeTitle: {
        fontSize: 18,
        color: "#ffffff",
        fontFamily: "MonaSans-Medium",
    },
    sleepTime: {
        fontSize: 24,
        color: "#468df1",
        fontFamily: "MonaSans-BlackItalic",
    },
    arrow: {
        fontSize: 32,
        color: "#ffffff",
    },

    wakeTimeContainer: {
        alignItems: "flex-end",
    },
    wakeTimeTitle: {
        fontSize: 18,
        fontFamily: "MonaSans-Medium",
        color: "#ffffff",
    },
    wakeTime: {
        fontSize: 24,
        color: "#468df1",
        fontFamily: "MonaSans-BlackItalic",
    },

    widgetConsistency: {
        marginTop: 5,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 5,
    },
    consistencyTitle: {
        fontSize: 14,
        color: "#ffffff",
        fontFamily: "MonaSans-Medium",
    },
    consistencyPercentage: {
        fontSize: 18,
        color: "#468df1",
        fontFamily: "MonaSans-BlackItalic",
    },
    consistencyProgressContainer: {
        width: 100,
        height: 10,
        borderCurve: "continuous",
        borderColor: "#ffffff99",
        borderWidth: 2,
        borderRadius: 100,
        position: "relative",
    },
    consistencyProgressBar: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: "50%",
        backgroundColor: "#66cb66",
        borderCurve: "continuous",
        borderRadius: 100,
    },
});