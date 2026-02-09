// API Service - MasterUang (Super Fail-Safe Version)
export interface CryptoPrice {
    symbol: string; name: string; price: number; change24h: number; marketCap: number; volume24h: number; priceHistory: number[];
}
export interface KlineData { time: number; open: number; high: number; low: number; close: number; volume: number; }
// ... (existing NewsItem interface)
export interface NewsItem {
    title: string;
    url: string;
    source: string;
    time: string;
    category: 'CRYPTO' | 'FINANCE' | 'GEOPOLITICS' | 'WORLD' | 'CRYPTOMAX';
    image?: string;
    description?: string;
}

const symbols = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT', 'DOTUSDT', 'TRXUSDT',
    'LINKUSDT', 'NEARUSDT', 'PEPEUSDT', 'SHIBUSDT', 'SUIUSDT', 'APTUSDT', 'STXUSDT', 'LINKUSDT', 'LTCUSDT', 'BCHUSDT',
    'TONUSDT', 'HBARUSDT', 'UNIUSDT', 'XLMUSDT', 'FILUSDT', 'TIAUSDT', 'OPUSDT', 'ARBUSDT', 'IMXUSDT', 'RENDERUSDT',
    'FETUSDT', 'RUNEUSDT', 'GRTUSDT', 'AAVEUSDT', 'MKRUSDT', 'ENAUSDT', 'JUPUSDT', 'SEIUSDT', 'FLOKIUSDT', 'JASMYUSDT',
    'BONKUSDT', 'NOTUSDT', 'PYTHUSDT', 'WLDUSDT', 'GALAUSDT', 'DYDXUSDT', 'CRVUSDT', 'FTMUSDT', 'ONDOUSDT', 'ORDIUSDT',
    'USDTIDR'
]

let lastIdrPrice = 15650; // Fallback

export function getLatestIdrPrice() {
    return lastIdrPrice;
}

export async function fetchIdrPrice(): Promise<number> {
    try {
        const url = 'https://api.binance.com/api/v3/ticker/price?symbol=USDTIDR'
        const res = await fetch(url)
        const data = await res.json()
        if (data.price) {
            lastIdrPrice = parseFloat(data.price)
            return lastIdrPrice
        }
    } catch (e) {
        console.error('IDR Fetch Error:', e)
    }
    return lastIdrPrice
}

const getMockPrices = (): CryptoPrice[] => {
    const list: CryptoPrice[] = [
        { symbol: 'BTC', name: 'Bitcoin', price: 98450.20, change24h: 2.5, marketCap: 1.9e12, volume24h: 3.5e10, priceHistory: [95000, 97000, 98450] },
        { symbol: 'ETH', name: 'Ethereum', price: 2750.50, change24h: -1.2, marketCap: 3.2e11, volume24h: 1.2e10, priceHistory: [2800, 2760, 2750] },
        { symbol: 'SOL', name: 'Solana', price: 105.80, change24h: 5.4, marketCap: 4.5e10, volume24h: 2.5e9, priceHistory: [95, 100, 105] },
        { symbol: 'BNB', name: 'BNB', price: 780.20, change24h: 0.8, marketCap: 9.2e10, volume24h: 1.1e9, priceHistory: [770, 785, 780] },
        { symbol: 'XRP', name: 'XRP', price: 1.43, change24h: 1.2, marketCap: 8.8e10, volume24h: 2.1e9, priceHistory: [1.4, 1.43] },
        { symbol: 'ADA', name: 'Cardano', price: 0.35, change24h: -0.5, marketCap: 1.2e10, volume24h: 4.5e8, priceHistory: [0.36, 0.35] },
        { symbol: 'TRX', name: 'TRON', price: 0.28, change24h: 0.3, marketCap: 2.4e10, volume24h: 3.2e8, priceHistory: [0.27, 0.28] },
        { symbol: 'AVAX', name: 'Avalanche', price: 34.50, change24h: 2.1, marketCap: 1.4e10, volume24h: 5.4e8, priceHistory: [33, 34.50] },
        { symbol: 'DOT', name: 'Polkadot', price: 6.20, change24h: -1.1, marketCap: 8.5e9, volume24h: 1.8e8, priceHistory: [6.3, 6.20] },
        { symbol: 'DOGE', name: 'Dogecoin', price: 0.12, change24h: 4.5, marketCap: 1.8e10, volume24h: 1.2e9, priceHistory: [0.11, 0.12] }
    ];

    // Fill up to 50 for robust UI
    const extraItems: CryptoPrice[] = Array(40).fill(null).map((_, i) => ({
        symbol: `ALT${i}`,
        name: `Altcoin ${i}`,
        price: 1.25,
        change24h: 0.5,
        marketCap: 1e9,
        volume24h: 1e8,
        priceHistory: [1.2, 1.25]
    }));

    return [...list, ...extraItems];
}

