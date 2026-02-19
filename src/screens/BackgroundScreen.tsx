import React, { useState } from 'react';
import { Dimensions, StyleSheet, View, Text } from 'react-native';
import BackgroundArt from '../../assets/svgs/BackgroundArt';
import { useBackgroundColors } from '../hooks/useColors';
import Slider from '@react-native-community/slider';
import { DateTime } from 'luxon';

export default function BackgroundScreen({ ...props }) {
    const [sliderValue, setSliderValue] = useState<number>(DateTime.now().hour);
    const animatedColors = useBackgroundColors(sliderValue);
    return (
        <View style={styles.background} {...props}>
            <Text style={{ margin: 'auto' }}>{animatedColors.value.t}, {sliderValue}</Text>
            <Slider
                style={{ width: '70%', height: 40, margin: 'auto' }}
                minimumValue={0}
                maximumValue={24}
                value={sliderValue}
                onValueChange={(value) => setSliderValue(value)}
            />

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