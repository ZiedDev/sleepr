import React, { useState } from 'react';
import { Dimensions, StyleSheet, View, Text } from 'react-native';
import BackgroundArt from '../../assets/svgs/BackgroundArt';
import { useBackgroundColors } from '../hooks/useColors';
import { SharedValue } from 'react-native-reanimated';

export default function BackgroundScreen({ solarProgress, ...props }:{solarProgress:SharedValue<number>}) {
    const animatedColors = useBackgroundColors(solarProgress);
    return (
        <View style={styles.background} {...props}>
            <BackgroundArt size={Dimensions.get("window").width} colors={animatedColors} style={styles.art} />
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