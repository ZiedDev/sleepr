import React, { ReactNode } from 'react';
import { View, Platform, StyleProp, ViewStyle } from 'react-native';
import { BlurView, BlurViewProps } from 'expo-blur';
import Constants, { ExecutionEnvironment } from 'expo-constants';

interface SafeBlurViewProps {
    children?: ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: number;
    tint?: BlurViewProps['tint'];
    experimentalBlurMethod?: BlurViewProps['experimentalBlurMethod'];
    blurReductionFactor?: BlurViewProps['blurReductionFactor'];
}

export default function SafeBlurView({
    children,
    style,
    intensity = 50,
    tint = 'systemChromeMaterialDark',
    experimentalBlurMethod = 'dimezisBlurView',
    blurReductionFactor = 20,
}: SafeBlurViewProps) {
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    const useBlur = !(Platform.OS === 'android' && isExpoGo);

    if (useBlur) {
        return (
            <BlurView
                intensity={intensity}
                style={style}
                tint={tint}
                experimentalBlurMethod={experimentalBlurMethod}
                blurReductionFactor={blurReductionFactor}
            >
                {children}
            </BlurView>
        );
    }

    return <View style={style}>{children}</View>;
}
