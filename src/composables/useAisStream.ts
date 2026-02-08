import { ref, onMounted, onUnmounted } from 'vue';
import { useAisStore } from '../stores/aisStore';

export function useAisStream() {
    const store = useAisStore();
    const socket = ref<WebSocket | null>(null);
    const reconnectAttempts = ref(0);
    const maxReconnectAttempts = 5;
    const backoffBase = 2000;

    const proxyUrl = import.meta.env.DEV
        ? `ws://${window.location.host}/api/ais-proxy`
        : `wss://${window.location.host}/api/ais-proxy`;

    const connect = () => {
        console.log('📡 [AIS] Initializing Satellite Uplink...');
        store.setError(null);

        try {
            // Using a more robust URL resolution
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            const fullUrl = `${protocol}//${host}/api/ais-proxy`;

            console.log(`📡 [AIS] Target Node: ${fullUrl}`);
            socket.value = new WebSocket(fullUrl);

            socket.value.onopen = () => {
                console.log('✅ [AIS] Handshake Successful. Transmitting Subscription...');
                store.setConnectionStatus(true);
                reconnectAttempts.value = 0;

                // Subscription: Reset to Indonesia to prevent lag
                const subscription = {
                    APIKey: "SERVER_INJECTED",
                    BoundingBoxes: [[[-11, 95], [6, 141]]], // Indonesia Archipelago
                    FilterMessageTypes: ["PositionReport", "ShipStaticData"]
                };

                if (socket.value && socket.value.readyState === 1) {
                    socket.value.send(JSON.stringify(subscription));
                }
            };

            socket.value.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const mmsi = data.MetaData?.MMSI || data.Metadata?.MMSI || data.MetaData?.mmsi || data.Metadata?.mmsi;
                    if (mmsi) {
                        store.updateVessel(mmsi, data);
                        if (store.stats.totalPackets % 50 === 0) {
                            console.log(`📦 [AIS] Live Packet Burst: ${store.stats.totalPackets} updates received`);
                        }
                    }
                } catch (e) {
                    console.error('AIS Data Corruption:', e);
                }
            };

            socket.value.onclose = () => {
                console.warn('⚠️ AIS Protocol Severed');
                store.setConnectionStatus(false);
                handleReconnect();
            };

            socket.value.onerror = (err) => {
                console.error('❌ AIS Protocol Error:', err);
                store.setError('Connection Failure');
            };
        } catch (e) {
            console.error('AIS Initialization Failed:', e);
            store.setError('Initialization Failed');
        }
    };

    const handleReconnect = () => {
        if (reconnectAttempts.value <    maxReconnectAttempts) {
            const delay = Math.pow(2, reconnectAttempts.value) * backoffBase;
            console.log(`🔄 Attempting Protocol Re-sync in ${delay}ms...`);
            setTimeout(() => {
                reconnectAttempts.value++;
                connect();
            }, delay);
        } else {
            store.setError('Max reconnection attempts reached');
        }
    };

    const disconnect = () => {
        if (socket.value) {
            socket.value.close();
            socket.value = null;
        }
    };

    let cleanupInterval: any;

    onMounted(() => {
        connect();
        cleanupInterval = setInterval(() => {
            store.clearOldVessels();
        }, 30000);
    });

    onUnmounted(() => {         
        disconnect();
        if (cleanupInterval) clearInterval(cleanupInterval);
    });

    return {
        isConnected: () => store.isConnected,
        error: () => store.error,
        stats: () => store.stats,
        vessels: () => store.vessels
    };
}
