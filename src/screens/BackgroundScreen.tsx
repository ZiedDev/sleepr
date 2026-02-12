import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function BackgroundScreen() {
    return <View style={styles.background} />;
}

const styles = StyleSheet.create({
    background: {
        width: "100%",
        height: "100%",
        position: "absolute",
        backgroundColor: '#2e2e2e',
    },
});