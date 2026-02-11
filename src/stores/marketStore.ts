import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface MarketIndex {
    symbol: string;
    description: string;
    current: number;
    change: number; // Percentage
    previousClose: number;
    updatedAt: number; // Timestamp
}

export const useMarketStore = defineStore('market', () => {
    const indices = ref<MarketIndex[]>([]); // e.g., IHSG, S&P 500
    const commodities = ref<MarketIndex[]>([]); // Gold, Silver
    const localStocks = ref<MarketIndex[]>([]); // BBCA, TLKM

    const loading = ref(false);
    const error = ref<string | null>(null);

    // Cache duration: 2 minutes
    const CACHE_TTL = 120 * 1000;

    const fetchIndexData = async (symbol: string, name: string): Promise<MarketIndex | null> => {
        try {
            // Attempt 1: Finnhub
            const res = await fetch(`/api/finnhub-proxy?symbol=${encodeURIComponent(symbol)}`);
            if (res.ok) {   
                const data = await res.json();
                // Finnhub response: c (current), pc (previous close), dp (percent change)
                if (data.c) {
                    return {
                        symbol,
                        description: name,
                        current: data.c,
                        change: data.dp || ((data.c - data.pc) / data.pc) * 100,
                        previousClose: data.pc,
                        updatedAt: Date.now()
                    };
                }
            }
            throw new Error('Finnhub failed');
        } catch (err) {
            console.warn(`[MarketStore] Cache miss/fail for ${symbol}. Trying fallback...`);
            // Attempt 2: Twelve Data Fallback
            try {
                // Map symbol if needed (e.g. ^JKSE -> IDX:JKSE)
                const twSymbol = symbol === '^JKSE' ? 'IDX:JKSE' : symbol;
                const res = await fetch(`/api/twelve-proxy?symbol=${encodeURIComponent(twSymbol)}`);
                if (res.ok) {
                    const data = await res.json();
                    // Twelve response: close (current), percent_change, previous_close
                    if (data.close) {
                        return {
                            symbol,
                            description: name,
                            current: parseFloat(data.close),
                            change: parseFloat(data.percent_change),
                            previousClose: parseFloat(data.previous_close),
                            updatedAt: Date.now()
                        };
                    }
                }
            } catch (e) {
                console.error(`[MarketStore] All providers failed for ${symbol}`);
            }
        }
        return null;
    }

    const fetchMarketData = async (force: boolean = false) => {
        if (!force && indices.value.length > 0) {
            const isFresh = (Date.now() - indices.value[0].updatedAt) < CACHE_TTL;
            if (isFresh) return; 
        }

        loading.value = true;
        error.value = null;

        const targets = [   
            { s: '^JKSE', n: 'IHSG (IDX)', type: 'INDEX' },
            { s: '^GSPC', n: 'S&P 500', type: 'INDEX' },
            { s: 'XAU', n: 'Gold (XAU)', type: 'COMMODITY' }, // Finnhub uses XAU? No, likely 'OANDA:XAU_USD' or just custom. Let's try to map XAUUSD if Finnhub supports it or fallback.
            // Actually Finnhub supports 'BINANCE:BTCUSDT' etc, for Gold it might be different. 
            // Finnhub Forex/Crypto: OANDA:XAU_USD 
            // Twelve: XAU/USD
            { s: 'XAG', n: 'Silver', type: 'COMMODITY' },
            { s: 'BBCA.JK', n: 'BCA', type: 'STOCK' },
            { s: 'TLKM.JK', n: 'Telkom', type: 'STOCK' },
            { s: 'ASII.JK', n: 'Astra', type: 'STOCK' },
            { s: 'BMRI.JK', n: 'Mandiri', type: 'STOCK' }
        ];

        try {
            const results = await Promise.all(
                targets.map(t => {
                    // Logic to adjust symbol for providers
                    // Finnhub Gold: often requires specific exchange or use Twelve defaults
                    let sym = t.s;
                    if (t.s === 'XAU') sym = 'OANDA:XAU_USD'; // Try OANDA
                    if (t.s === 'XAG') sym = 'OANDA:XAG_USD';

                    return fetchIndexData(sym, t.n).then(data => ({ ...data, type: t.type, originalSymbol: t.s }));
                })
            );

            // Clear arrays
            indices.value = [];
            commodities.value = [];
            localStocks.value = [];

            results.forEach((item: any) => {
                if (!item || !item.current) return;

                if (item.type === 'INDEX') indices.value.push(item);
                else if (item.type === 'COMMODITY') commodities.value.push(item);
                else if (item.type === 'STOCK') localStocks.value.push(item);
            });

        } catch (e: any) {
            error.value = 'Data partially unavailable';
        } finally {
            // FIX: If NO data was loaded (all APIs failed), load mock data so user sees SOMETHING
            if (indices.value.length === 0 && localStocks.value.length === 0 && commodities.value.length === 0) {
                console.warn('[MarketStore] APIs yielded 0 results. Activating Simulation Mode for demo.');

                indices.value = [
                    { symbol: '^JKSE', description: 'IHSG (IDX)', current: 7323.54, change: 0.45, previousClose: 7290.1, updatedAt: Date.now() },
                    { symbol: '^GSPC', description: 'S&P 500', current: 5240.12, change: -0.21, previousClose: 5251.2, updatedAt: Date.now() },
                    { symbol: '^DJI', description: 'Dow Jones', current: 39120.80, change: 0.15, previousClose: 39060.5, updatedAt: Date.now() },
                ];
                commodities.value = [
                    { symbol: 'XAU', description: 'Gold (XAU)', current: 2345.60, change: 1.25, previousClose: 2316.4, updatedAt: Date.now() },
                    { symbol: 'XAG', description: 'Silver', current: 28.15, change: 2.10, previousClose: 27.56, updatedAt: Date.now() },
                ];
                localStocks.value = [
                    { symbol: 'BBCA.JK', description: 'Bank Central Asia', current: 9850, change: 1.03, previousClose: 9750, updatedAt: Date.now() },
                    { symbol: 'TLKM.JK', description: 'Telkom Indonesia', current: 3450, change: -1.43, previousClose: 3500, updatedAt: Date.now() },
                    { symbol: 'ASII.JK', description: 'Astra International', current: 5125, change: 0.00, previousClose: 5125, updatedAt: Date.now() },
                    { symbol: 'BMRI.JK', description: 'Bank Mandiri', current: 7200, change: 2.13, previousClose: 7050, updatedAt: Date.now() }
                ];
                error.value = 'Simulated Data (Live API Unavailable)';
            }
            loading.value = false;
        }
    };

    return {
        indices,
        commodities,
        localStocks,
        fetchMarketData,
        loading,
        error
    };
});
