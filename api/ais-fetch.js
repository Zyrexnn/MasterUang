// api/ais-fetch.js (Vercel Serverless Function)
import WebSocket from 'ws';

const AIS_KEY = process.env.AIS_KEY || "";
const AIS_URL = "wss://stream.aisstream.io/v0/stream";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { BoundingBoxes } = req.body;
    const vessels = {};

    // Fallback if no API Key is provided
    if (!AIS_KEY) {
        console.log('⚠️ [AIS Serverless] No AIS_KEY. Generating simulated data...');
        const bbox = BoundingBoxes?.[0] || [[-11, 95], [6, 141]];
        const minLat = Math.min(bbox[0][0], bbox[1][0]);
        const maxLat = Math.max(bbox[0][0], bbox[1][0]);
        const minLng = Math.min(bbox[0][1], bbox[1][1]);
        const maxLng = Math.max(bbox[0][1], bbox[1][1]);

        for (let i = 0; i < 20; i++) {
            const mmsi = 990000000 + i;
            vessels[mmsi] = {
                mmsi,
                name: `DEMO_SHIP_${i + 1}`,
                position: {
                    lat: minLat + Math.random() * (maxLat - minLat),
                    lng: minLng + Math.random() * (maxLng - minLng)
                },
                sog: Math.random() * 12,
                cog: Math.random() * 360,
                heading: Math.random() * 360,
                lastUpdate: Date.now(),
                isSimulated: true
            };
        }
        res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=15');
        return res.status(200).json({ vessels, timestamp: Date.now(), isSimulated: true });
    }

    console.log('📡 [Serverless AIS] Initiating 8s Uplink Burst...');

    const promise = new Promise((resolve) => {
        const ws = new WebSocket(AIS_URL);

        const timeout = setTimeout(() => {
            ws.close();
            resolve(vessels);
        }, 8000); // Collect for 8 seconds

        ws.on('open', () => {
            const subscription = {
                APIKey: AIS_KEY,
                BoundingBoxes: BoundingBoxes || [[[-11, 95], [6, 141]]],
                FilterMessageTypes: ["PositionReport", "ShipStaticData"]
            };
            ws.send(JSON.stringify(subscription));
        });

        ws.on('message', (rawData) => {
            try {
                const data = JSON.parse(rawData.toString());
                const mmsi = data.MetaData?.MMSI || data.Metadata?.MMSI;

                if (mmsi) {
                    const msg = data.Message?.PositionReport || data.Message?.ShipStaticData || data.Message;

                    // Data Validation
                    if (data.MessageType === 'PositionReport') {
                        if (msg.Latitude === 0 && msg.Longitude === 0) return;
                        if (msg.Latitude > 90 || msg.Latitude < -90) return;
                    }

                    if (!vessels[mmsi]) {
                        vessels[mmsi] = {
                            mmsi,
                            name: data.MetaData?.ShipName?.trim() || 'UNKNOWN',
                            position: { lat: 0, lng: 0 },
                            sog: 0,
                            cog: 0,
                            heading: 0,
                            lastUpdate: Date.now()
                        };
                    }

                    const vessel = vessels[mmsi];
                    if (data.MessageType === 'PositionReport') {
                        vessel.position = { lat: msg.Latitude, lng: msg.Longitude };
                        vessel.sog = msg.Sog;
                        vessel.cog = msg.Cog;
                        vessel.heading = msg.TrueHeading;
                    } else if (data.MessageType === 'ShipStaticData') {
                        vessel.name = msg.Name?.trim() || vessel.name;
                    }
                }
            } catch (e) {
                // Silent fail on single packet
            }
        });

        ws.on('error', (err) => {
            console.error('WS Error:', err);
            clearTimeout(timeout);
            ws.close();
            resolve(vessels);
        });

        ws.on('close', () => {
            clearTimeout(timeout);
            resolve(vessels);
        });
    });

    const result = await promise;

    // Set Cache-Control for Vercel Edge Caching (1 minute)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    res.status(200).json({
        vessels: result,
        timestamp: Date.now(),
        count: Object.keys(result).length
    });
}
