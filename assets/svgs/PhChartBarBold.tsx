import React from 'react';
import Animated, { SharedValue, useAnimatedProps } from 'react-native-reanimated';

import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function PhChartBarBold({ size = 25, color, ...props }: { size?: number, color: SharedValue<any> }) {
   const fill = useAnimatedProps(() => ({ fill: color.value }));

   return (
      <Svg width={size} height={size} viewBox="0 0 256 256" {...props}>
         {/* Icon from Phosphor by Phosphor Icons - https://github.com/phosphor-icons/core/blob/main/LICENSE */}
         <AnimatedPath animatedProps={fill} d="M224 196h-4V40a12 12 0 0 0-12-12h-56a12 12 0 0 0-12 12v36H96a12 12 0 0 0-12 12v36H48a12 12 0 0 0-12 12v60h-4a12 12 0 0 0 0 24h192a12 12 0 0 0 0-24M164 52h32v144h-32Zm-56 48h32v96h-32Zm-48 48h24v48H60Z" />
      </Svg>
   )
}

export default PhChartBarBold;