// api/cmc-proxy.js
// Standard Node.js Serverless Function for Vercel

export default async function handler(req, res) {
    // 1. Handle CORS (Optional but recommended if calling from other subdomains)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 2. Security Check (Basic)
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests allowed' });
    }

    try {
        const { symbol } = req.query;
        const items = symbol || 'BTC,ETH,SOL,BNB,XRP';

        // CoinMarketCap API Key from Server-side Environment Variable
        // DO NOT prefix with VITE_ for Vercel to keep it private
        const apiKey = process.env.CMC_API_KEY;

        if (!apiKey) {
            console.error('CMC_API_KEY is missing on server');
            return res.status(500).json({
                status: { error_code: 500, error_message: 'Server configuration error: Key missing' }
            });
        }

        // CMC V2 Endpoint (Quotes Latest)
        const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${items}&convert=USD`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-CMC_PRO_API_KEY': apiKey,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        // 3. Handle CMC Specific Errors
        if (!response.ok || data.status?.error_code !== 0) {
            const statusCode = response.status === 401 ? 401 : response.status === 429 ? 429 : 502;
            return res.status(statusCode).json(data);
        }

        // Success response
        return res.status(200).json(data);

    } catch (error) {
        console.error('Proxy Fetch Error:', error);
        return res.status(500).json({
            status: { error_code: 1000, error_message: 'Failed to connect to CoinMarketCap' }
        });
    }
}
