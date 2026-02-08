// api/ais-fetch.js (Vercel Serverless Function)
import WebSocket from 'ws';

const AIS_KEY = "2cc55d8ebda9b80070621b84206429afac05b6a7";
const AIS_URL = "wss://stream.aisstream.io/v0/stream";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { BoundingBoxes } = req.body;
    const vessels = {};
    let isDone = false;

    console.log('📡 [Serverless AIS] Initiating 5s Uplink Burst...');

    const promise = new Promise((resolve) => {
        const ws = new WebSocket(AIS_URL);

        const timeout = setTimeout(() => {
            ws.close();
            resolve(vessels);
        }, 5000); // Collect for 5 seconds

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
                    const msg = data.Message?.PositionReport || data.Message?.ShipStaticData || data.Message;

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
