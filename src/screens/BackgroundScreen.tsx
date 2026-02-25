import React, { lazy, Suspense } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { useBackgroundColors } from '../hooks/useColors';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const BackgroundArt = Platform.OS == 'web' ?
    lazy(() => import('../../assets/svgs/BackgroundArt')) :
    require('../../assets/svgs/BackgroundArt').default

export default function BackgroundScreen() {
    const animatedColors = useBackgroundColors();
    const animatedBackgroundStyle = useAnimatedStyle(() => ({
        backgroundColor: animatedColors.value.treesBottomLayer,
    }));

    return (
        <Animated.View style={[styles.background, animatedBackgroundStyle]}>
            <Suspense fallback={<View />}>
                <BackgroundArt
                    width={Dimensions.get("window").width}
                    colors={animatedColors}
                />
            </Suspense>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    background: {
        width: "100%",
        height: "100%",
        position: "absolute",
        backgroundColor: '#244447',
    },
});