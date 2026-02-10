import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useAisStore } from '../stores/aisStore';

export function useAisPolling() {
    const store = useAisStore();
    const pollingInterval = ref<number | null>(null);
    const isAutoRefreshEnabled = ref(false);

    // Load preference from localStorage (safe)
    try {
        const savedPref = localStorage.getItem('ais_auto_refresh');
        if (savedPref) isAutoRefreshEnabled.value = savedPref === 'true';
    } catch { /* noop */ }

    const fetchVessels = async () => {
        if (store.isPolling) return;

        store.isPolling = true;
        store.error = null;

        try {
            const response = await fetch('/api/ais-fetch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    BoundingBoxes: [store.selectedRegion.bbox],
                })
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) throw new Error('AIS API Key Unauthorized');
                throw new Error('Protocol Sync Failed');
            }

            const data = await response.json();

            // Handle potentially empty or simulated response
            const vesselList = data.vessels || {};
            store.setVessels(vesselList);

            if (data.isSimulated) {
                console.log(`💡 [AIS] Running in Simulation Mode (${Object.keys(vesselList).length} units)`);
            } else {
                console.log(`📡 [AIS] ${store.selectedRegion.name} Sync: ${Object.keys(vesselList).length} units`);
            }
        } catch (err: any) {
            console.error('AIS Sync Error:', err);
            store.error = err.message || 'Network Congestion';
        } finally {
            store.isPolling = false;
        }
    };

    const startPolling = () => {
        if (pollingInterval.value) return;
        // Poll every 90 seconds (Vercel Friendly)
        pollingInterval.value = window.setInterval(fetchVessels, 90000);
        fetchVessels();
    };

    const stopPolling = () => {
        if (pollingInterval.value) {
            clearInterval(pollingInterval.value);
            pollingInterval.value = null;
        }
    };

    watch(isAutoRefreshEnabled, (enabled) => {
        try { localStorage.setItem('ais_auto_refresh', enabled ? 'true' : 'false'); } catch { /* noop */ }
        if (enabled) startPolling();
        else stopPolling();
    });

    // Re-fetch when region changes
    watch(() => store.selectedRegion, () => {
        fetchVessels();
    });

    onMounted(() => {
        if (isAutoRefreshEnabled.value) {
            startPolling();
        } else {
            // Just a single fetch on mount if not auto
            if (Object.keys(store.vessels).length === 0) {
                fetchVessels();
            }
        }
    });

    onUnmounted(() => {
        stopPolling();
    });

    return {
        isPolling: () => store.isPolling,
        isAutoRefreshEnabled,
        fetchVessels,
        lastUpdate: () => store.lastUpdate,
        stats: () => store.stats,
        error: () => store.error
    };
}
