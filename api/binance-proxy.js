// api/binance-proxy.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { path, symbols, symbol, interval, limit } = req.query;
    let targetUrl = `https://api.binance.com/api/v3/${path}?`;

    if (symbols) targetUrl += `symbols=${symbols}`;
    if (symbol) targetUrl += `&symbol=${symbol}`;
    if (interval) targetUrl += `&interval=${interval}`;
    if (limit) targetUrl += `&limit=${limit}`;

    try {
        const response = await fetch(targetUrl);
        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch from Binance' });
    }
}