export async function getCryptoPrices(): Promise<CryptoPrice[]> {
    try {
        const url = `https://data-api.binance.vision/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`
        const controller = new AbortController()
        const id = setTimeout(() => controller.abort(), 4000)

        const response = await fetch(url, { signal: controller.signal })
        clearTimeout(id)

        const data = await response.json()
        if (!Array.isArray(data)) return getMockPrices()

        const idrTicker = data.find((item: any) => item.symbol === 'USDTIDR')
        if (idrTicker) {
            lastIdrPrice = parseFloat(idrTicker.lastPrice)
        }

        return data
            .filter((item: any) => item.symbol !== 'USDTIDR')
            .map((item: any) => ({
                symbol: item.symbol.replace('USDT', ''),
                name: item.symbol.replace('USDT', ''),
                price: parseFloat(item.lastPrice) || 0,
                change24h: parseFloat(item.priceChangePercent) || 0,
                marketCap: (parseFloat(item.quoteVolume) || 0) * 110,
                volume24h: parseFloat(item.quoteVolume) || 0,
                priceHistory: [parseFloat(item.lowPrice) || 0, parseFloat(item.lastPrice) || 0]
            }))
    } catch (e) {
        console.error('API Fail:', e)
        return getMockPrices()
    }
}

export async function getKlines(symbol: string, interval: string = '1h'): Promise<KlineData[]> {
    try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=100`
        const response = await fetch(url)
        const data = await response.json()
        return data.map((d: any) => ({
            time: d[0],
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
            volume: parseFloat(d[5])
        }))
    } catch (e) {
        console.error('Klines Fetch Error:', e)
        return []
    }
}

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(data: number[], period: number = 14): number[] {
    const rsi = new Array(data.length).fill(null);
    if (data.length <= period) return rsi;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const diff = data[i] - data[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < data.length; i++) {
        const diff = data[i] - data[i - 1];
        let currentGain = diff >= 0 ? diff : 0;
        let currentLoss = diff < 0 ? -diff : 0;

        avgGain = (avgGain * (period - 1) + currentGain) / period;
        avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

        const rs = avgGain / avgLoss;
        rsi[i] = 100 - (100 / (1 + rs));
    }

    return rsi;
}

/**
 * Calculate EMA (Exponential Moving Average)
 */
export function calculateEMA(data: number[], period: number): number[] {
    const ema = new Array(data.length).fill(null);
    if (data.length < period) return ema;

    const multiplier = 2 / (period + 1);

    // Initial SMA for first EMA
    let sum = 0;
    for (let i = 0; i < period; i++) sum += data[i];
    ema[period - 1] = sum / period;

    for (let i = period; i < data.length; i++) {
        ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
    }

    return ema;
}

const fetchWithTimeout = async (url: string, options: any = {}, timeout: number = 3000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
};

let cachedNews: { data: NewsItem[], time: number } | null = null;
const NEWS_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export async function getCryptoNews(): Promise<NewsItem[]> {
    try {
        const res = await fetchWithTimeout('https://min-api.cryptocompare.com/data/v2/news/?lang=EN')
        const json = await res.json()
        const data = json.Data || []

        return data.map((item: any) => ({
            title: item.title,
            url: item.url,
            source: item.source_info?.name || 'CryptoNews',
            time: new Date(item.published_on * 1000).toLocaleString(),
            category: 'CRYPTO',
            image: item.imageurl,
            description: item.body?.substring(0, 150) + '...'
        }))
    } catch (e) {
        console.error('News Fetch Error:', e)
        return []
    }
}

export async function getGeneralNews(): Promise<NewsItem[]> {
    try {
        const res = await fetchWithTimeout('https://ok.surf/api/v1/cors/news-feed', {}, 4000)
        const data = await res.json()

        let allNews: NewsItem[] = []

        if (data.Business) {
            allNews = [...allNews, ...data.Business.map((item: any) => ({
                title: item.title,
                url: item.link,
                source: item.source,
                time: 'RECENT',
                category: 'FINANCE',
                image: item.og
            }))]
        }

        if (data.World) {
            allNews = [...allNews, ...data.World.map((item: any) => ({
                title: item.title,
                url: item.link,
                source: item.source,
                time: 'RECENT',
                category: 'GEOPOLITICS',
                image: item.og
            }))]
        }

        return allNews
    } catch (e) {
        console.error('General News Fetch Error:', e)
        return []
    }
}

export async function getCryptoMaxNews(): Promise<NewsItem[]> {
    try {
        const res = await fetchWithTimeout('https://news-crypto.vercel.app/api/news', {}, 5000)
        const data = await res.json()

        // Correctly access data.articles
        const items = data.articles || []

        return items.map((item: any) => ({
            title: item.title,
            url: item.link || '#',
            source: item.source || 'CRYPTOMAX',
            time: item.timeAgo || new Date(item.pubDate).toLocaleTimeString() || 'LIVE',
            category: 'CRYPTOMAX',
            image: item.image || item.thumb || null,
            description: (item.description || '').substring(0, 150) + '...'
        }))
    } catch (e) {
        console.error('CryptoMax Fetch Error:', e)
        return []
    }
}

export async function getAggregatedNews(): Promise<NewsItem[]> {
    const now = Date.now();

    // Stale-While-Revalidate: Return cache immediately if available
    if (cachedNews && (now - cachedNews.time < NEWS_CACHE_DURATION)) {
        console.log('📰 Serving News from internal cache');
        return cachedNews.data;
    }

    // Attempt all fetches in parallel
    const results = await Promise.allSettled([
        getCryptoNews(),
        getGeneralNews(),
        getCryptoMaxNews()
    ]);

    const allNews: NewsItem[] = [];
    results.forEach(res => {
        if (res.status === 'fulfilled') {
            allNews.push(...res.value);
        }
    });

    // If we got no news from anyone, return empty or retry with a larger timeout? 
    // No, better return what we have (even empty) to unblock UI.
    if (allNews.length > 0) {
        // Sort by 'time' if possible, or just shuffle deterministic
        const sortedNews = allNews.sort((a, b) => {
            // Priority to CryptoMax and Source Verifications
            if (a.category === 'CRYPTOMAX' && b.category !== 'CRYPTOMAX') return -1;
            if (b.category === 'CRYPTOMAX' && a.category !== 'CRYPTOMAX') return 1;
            return 0;
        });

        cachedNews = { data: sortedNews, time: now };
        return sortedNews;
    }

    return cachedNews?.data || [];
}

/**
 * Quick News: Fetches only the fastest source (CryptoMax) for initial page load.
 * Use this for quick first paint, then call getAggregatedNews for full feed.
 */
export async function getQuickNews(): Promise<NewsItem[]> {
    const now = Date.now();

    // Still use cache if available
    if (cachedNews && (now - cachedNews.time < NEWS_CACHE_DURATION)) {
        console.log('📰 Serving Quick News from cache');
        return cachedNews.data;
    }

    console.log('⚡ Fetching Quick News (CryptoMax only)...');
    try {
        const quickNews = await getCryptoMaxNews();
        if (quickNews.length > 0) {
            // Store as initial cache, will be replaced by full fetch later
            cachedNews = { data: quickNews, time: now };
        }
        return quickNews;
    } catch (e) {
        console.error('Quick News Fetch Error:', e);
        return [];
    }
}

/**
 * Background News Loader: Fetches remaining sources and merges with cache.
 * Call this after getQuickNews for progressive loading.
 */
export async function loadRemainingNews(): Promise<NewsItem[]> {
    console.log('📡 Loading remaining news sources in background...');

    const results = await Promise.allSettled([
        getCryptoNews(),
        getGeneralNews()
    ]);

    const additionalNews: NewsItem[] = [];
    results.forEach(res => {
        if (res.status === 'fulfilled') {
            additionalNews.push(...res.value);
        }
    });

    // Merge with existing cache
    const existingNews = cachedNews?.data || [];
    const allNews = [...existingNews, ...additionalNews];

    // Deduplicate by title
    const seen = new Set<string>();
    const uniqueNews = allNews.filter(item => {
        const key = item.title.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // Sort: CryptoMax first
    const sortedNews = uniqueNews.sort((a, b) => {
        if (a.category === 'CRYPTOMAX' && b.category !== 'CRYPTOMAX') return -1;
        if (b.category === 'CRYPTOMAX' && a.category !== 'CRYPTOMAX') return 1;
        return 0;
    });

    cachedNews = { data: sortedNews, time: Date.now() };
    console.log(`✅ Total news items: ${sortedNews.length}`);
    return sortedNews;
}

export const formatCurrency = (val: number) => `$${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const formatMarketCap = (val: number) => {
    if (!val) return '$0'
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`
    return `$${(val / 1e6).toFixed(2)}M`
}

/**
 * Send message to Gemini AI
 */
export async function sendGeminiMessage(prompt: string, context: string): Promise<string> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    // Use v1 for Gemini 2.5 Flash (GA as of June 2025)
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const body = {
        contents: [{
            parts: [{
                text: `Context: ${context}\n\nUser Question: ${prompt}\n\nInstructions: Provide short, professional financial advice as MasterUang AI Advisor. Respond in Indonesian unless the user speaks English.`
            }]
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (data.error) {
            console.error('Gemini API Error Detail:', JSON.stringify(data.error, null, 2));
            if (data.error.status === 'PERMISSION_DENIED') {
                return "Akses AI ditolak. Periksa apakah API Key Anda valid.";
            }
            return "Maaf, layanan AI sedang sibuk. Silakan coba lagi nanti.";
        }

        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiText) {
            console.warn('Gemini Response Empty:', data);
            return "Maaf, saya tidak dapat merespon saat ini. Silakan coba pertanyaan lain.";
        }

        return aiText;
    } catch (error) {
        console.error('Gemini Fetch Error:', error);
        return "Gagal terhubung ke AI. Periksa koneksi internet Anda.";
    }
}

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV(data: any[], filename: string) {
    if (!data || !data.length) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj =>
        Object.values(obj).map(val => {
            const str = String(val).replace(/"/g, '""');
            return str.includes(',') ? `"${str}"` : str;
        }).join(',')
    ).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
