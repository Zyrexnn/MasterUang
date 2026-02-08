import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface CoinData {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    marketCap: number;
    lastUpdated: string;
}

export const useCryptoStore = defineStore('crypto', () => {
    const prices = ref<Record<string, CoinData>>({});
    const loading = ref(false);
    const error = ref<string | null>(null);
    const lastFetched = ref<number>(0);

    // Cache TTL: 5 minutes (300,000 ms)
    const CACHE_TTL = 5 * 60 * 1000;

    const fetchQuotes = async (symbols: string = 'BTC,ETH,SOL,BNB,XRP', force = false) => {
        const now = Date.now();

        // Skip if data is fresh (unless forced)
        if (!force && lastFetched.value && (now - lastFetched.value < CACHE_TTL)) {
            console.log('📦 Using cached CMC data');
            return;
        }

        loading.value = true;
        error.value = null;

        try {
            // Logic: Use Vercel path in prod, Vite proxy path in dev
            const baseUrl = import.meta.env.PROD ? '/api/cmc-proxy' : '/cmc-api/v2/cryptocurrency/quotes/latest';
            const url = import.meta.env.PROD ? `${baseUrl}?symbol=${symbols}` : `${baseUrl}?symbol=${symbols}`;

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok || data.status?.error_code !== 0) {
                if (response.status === 429 || data.status?.error_code === 429) {
                    throw new Error('API Rate Limit: Terlalu banyak permintaan. Coba lagi dalam beberapa menit.');
                }
                if (data.status?.error_code === 1006) {
                    throw new Error('Plan Limit: Endpoint V2 tidak didukung oleh plan Free Anda.');
                }
                throw new Error(data.status?.error_message || 'Gagal mengambil data crypto');
            }

            const rawData = data.data;
            const newPrices: Record<string, CoinData> = {};

            Object.keys(rawData).forEach(key => {
                // Handle V2 structure: data[SYMBOL] is an array
                const coin = Array.isArray(rawData[key]) ? rawData[key][0] : rawData[key];
                const quote = coin.quote.USD;

                newPrices[key] = {
                    symbol: coin.symbol,
                    name: coin.name,
                    price: quote.price,
                    change24h: quote.percent_change_24h,
                    marketCap: quote.market_cap,
                    lastUpdated: new Date().toISOString()
                };
            });

            prices.value = newPrices;
            lastFetched.value = now;
            console.log('🚀 CMC Data updated successfully');

        } catch (err: any) {
            console.error('Crypto Store Error:', err);
            error.value = err.message;

            // FALLBACK TO COINGECKO IF CMC FAILS (Standard procedure for Free Plans)
            if (err.message.includes('Plan Limit') || err.message.includes('1006')) {
                console.warn('⚠️ Switching to CoinGecko Fallback...');
                await fetchFallbackQuotes();
            }
        } finally {
            loading.value = false;
        }
    };

    const fetchFallbackQuotes = async () => {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,ripple&vs_currencies=usd&include_24hr_change=true&include_market_cap=true');
            const data = await response.json();

            const mapping: Record<string, string> = {
                'bitcoin': 'BTC',
                'ethereum': 'ETH',
                'solana': 'SOL',
                'binancecoin': 'BNB',
                'ripple': 'XRP'
            };

            const newPrices: Record<string, CoinData> = {};
            Object.keys(data).forEach(id => {
                const symbol = mapping[id];
                newPrices[symbol] = {
                    symbol,
                    name: id.charAt(0).toUpperCase() + id.slice(1),
                    price: data[id].usd,
                    change24h: data[id].usd_24h_change || 0,
                    marketCap: data[id].usd_market_cap || 0,
                    lastUpdated: new Date().toISOString()
                };
            });

            prices.value = newPrices;
            lastFetched.value = Date.now();
            error.value = 'Mode Terbatas: Menggunakan data CoinGecko karena batasan plan CMC.';
        } catch (e) {
            error.value = 'Gagal mengambil data dari semua sumber (CMC & CoinGecko).';
        }
    };

    const news = ref<any[]>([]);
    const newsLoading = ref(false);
    const lastNewsFetched = ref<number>(0);
    const NEWS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

    const fetchNews = async (force = false) => {
        const now = Date.now();
        // Skip if called within 30s (throttling) or if within TTL
        const isThrottled = lastNewsFetched.value && (now - lastNewsFetched.value < 30000);
        const isFresh = lastNewsFetched.value && (now - lastNewsFetched.value < NEWS_CACHE_TTL);

        if (!force && (isThrottled || isFresh)) {
            return;
        }

        newsLoading.value = true;
        try {
            const { getAggregatedNews } = await import('../services/api');
            const data = await getAggregatedNews();
            news.value = data;
            lastNewsFetched.value = now;
        } catch (err) {
            console.error('News fetch failed', err);
        } finally {
            newsLoading.value = false;
        }
    };

    return { prices, loading, error, lastFetched, fetchQuotes, news, newsLoading, fetchNews };
});
