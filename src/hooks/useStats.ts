import { useState, useEffect } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { Interval, DateTime } from 'luxon';
import { fromEpochSec, SleepLogic } from '../db/logic';
import { SleepSessionRecord } from '../db/types';

const LOADING_TIMEOUT = 300;
const POLL_SIZE = 2;
const PREFETCH_BUFFER_MS = 86400000; // 24*60*60*1000 (ms in a day)

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

    let initial = true;
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

            let sessions = fetchedSessions.value;

            if (startNearEdge || endNearEdge || initial) {
                initial = false;

                let loadingShown = false;
                const timer = setTimeout(() => {
                    setLoading(true);
                    loadingShown = true;
                }, LOADING_TIMEOUT);

                const newRange = expandInterval(currentRange, POLL_SIZE);

                try {
                    // TODO: fetch chunk not all
                    const newSessions = await SleepLogic.list({
                        rangeStart: newRange.start!,
                        rangeEnd: newRange.end!,
                    });

                    console.log(`Fetch
                        range:
                        ${newRange.start?.toLocal()} -> ${newRange.end?.toLocal()}
                        
                        seshs:
                        ${JSON.stringify(newSessions.map(x => fromEpochSec(x.end).toLocal()), null, 2)}
                    `);

                    fetchedSessions.value = newSessions;
                    sessions = newSessions;
                    setFetchedRange(newRange);
                } finally {
                    clearTimeout(timer);
                    if (loadingShown) setLoading(false);
                }
            };

            // TODO:  match?: "overlapping" | "contained" 
            currentSessions.value = sessions.filter(s => {
                const sessionEnd = fromEpochSec(s.end);
                const sessionStart = fromEpochSec(s.start);
                return sessionEnd >= currentRange.start! && sessionStart <= currentRange.end!;
            });

            console.log(`Current
                    range:
                    ${currentRange.start?.toLocal()} -> ${currentRange.end?.toLocal()}

                    sheshs:
                    ${JSON.stringify(currentSessions.value.map(x => fromEpochSec(x.end).toLocal()), null, 2)}
                    `);
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