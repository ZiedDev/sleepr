import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import BackgroundArt from '../../assets/svgs/BackgroundArt';
import { useBackgroundColors } from '../hooks/useColors';

export default function BackgroundScreen({...props}) {
    const animatedColors = useBackgroundColors();
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