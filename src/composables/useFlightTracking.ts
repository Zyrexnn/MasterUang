import { ref, onMounted, onUnmounted, computed } from 'vue';

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
    baseLat: number;
    baseLng: number;
    fetchTime: number;
}

export interface MapBounds {
    south: number;
    west: number;
    north: number;
    east: number;
}

const CACHE_KEY = 'masteruang_flight_cache';
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

const velocityToLatLng = (velocity: number, heading: number) => {
    const headingRad = (heading * Math.PI) / 180;
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = 111320 * Math.cos((10 * Math.PI) / 180);
    return {
        latDelta: (velocity * Math.cos(headingRad)) / metersPerDegreeLat,
        lngDelta: (velocity * Math.sin(headingRad)) / metersPerDegreeLng
    };
};

// Load from localStorage
const loadCache = (): { data: Record<string, Aircraft>; time: number } | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) {
        console.warn('Cache load failed:', e);
    }
    return null;
};

// Save to localStorage
const saveCache = (data: Record<string, Aircraft>, time: number) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, time }));
    } catch (e) {
        console.warn('Cache save failed:', e);
    }
};

export function useFlightTracking() {
    const cachedAircraft = ref<Record<string, Aircraft>>({});
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const activeCount = ref(0);
    const lastFetchTime = ref(Date.now());
    const selectedAircraftId = ref<string | null>(null);
    const isFollowing = ref(false);
    const isRateLimited = ref(false);

    // Interpolated positions
    const aircraftList = computed(() => {
        const now = Date.now();
        return Object.values(cachedAircraft.value).map(ac => {
            const elapsed = (now - ac.fetchTime) / 1000;
            if (!ac.onGround && ac.velocity > 10 && elapsed < 300) {
                const { latDelta, lngDelta } = velocityToLatLng(ac.velocity, ac.heading);
                return {
                    ...ac,
                    lat: ac.baseLat + (latDelta * elapsed),
                    lng: ac.baseLng + (lngDelta * elapsed)
                };
            }
            return ac;
        });
    });

    const fetchAircraft = async (force = false) => {
        // Check if we should skip due to recent fetch
        const timeSinceLastFetch = Date.now() - lastFetchTime.value;
        if (!force && timeSinceLastFetch < CACHE_DURATION && Object.keys(cachedAircraft.value).length > 0) {
            console.log('Using cached data, skip fetch');
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
                cachedAircraft.value = {};
                activeCount.value = 0;
                return;
            }

            const now = Date.now();
            const newAircraft: Record<string, Aircraft> = {};

            apiData.states.slice(0, 600).forEach((s: any) => {
                if (s[5] !== null && s[6] !== null) {
                    newAircraft[s[0]] = {
                        icao24: s[0],
                        callsign: (s[1] || '').trim() || 'UNKN',
                        origin: s[2],
                        lng: s[5],
                        lat: s[6],
                        baseLat: s[6],
                        baseLng: s[5],
                        altitude: s[7] || 0,
                        geoAltitude: s[13] || s[7] || 0,
                        onGround: s[8] || false,
                        velocity: s[9] || 0,
                        heading: s[10] || 0,
                        verticalRate: s[11] || 0,
                        squawk: s[14] || null,
                        positionSource: POSITION_SOURCES[s[16]] || 'Unknown',
                        category: s[17] || 0,
                        lastUpdate: (s[4] || Date.now() / 1000) * 1000,
                        fetchTime: now
                    };
                }
            });

            cachedAircraft.value = newAircraft;
            activeCount.value = apiData.states.length;
            lastFetchTime.value = now;

            // Save to localStorage
            saveCache(newAircraft, now);
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
    let interpolationTimer: number;

    onMounted(() => {
        // Try to load from cache first
        const cached = loadCache();
        if (cached && (Date.now() - cached.time) < CACHE_DURATION) {
            console.log('Loaded from localStorage cache');
            cachedAircraft.value = cached.data;
            lastFetchTime.value = cached.time;
            activeCount.value = Object.keys(cached.data).length;
        } else {
            // Only fetch if cache is stale or empty
            fetchAircraft();
        }

        // Auto-refresh every 2 minutes
        timer = window.setInterval(() => fetchAircraft(), 120000);

        // Interpolation tick every 3 seconds
        interpolationTimer = window.setInterval(() => {
            lastFetchTime.value = lastFetchTime.value; // Trigger reactivity
        }, 3000);
    });

    onUnmounted(() => {
        clearInterval(timer);
        clearInterval(interpolationTimer);
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
