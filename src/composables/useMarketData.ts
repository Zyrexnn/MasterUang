import { onMounted, onUnmounted, ref } from 'vue';
import { useMarketStore } from '../stores/marketStore';

export function useMarketData(pollIntervalSeconds: number = 60) {
    const marketStore = useMarketStore();
    const isPolling = ref(false);
    let timer: any = null;

    const startPolling = () => {
        if (isPolling.value) return;
        isPolling.value = true;

        // Initial fetch
        marketStore.fetchMarketData();

        timer = setInterval(() => {
            if (document.visibilityState === 'visible') {
                marketStore.fetchMarketData(true); // Force refresh
            }
        }, pollIntervalSeconds * 1000);
    };

    const stopPolling = () => {
        if (timer) clearInterval(timer);
        isPolling.value = false;
        timer = null;
    };

    onMounted(() => {
        startPolling();
    });

    onUnmounted(() => {
        stopPolling();
    });

    return {
        marketStore,
        isPolling,
        stopPolling,
        startPolling
    };
}
