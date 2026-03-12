import { useState, useEffect } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { Interval, DateTime } from 'luxon';
import { fromEpochSec, SleepLogic } from '../db/logic';
import { SleepSessionRecord } from '../db/types';

const LOADING_TIMEOUT = 300;
const POLL_SIZE = 2;
const PREFETCH_BUFFER_MS = 100;

const expandInterval = (interval: Interval, n: number) => {
    if (!interval?.isValid || !interval.start || !interval.end) {
        throw new Error(`[StatsScreen] Invalid Luxon interval: ${interval?.invalidExplanation}`);
    }

    const durationMs = interval.toDuration().as("milliseconds");
    const shift = durationMs * n;

    return Interval.fromDateTimes(
        interval.start.minus({ milliseconds: shift }),
        interval.end.plus({ milliseconds: shift })
    );
};

const useStats = (initialRange?: Interval) => {
    const now = DateTime.now();
    const defaultRange = initialRange ?? Interval.fromDateTimes(
        now.minus({ week: 1 }),
        now
    );

    const [isLoading, setLoading] = useState(false);
    const [currentRange, setCurrentRange] = useState(defaultRange);
    const [fetchedRange, setFetchedRange] = useState(expandInterval(defaultRange, POLL_SIZE));

    const fetchedSessions = useSharedValue<SleepSessionRecord[]>([]);
    const currentSessions = useSharedValue<SleepSessionRecord[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            if (!fetchedRange || !currentRange) return;

            const startNearEdge = currentRange.start! <= fetchedRange.start!.plus({ milliseconds: PREFETCH_BUFFER_MS });
            const endNearEdge = currentRange.end! >= fetchedRange.end!.minus({ milliseconds: PREFETCH_BUFFER_MS });

            if (startNearEdge || endNearEdge) {
                let loadingShown = false;
                const timer = setTimeout(() => {
                    setLoading(true);
                    loadingShown = true;
                }, LOADING_TIMEOUT);

                const newRange = expandInterval(fetchedRange, POLL_SIZE);

                try {
                    const newSessions = await SleepLogic.list({
                        rangeStart: newRange.start!,
                        rangeEnd: newRange.end!,
                        
                    });
                    fetchedSessions.value = [...fetchedSessions.value, ...newSessions];
                    setFetchedRange(newRange);
                } finally {
                    clearTimeout(timer);
                    if (loadingShown) setLoading(false);
                }
            };

            currentSessions.value = fetchedSessions.value.filter(s => {
                const start = fromEpochSec(s.start);
                const end = fromEpochSec(s.end);
                return start >= currentRange.start! && end <= currentRange.end!;
            });
        }
        fetchStats();
    }, [currentRange]);

    return {
        isLoading,
        currentRange,
        setCurrentRange,
        currentSessions,
        fetchedSessions,
    };
}

export default useStats;