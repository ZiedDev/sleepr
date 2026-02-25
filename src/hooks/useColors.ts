import { useDerivedValue, interpolateColor, interpolate, withTiming, Easing, makeMutable } from 'react-native-reanimated';
import { DateTime } from 'luxon';
import { SunLogic, toISODate } from '../db/logic';
import useLocation from '../hooks/useLocation';
import { backgroundColorLUT as LUT } from '../constants/colors';
import { create } from 'zustand';
import { useStorage } from '../db/storage';

interface ColorState {
    progress: { value: number }; // 0 -> 1
    blur: { value: number };
    initialize: () => Promise<boolean>;
    setProgress: (value: number, animated?: boolean) => void;
    setProgressByTime: (time: DateTime, animated?: boolean) => Promise<void>;
    setBlur: (amount: number, animated?: boolean) => void;
    refresh: () => Promise<void>;
}

const updateInterval = 60000; // 60*1000 (ms in 1 minute)
let intervalId: NodeJS.Timeout | null = null;

const getSunData = async (time: DateTime) => {
    const location = useLocation.getState().location;
    if (!location) return null;

    const { sunCache, setSunCache } = useStorage.getState();

    const date = toISODate(time);
    const lat = location.coords.latitude;
    const lon = location.coords.longitude;

    if (
        sunCache &&
        sunCache.date === date &&
        sunCache.lat === lat &&
        sunCache.lon === lon
    ) return sunCache;

    const sunData = await SunLogic.request({
        date: time,
        lat,
        lon,
    });
    setSunCache(sunData);

    return sunData;
};

const calculateProgress = async (time: DateTime) => {
    const sunData = await getSunData(time);
    if (!sunData) return 0;

    const secondsSinceSunrise = time.diff(DateTime.fromSeconds(sunData.sunrise), 'seconds').seconds;
    return secondsSinceSunrise / sunData.daylength;
};

const useColorStore = create<ColorState>((set, get) => {
    const progress = makeMutable(0);
    const blur = makeMutable(0);
    return {
        progress,
        blur,

        initialize: async () => {
            const p = await calculateProgress(DateTime.now());
            if (isNaN(p)) return false;
            get().setProgress(p);
            if (intervalId) clearInterval(intervalId);
            intervalId = setInterval(() => get().refresh(), updateInterval);
            return true;
        },

        setProgress: (val, animated = true) => {
            progress.value = animated ?
                withTiming(val, { duration: 1000, easing: Easing.linear }) : val;
        },

        setBlur: (amount, animated = true) => {
            blur.value = animated ?
                withTiming(amount, { duration: 500, easing: Easing.linear }) : amount;
        },

        setProgressByTime: async (time, animated = true) => {
            const p = await calculateProgress(time);
            get().setProgress(p, animated);
        },

        refresh: async () => { await get().setProgressByTime(DateTime.now()); }
    }
});

export default useColorStore;

export const useBackgroundColors = () => {
    const progress = useColorStore(state => state.progress);
    const blur = useColorStore(state => state.blur);

    return useDerivedValue(() => {
        const t = progress.value;
        const s = LUT.stops;

        const getCol = (arr: string[]) => interpolateColor(t, s, arr);
        const getVal = (arr: number[]) => interpolate(t, s, arr);

        return {
            blur: blur.value,
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