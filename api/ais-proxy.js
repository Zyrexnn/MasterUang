// api/ais-proxy.js (For Vercel Deployment)
// This function acts as a bridge between the client and AISStream.io
// It injects the secret API Key server-side to prevent client exposure.

import WebSocket from 'ws';

export default async function handler(req, res) {
    if (req.method === 'GET' && req.headers.upgrade === 'websocket') {
        // Note: Vercel standard serverless functions don't support standard WB upgrades easily.
        // However, if deployed on a Node.js runtime (like AWS Lambda or a custom server), this works.
        // For Vercel, consider using a separate Node server or a proxy service if 100% real-time is required.

        const API_KEY = process.env.AIS_KEY || "";
        const AIS_URL = "wss://stream.aisstream.io/v0/stream";

        const wss = new WebSocket.Server({ noServer: true });

        wss.on('connection', (clientWs) => {
            console.log('Client connected to AIS Proxy');

            const aisWs = new WebSocket(AIS_URL);

            aisWs.on('open', () => {
                console.log('Connected to AISStream.io');
            });

            aisWs.on('message', (message) => {
                if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(message.toString());
                }
            });

            clientWs.on('message', (message) => {
                try {
                    const sub = JSON.parse(message);
                    // Inject the real API Key
                    sub.APIKey = API_KEY;
                    if (aisWs.readyState === WebSocket.OPEN) {
                        aisWs.send(JSON.stringify(sub));
                    }
                } catch (e) {
                    console.error('Proxy Error: Parsing failed');
                }
            });

            aisWs.on('close', () => clientWs.close());
            clientWs.on('close', () => aisWs.close());
        });

        // Handle the upgrade manually
        wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
            wss.emit('connection', ws, req);
        });
    } else {
        res.status(426).send('Upgrade Required');
    }
}
