import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';

export default function StaggeredText({ sentence }: { sentence: string }) {
    const words = sentence.split(' ');

    return (
        <View style={styles.container}>
            {words.map((word, index) => (
                <AnimatedWord key={index} word={word} index={index} />
            ))}
        </View>
    );
}

const AnimatedWord = ({ word, index }: {
    word: string;
    index: number;
}) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);

    useEffect(() => {
        opacity.value = withDelay(index * 100, withSpring(1));
        translateY.value = withDelay(index * 100, withSpring(0));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.Text style={[styles.word, animatedStyle]}>
            {word}{' '}
        </Animated.Text>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    word: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});