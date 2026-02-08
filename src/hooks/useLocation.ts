import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationState {
    location: Location.LocationObject | null;
    errorMsg: string | null;
    loading: boolean;
}

export const useLocation = () => {
    const [state, setState] = useState<LocationState>({
        location: null,
        errorMsg: null,
        loading: true,
    });

    useEffect(() => {
        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setState({ location: null, errorMsg: 'Permission denied', loading: false });
                    return;
                }

                let loc = await Location.getCurrentPositionAsync({});
                setState({ location: loc, errorMsg: null, loading: false });
            } catch (e) {
                setState({ location: null, errorMsg: 'Failed to fetch location', loading: false });
            }
        })();
    }, []);

    return state;
};