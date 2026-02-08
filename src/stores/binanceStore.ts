import { defineStore } from 'pinia';
import { ref, onUnmounted } from 'vue';

export interface BinanceTicker {
    symbol: string;
    lastPrice: string;
    priceChangePercent: string;
    highPrice: string;
    lowPrice: string;
    volume: string;
    quoteVolume: string;
}

export const useBinanceStore = defineStore('binance', () => {
    const tickers = ref<Record<string, BinanceTicker>>({});
    const klines = ref<Record<string, any[]>>({});
    const loading = ref(false);
    const error = ref<string | null>(null);
    const ws = ref<WebSocket | null>(null);
    const activeSymbols = ref([
        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT', 'DOTUSDT', 'TRXUSDT',
        'MATICUSDT', 'SHIBUSDT', 'LTCUSDT', 'UNIUSDT', 'LINKUSDT', 'ATOMUSDT', 'XLMUSDT', 'ETCUSDT', 'FILUSDT', 'HBARUSDT',
        'VETUSDT', 'AAVEUSDT', 'ALGOUSDT', 'QNTUSDT', 'EGLDUSDT', 'AXSUSDT', 'SANDUSDT', 'EOSUSDT', 'THETAUSDT', 'MANAUSDT',
        'FTMUSDT', 'IMXUSDT', 'RUNEUSDT', 'SNXUSDT', 'GRTUSDT', 'FLOWUSDT', 'CHZUSDT', 'NEOUSDT', 'XTZUSDT', 'CRVUSDT',
        'KAVAUSDT', 'ZECUSDT', 'MKRUSDT', 'IOTAUSDT', 'BSVUSDT', 'KLAYUSDT', 'DASHUSDT', 'STXUSDT', 'ZILUSDT', 'ENJUSDT',
        'BCHUSDT', 'COMPUSDT'
    ]);

    const initWebSocket = (symbols: string[]) => {
        if (ws.value) {
            ws.value.close();
        }

        const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/');
        ws.value = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);

        ws.value.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.e === '24hrTicker') {
                tickers.value[data.s] = {
                    symbol: data.s,
                    lastPrice: data.c,
                    priceChangePercent: data.P,
                    highPrice: data.h,
                    lowPrice: data.l,
                    volume: data.v,
                    quoteVolume: data.q
                };
            }
        };

        ws.value.onerror = (err) => {
            console.error('WebSocket Error:', err);
            error.value = 'Real-time connection error. Retrying...';
        };
    };

    const fetchMarketData = async (symbols: string[] = activeSymbols.value) => {
        if (loading.value && symbols.length > 10) return; // Prevent double trigger

        loading.value = true;
        error.value = null;

        // Batching Strategy: Split symbols into chunks of 15 to avoid URL length limits and proxy timeouts
        const BATCH_SIZE = 15;
        const batches = [];
        for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
            batches.push(symbols.slice(i, i + BATCH_SIZE));
        }

        try {
            const promises = batches.map(async (batch) => {
                const symbolsParam = JSON.stringify(batch);
                // Try direct Binance API first
                try {
                    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`;
                    const res = await fetch(url);
                    if (!res.ok) throw new Error('Direct API Failed');
                    return await res.json();
                } catch (e) {
                    // Fallback to Proxy
                    console.log(`[Store] Switching to Proxy for batch...`);
                    const targetUrl = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`;
                    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
                    const res = await fetch(proxyUrl);
                    if (!res.ok) throw new Error('Proxy API Failed');
                    return await res.json();
                }
            });

            const results = await Promise.all(promises);

            // Merge all results
            results.forEach((data: BinanceTicker[]) => {
                if (Array.isArray(data)) {
                    data.forEach(item => {
                        tickers.value[item.symbol] = item;
                    });
                }
            });

            // Initialize WebSocket for real-time updates (All symbols)
            initWebSocket(symbols);

        } catch (err: any) {
            error.value = 'Failed to load market data. Retrying with reduced set...';
            console.error('Market Data Batch Fetch Error:', err);
            // Safety Fallback: Load at least top 5 if everything fails
            if (Object.keys(tickers.value).length === 0) {
                await fetchMarketData(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT']);
            }
        } finally {
            loading.value = false;
        }
    };

    const fetchKlines = async (symbol: string, interval: string = '1h', limit: number = 500) => {
        const endpoints = [
            'https://api.binance.com',
            'https://api1.binance.com',
            'https://api2.binance.com',
            'https://api3.binance.com'
        ];

        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        console.log(`[Store] Fetching ${symbol} @ ${interval}`);

        for (const base of endpoints) {
            try {
                const url = `${base}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
                console.log(`[Store] Direct try: ${base}`);

                let response: any = await fetch(url).catch(() => null);

                if (!response || !response.ok) {
                    console.log(`[Store] Attempting Proxy for ${base}`);
                    response = await fetch(`${proxyUrl}${encodeURIComponent(url)}`).catch(() => null);
                }

                if (!response || !response.ok) continue;

                const data = await response.json();
                if (!Array.isArray(data) || data.length === 0) continue;

                console.log(`[Store] Success: ${data.length} klines raw`);

                // ApexCharts uses MS, Lightweight-charts uses S
                // We'll store MS and some components can convert if needed
                const formattedData = data.map((d: any) => ({
                    time: d[0], // Keep as ms
                    open: parseFloat(d[1]),
                    high: parseFloat(d[2]),
                    low: parseFloat(d[3]),
                    close: parseFloat(d[4]),
                    volume: parseFloat(d[5])
                })).sort((a: any, b: any) => a.time - b.time);

                // Dedup
                const uniqueData = Array.from(new Map(formattedData.map((item: any) => [item.time, item])).values());

                klines.value[symbol] = uniqueData;
                return uniqueData;
            } catch (err: any) {
                console.warn(`[Store] Failed node ${base}:`, err.message);
            }
        }

        console.error('[Store] Exhausted all uplink nodes');
        return [];
    };

    const addSymbol = (symbol: string) => {
        const formatted = symbol.toUpperCase().endsWith('USDT') ? symbol.toUpperCase() : `${symbol.toUpperCase()}USDT`;
        if (!activeSymbols.value.includes(formatted)) {
            activeSymbols.value.push(formatted);
            fetchMarketData(activeSymbols.value);
        }
        return formatted;
    };

    onUnmounted(() => { 
        if (ws.value) ws.value.close();
    });


    

    return {
        tickers,
        klines,
        loading,
        error,
        activeSymbols,
        fetchMarketData,
        fetchKlines,
        addSymbol
    };
});
