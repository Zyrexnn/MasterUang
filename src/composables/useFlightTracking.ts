import { shallowRef, ref, onMounted, onUnmounted, computed } from 'vue';

export interface Aircraft {
    icao24: string;
    callsign: string;
    lat: number;
    lng: number;
    altitude: number;
    geoAltitude: number;
    velocity: number;
    heading: number;
    verticalRate: number;
    origin: string;
    onGround: boolean;
    squawk: string | null;
    category: number;
    positionSource: string;
    lastUpdate: number;
}

export interface MapBounds {
    south: number;
    west: number;
    north: number;
    east: number;
}

const CACHE_DURATION = 120000; // 2 minutes - don't fetch if cache is fresh

const CATEGORY_NAMES: Record<number, string> = {
    0: 'Unknown', 1: 'No Info', 2: 'Light (<15,500 lbs)',
    3: 'Small (15,500-75,000 lbs)', 4: 'Large (75,000-300,000 lbs)',
    5: 'High Vortex Large', 6: 'Heavy (>300,000 lbs)',
    7: 'High Performance', 8: 'Rotorcraft', 9: 'Glider',
    10: 'Lighter-than-air', 11: 'Parachutist', 12: 'Ultralight',
    14: 'UAV/Drone', 15: 'Space Vehicle'
};

const POSITION_SOURCES: Record<number, string> = {
    0: 'ADS-B', 1: 'ASTERIX', 2: 'MLAT', 3: 'FLARM'
};

export function useFlightTracking() {
    // Use shallowRef to avoid deep reactivity on large datasets
    const cachedAircraft = shallowRef<Aircraft[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const activeCount = ref(0);
    const lastFetchTime = ref(Date.now());
    const selectedAircraftId = ref<string | null>(null);
    const isFollowing = ref(false);
    const isRateLimited = ref(false);

    // aircraftList is now just a direct reference — no interpolation overhead
    const aircraftList = computed(() => cachedAircraft.value);

    const fetchAircraft = async (force = false) => {
        // Check if we should skip due to recent fetch
        const timeSinceLastFetch = Date.now() - lastFetchTime.value;
        if (!force && timeSinceLastFetch < CACHE_DURATION && cachedAircraft.value.length > 0) {
            return;
        }

        if (isLoading.value) return;
        isLoading.value = true;
        error.value = null;

        try {
            const response = await fetch('https://opensky-network.org/api/states/all');

            if (response.status === 429) {
                isRateLimited.value = true;
                throw new Error('Rate Limited - Wait 2 min');
            }

            if (!response.ok) throw new Error('Connection Lost');

            isRateLimited.value = false;
            const apiData = await response.json();

            if (!apiData.states) {
                cachedAircraft.value = [];
                activeCount.value = 0;
                return;
            }

            const newAircraft: Aircraft[] = [];

            // Limit to 300 aircraft for performance
            for (const s of apiData.states) {
                if (newAircraft.length >= 300) break;
                if (s[5] !== null && s[6] !== null) {
                    newAircraft.push({
                        icao24: s[0],
                        callsign: (s[1] || '').trim() || 'UNKN',
                        origin: s[2],
                        lng: s[5],
                        lat: s[6],
                        altitude: s[7] || 0,
                        geoAltitude: s[13] || s[7] || 0,
                        onGround: s[8] || false,
                        velocity: s[9] || 0,
                        heading: s[10] || 0,
                        verticalRate: s[11] || 0,
                        squawk: s[14] || null,
                        positionSource: POSITION_SOURCES[s[16]] || 'Unknown',
                        category: s[17] || 0,
                        lastUpdate: (s[4] || Date.now() / 1000) * 1000
                    });
                }
            }

            cachedAircraft.value = newAircraft;
            activeCount.value = apiData.states.length;
            lastFetchTime.value = Date.now();
        } catch (err: any) {
            error.value = err.message;
        } finally {
            isLoading.value = false;
        }
    };

    const selectedAircraft = computed(() => {
        if (!selectedAircraftId.value) return null;
        return aircraftList.value.find(a => a.icao24 === selectedAircraftId.value) || null;
    });

    const getCategoryName = (cat: number) => CATEGORY_NAMES[cat] || 'Unknown';

    let timer: number;

    onMounted(() => {
        fetchAircraft();
        // Auto-refresh every 2 minutes
        timer = window.setInterval(() => fetchAircraft(), 120000);
    });

    onUnmounted(() => {
        clearInterval(timer);
    });

    return {
        aircraftList,
        selectedAircraft,
        selectedAircraftId,
        isFollowing,
        isLoading,
        error,
        isRateLimited,
        activeCount,
        lastFetchTime,
        fetchAircraft: () => fetchAircraft(true), // Force fetch on manual refresh
        getCategoryName
    };
}
