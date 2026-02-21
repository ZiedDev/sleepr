import React, { lazy, Suspense, useState } from 'react';
import { Dimensions, StyleSheet, View, Text } from 'react-native';
import { useBackgroundColors } from '../hooks/useColors';
import { SharedValue } from 'react-native-reanimated';

const BackgroundArt = lazy(() => import('../../assets/svgs/BackgroundArt'));

export default function BackgroundScreen({ solarProgress, ...props }: { solarProgress: SharedValue<number> }) {
    const animatedColors = useBackgroundColors(solarProgress);
    return (
        <View style={styles.background} {...props}>
            <Suspense fallback={<View />}>
                <BackgroundArt
                    width={Dimensions.get("window").width}
                    colors={animatedColors}
                    style={styles.art}
                />
            </Suspense>
        </View>
    );
}

const styles = StyleSheet.create({
    background: {
        width: "100%",
        height: "100%",
        position: "absolute",
        backgroundColor: '#244447',
    },

    art: {
    }
});