export default async function handler(request, response) {
    const symbol = request.query.symbol || 'IDX:JKSE';
    // Use env var or fallback to the key provided in the prompt
    const apikey = process.env.TWELVE_KEY || '3af8fc1ac3af4260affaaca4d7fefdea';

    try {
        const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apikey}`;
        const res = await fetch(url);

        if (!res.ok) {
            return response.status(res.status).json({ error: 'Upstream Error' });
        }

        const data = await res.json();

        // Check for API-level errors (Twelve Data often returns 200 with error body)
        if (data.status === 'error' || data.code === 429) {
            return response.status(429).json(data);
        }

        // Add Vercel Edge Caching
        response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
        return response.status(200).json(data);
    } catch (error) {
        return response.status(500).json({ error: 'Internal Function Error' });
    }
}
