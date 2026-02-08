export default async function handler(request, response) {
    const symbol = request.query.symbol || '^JKSE';
    // Use env var or fallback to the key provided in the prompt (for immediate functionality)
    const token = process.env.FINNHUB_KEY || 'd60rg89r01qto1re62cgd60rg89r01qto1re62d0';

    try {
        const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`;
        const res = await fetch(url);

        if (!res.ok) {
            // Handle 429 specifically if possible, otherwise generic error
            if (res.status === 429) {
                return response.status(429).json({ error: 'Rate Limit Exceeded' });
            }
            return response.status(res.status).json({ error: 'Upstream Error' });
        }

        const data = await res.json();

        // Add Vercel Edge Caching (60s fresh, stale-while-revalidate allowed)
        response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
        return response.status(200).json(data);
    } catch (error) {
        return response.status(500).json({ error: 'Internal Function Error' });
    }
}
