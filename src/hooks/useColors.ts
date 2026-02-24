import { useEffect } from 'react';
import { useDerivedValue, interpolateColor, interpolate, withTiming, Easing, SharedValue } from 'react-native-reanimated';
import { DateTime } from 'luxon';
import { fromEpochSec, SunLogic, toEpochSec } from '../db/logic';
import useLocation from '../hooks/useLocation';
import { backgroundColorLUT as LUT } from '../constants/colors';
import { Platform } from 'react-native';

const updateInterval = 60000; // 60*1000 (ms in 1 minute)

export const getProgress = (hour?: number) => {
    let now = DateTime.local();
    if (hour !== undefined) now = now.set({ hour });
    // const { location } = useLocation();
    // const sunData = SunLogic.request({
    //     date: now,
    //     lat: location?.coords.latitude,
    //     lon: location?.coords.longitude
    // });
    const sunData = {
        sunrise: toEpochSec(DateTime.now().set({ hour: 4, minute: 36 }))!,
        daylength: 40527,
    };

    const secondsSinceSunrise = now.diff(DateTime.fromSeconds(sunData.sunrise), 'seconds').seconds;
    return secondsSinceSunrise / sunData.daylength;
};

export const useBackgroundColors = (progress: SharedValue<number>) => {
    useEffect(() => {
        const update = () => {
            progress.value = withTiming(getProgress(), {
                duration: 1000,
                easing: Easing.linear,
            });
        };

        update();
        const interval = setInterval(update, updateInterval);
        return () => clearInterval(interval);
    }, [progress]);

    return useDerivedValue(() => {
        const t = progress.value;
        const s = LUT.stops;

        const getCol = (arr: string[]) => interpolateColor(t, s, arr);
        const getVal = (arr: number[]) => interpolate(t, s, arr);

        return {
            blur: Platform.OS == "android" ? 15 : 0,

            // SKY
            sky1: getCol(LUT.sky1),
            sky2: getCol(LUT.sky2),
            skyPosX: getVal(LUT.skyPosX),
            skyPosY: getVal(LUT.skyPosY),

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
            sunPosX: getVal(LUT.sunPosX),
            sunPosY: getVal(LUT.sunPosY),

            // MOON
            moon: getCol(LUT.moon),
            moonOpacity: getVal(LUT.moonOpacity),
            moonGlow: getCol(LUT.moonGlow),
            moonPosX: getVal(LUT.moonPosX),
            moonPosY: getVal(LUT.moonPosY),

            // CLOUDS
            clouds1: getCol(LUT.clouds1),
            clouds2: getCol(LUT.clouds2),

            // TREES
            treesTopLayer: getCol(LUT.treesTopLayer),
            treesBottomLayer: getCol(LUT.treesBottomLayer),
        };
    });
};