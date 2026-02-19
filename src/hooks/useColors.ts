import { useEffect } from 'react';
import { useSharedValue, useDerivedValue, interpolateColor, interpolate, withTiming, Easing } from 'react-native-reanimated';
import { DateTime } from 'luxon';
import { fromEpochSec, SunLogic, toEpochSec } from '../db/logic';
import { useLocation } from '../hooks/useLocation';
import { backgroundColorLUT as LUT } from '../constants/colors';

const updateInterval = 10000; // 60*1000 (ms in 1 minute)

export const useBackgroundColors = (hour?: number) => {
    const solarProgress = useSharedValue(0);
    // const { location } = useLocation();

    useEffect(() => {
        const updateSolarPosition = () => {
            let now = DateTime.local();
            if (hour) now = now.set({ hour, minute: hour / 60, second: hour / 3600 });
            // const sunData = SunLogic.request({
            //     date: now,
            //     lat: location?.coords.latitude,
            //     lon: location?.coords.longitude
            // });
            const sunData = {
                sunrise: toEpochSec("2026-02-19T04:36:17+00:00")!,
                sunset: toEpochSec("2026-02-19T15:51:44+00:00")!,
                daylength: 40527,
            }

            const secondsSinceSunrise = now.diff(
                fromEpochSec(sunData.sunrise),
                'seconds'
            ).seconds;

            // Normalize time: 0 = Sunrise, 1 = Sunset
            const newProgress = secondsSinceSunrise / sunData.daylength;

            solarProgress.value = withTiming(newProgress, {
                duration: 1000,
                easing: Easing.linear,
            });
        };

        updateSolarPosition();
        const interval = setInterval(updateSolarPosition, updateInterval);
        return () => clearInterval(interval);
    }, [hour]);

    return useDerivedValue(() => {
        const t = solarProgress.value;
        const s = LUT.stops;

        const getCol = (arr: string[]) => interpolateColor(t, s, arr);
        const getVal = (arr: number[]) => interpolate(t, s, arr);

        return {
            t,

            // SKY
            sky1: getCol(LUT.sky1),
            sky2: getCol(LUT.sky2),

            // WATER
            waterRipple: getCol(LUT.waterRipple),
            waterBackground1: getCol(LUT.waterBackground1),
            waterBackground2: getCol(LUT.waterBackground2),
            waterHills1: getCol(LUT.waterHills1),
            waterHills2: getCol(LUT.waterHills2),
            waterMountains1: getCol(LUT.waterMountains1),
            waterMountains2: getCol(LUT.waterMountains2),

            // MOUNTAINS
            mountainsBack1: getCol(LUT.mountainsBack1),
            mountainsBack2: getCol(LUT.mountainsBack2),
            mountainsFront1: getCol(LUT.mountainsFront1),
            mountainsFront2: getCol(LUT.mountainsFront2),

            // HILLS
            hills1: getCol(LUT.hills1),
            hills2: getCol(LUT.hills2),

            // STARS
            stars: getCol(LUT.stars),
            starsOpacity: getVal(LUT.starsOpacity),
            starsGlow: getCol(LUT.starsGlow),

            // SUN
            sun1: getCol(LUT.sun1),
            sun2: getCol(LUT.sun2),
            sunOpacity: getVal(LUT.sunOpacity),
            sunGlow: getCol(LUT.sunGlow),

            // MOON
            moon: getCol(LUT.moon),
            moonOpacity: getVal(LUT.moonOpacity),
            moonGlow: getCol(LUT.moonGlow),

            // CLOUDS
            clouds1: getCol(LUT.clouds1),
            clouds2: getCol(LUT.clouds2),

            // TREES
            treesTopLayer: getCol(LUT.treesTopLayer),
            treesBottomLayer: getCol(LUT.treesBottomLayer),
        };
    });
};