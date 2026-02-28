import { useDerivedValue, interpolateColor, interpolate, withTiming, Easing, makeMutable } from 'react-native-reanimated';
import { DateTime } from 'luxon';
import { SunLogic, toCoordinate, toEpochSec, toISODate } from '../db/logic';
import useLocation from '../hooks/useLocation';
import { backgroundColorLUT as LUT } from '../constants/colors';
import { create } from 'zustand';
import { useStorage } from '../db/storage';
import { SunTimesRecord } from '../db/types';

interface ColorState {
    progress: { value: number }; // 0 -> 1
    blur: { value: number };
    initialize: () => Promise<void>;
    setProgress: (value: number, animated?: boolean) => void;
    setProgressByTime: (time: DateTime, animated?: boolean) => Promise<void>;
    setBlur: (amount: number, animated?: boolean) => void;
    refresh: () => Promise<void>;
}

const updateInterval = 120000; // 2*60*1000 (ms in 2 minutes)
const requestTimeout = 20000; // 20*1000 (ms in 20 seconds)
let intervalId: NodeJS.Timeout | null = null;

const calculateOfflineSunData = (time: DateTime, lat: number, lon: number): SunTimesRecord => {
    const dayOfYear = time.ordinal; // 1-366
    const phi = lat * (Math.PI / 180); // lat in radians

    // Calculate Approximate Solar Declination
    // accounts for 23.45 degree tilt
    const delta = 0.409 * Math.asin(Math.sin((2 * Math.PI / 365) * (dayOfYear - 81)));

    // Calculate Hour Angle (at sunrise/sunset)
    // cos(omega) = -tan(latitude) * tan(declination)
    const term = -Math.tan(phi) * Math.tan(delta);
    // Clamp term between -1 and 1 to avoid NaN at poles during 24h day/night
    const clampedTerm = Math.max(-1, Math.min(1, term));
    const omega = Math.acos(clampedTerm);

    // Calculate Daylength in seconds
    // omega is half the day in radians. 2*omega / 2*pi * 86400
    const daylength = (omega / Math.PI) * 86400;

    // Equation of Time in minutes
    const b = (2 * Math.PI / 365) * (dayOfYear - 81);
    const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);

    // 4. Calculate Solar Noon in UTC
    // 12:00 UTC adjusted by longitude (4 mins per degree)
    // Plus Equation of Time adjustment (optional, but lon * 4 is the big factor)
    const localDate = { year: time.year, month: time.month, day: time.day };
    const solarNoonUTC =
        DateTime
            .fromObject(localDate, { zone: 'utc' })
            .set({ hour: 12, minute: 0, second: 0 })
            .minus({ minutes: (lon * 4) + eot });

    const sunriseUTC = solarNoonUTC.minus({ seconds: daylength / 2 });
    const sunsetUTC = solarNoonUTC.plus({ seconds: daylength / 2 });

    return {
        sunrise: toEpochSec(sunriseUTC)!,
        sunset: toEpochSec(sunsetUTC)!,
        daylength: Math.floor(daylength),
        date: toISODate(time)!,
        lat: toCoordinate(lat)!,
        lon: toCoordinate(lon)!,
    };
}

const getSunData = async (time: DateTime): Promise<SunTimesRecord | null> => {
    const location = useLocation.getState().location;
    if (!location) return null;

    const { sunCache, setSunCache } = useStorage.getState();

    const dateISO = toISODate(time)!;
    const latCoordinate = toCoordinate(location.coords.latitude)!;
    const lonCoordinate = toCoordinate(location.coords.longitude)!;

    if (
        sunCache &&
        sunCache.date === dateISO &&
        sunCache.lat === latCoordinate &&
        sunCache.lon === lonCoordinate
    ) return sunCache;

    const sunOffline = calculateOfflineSunData(time, latCoordinate, lonCoordinate);

    try {
        const sunRequest = await Promise.race([
            SunLogic.request({
                date: dateISO,
                lat: latCoordinate,
                lon: lonCoordinate,
            }),
            new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), requestTimeout)
            )
        ]);
        if (sunRequest) {
            setSunCache(sunRequest);

            const sunriseDiff = ((sunOffline.sunrise - sunRequest.sunrise) / 60).toFixed(2);
            const sunsetDiff = ((sunOffline.sunset - sunRequest.sunset) / 60).toFixed(2);
            const daylengthDiff = ((sunOffline.daylength - sunRequest.daylength) / 60).toFixed(2);
            console.log(`
        calcul: sunrise: ${sunOffline.sunrise} sunset: ${sunOffline.sunset} daylength: ${Math.floor(sunOffline.daylength)}
        actual: sunrise: ${sunRequest.sunrise} sunset: ${sunRequest.sunset} daylength: ${sunRequest.daylength}
        differ: sunrise: ${sunriseDiff}      sunset: ${sunsetDiff}     daylength: ${daylengthDiff}
        `);

            return sunRequest;
        }
    } catch (e) {
        console.warn("[useColors] SunData request failed or timed out. Falling back to offline math.", e);
    }

    return sunOffline;
};

const calculateProgress = (time: DateTime, sunData: SunTimesRecord | null): number => {
    if (!sunData) return 2;
    const secondsSinceSunrise = time.diff(DateTime.fromSeconds(sunData.sunrise), 'seconds').seconds;
    return secondsSinceSunrise / sunData.daylength;
};

const useColorStore = create<ColorState>((set, get) => {
    const p = calculateProgress(DateTime.now(), useStorage.getState().sunCache);
    const progress = makeMutable(p);
    const blur = makeMutable(0);
    return {
        progress,
        blur,

        initialize: async () => {
            const now = DateTime.now();
            const p = calculateProgress(now, await getSunData(now));
            get().setProgress(p, true);

            if (intervalId) clearInterval(intervalId);
            intervalId = setInterval(() => get().refresh(), updateInterval);
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
            const p = calculateProgress(time, await getSunData(time));
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