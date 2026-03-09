import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';

interface StaggeredTextProps {
    sentence: string;
    delay?: number;
    speed?: number;
    style?: TextStyle;
    wordStyles?: Record<string, TextStyle>;
    containerStyle?: StyleProp<ViewStyle>;
};

export default function StaggeredText({
    sentence,
    delay = 150,
    speed = 100,
    style = {},
    wordStyles = {},
    containerStyle = {},
}: StaggeredTextProps) {
    const words = sentence.split(' ');

    return (
        <View style={[styles.container, containerStyle]}>
            {words.map((word, index) => (
                <AnimatedWord
                    key={index}
                    word={word}
                    index={index}
                    delay={delay}
                    speed={speed}
                    style={[style, wordStyles[word]]}
                />
            ))}
        </View>
    );
}

const AnimatedWord = ({ word, index, delay, speed, style, }: {
    word: string;
    index: number;
    delay: number;
    speed: number;
    style?: TextStyle | TextStyle[];
}) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);

    useEffect(() => {
        opacity.value = withDelay(index * delay, withSpring(1, { stiffness: speed }));
        translateY.value = withDelay(index * delay, withSpring(0, { stiffness: speed }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.Text style={[styles.word, animatedStyle, style]}>
            {word + ' '}
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