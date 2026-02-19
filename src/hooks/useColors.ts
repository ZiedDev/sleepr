import { useEffect } from 'react';
import { useSharedValue, useDerivedValue, interpolateColor, interpolate } from 'react-native-reanimated';
import { DateTime } from 'luxon';
import { fromEpochSec, SunLogic, toEpochSec } from '../db/logic';
import { useLocation } from '../hooks/useLocation';
import { backgroundColorLUT as LUT } from '../constants/colors';

const updateInterval = 10000; // 60*1000 (ms in 1 minute)

export const useBackgroundColors = (hour: number) => {
    const solarProgress = useSharedValue(0);
    // const { location } = useLocation();

    useEffect(() => {
        const updateSolarPosition = () => {
            const now = DateTime.local().set({ hour });
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
            solarProgress.value = secondsSinceSunrise / sunData.daylength;
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
            sky1: getCol(LUT.sky1),
            sky2: getCol(LUT.sky2),
            mountains: getCol(LUT.mountains),
            trees: getCol(LUT.trees),
            sunOpacity: getVal(LUT.sunOpacity),
            moonOpacity: getVal(LUT.moonOpacity),
        };
    });
};