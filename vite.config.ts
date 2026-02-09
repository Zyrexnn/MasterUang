import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { WebSocketServer, WebSocket } from 'ws'

const AIS_KEY = process.env.AIS_KEY || "";
const AIS_URL = "wss://stream.aisstream.io/v0/stream";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [
      vue(),
      {
        name: 'ais-dev-proxy',
        configureServer(server) {
          // 1. WebSocket Proxy (Keep existing for legacy/stream mode)
          const wss = new WebSocketServer({ noServer: true });
          server.httpServer?.on('upgrade', (req, socket, head) => {
            const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
            if (url.pathname === '/api/ais-proxy') {
              wss.handleUpgrade(req, socket, head, (ws) => {
                // ... (Existing WebSocket logic kept as fallback)
                const aisWs = new WebSocket(AIS_URL);
                aisWs.on('open', () => { console.log('🌐 [WS Proxy] Uplink Active'); });
                aisWs.on('message', (d) => { if (ws.readyState === 1) ws.send(d.toString()); });
                ws.on('message', (d) => {
                  const sub = JSON.parse(d.toString());
                  if (sub.APIKey === "SERVER_INJECTED") sub.APIKey = AIS_KEY;
                  if (aisWs.readyState === 1) aisWs.send(JSON.stringify(sub));
                  else aisWs.once('open', () => aisWs.send(JSON.stringify(sub)));
                });
                aisWs.on('close', () => ws.close());
                ws.on('close', () => aisWs.close());
              });
            }
          });

          // 2. HTTP Polling Proxy (New for Vercel Polling Mode)
          server.middlewares.use('/api/ais-fetch', async (req, res, next) => {
            if (req.method === 'POST') {
              console.log('📡 [HTTP Proxy] Polling Request Received');

              // Read body
              const buffers = [];
              for await (const chunk of req) {
                buffers.push(chunk);
              }
              const body = JSON.parse(Buffer.concat(buffers).toString());

              const vessels: Record<string, any> = {};
              console.log('⚓ [HTTP Proxy] Opening Short-Lived Uplink...');

              // Execute short-lived Fetch
              const aisWs = new WebSocket(AIS_URL);
              let timeout: NodeJS.Timeout;

              const finish = () => {
                if (timeout) clearTimeout(timeout);
                aisWs.close();
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ vessels, timestamp: Date.now() }));
                console.log(`✅ [HTTP Proxy] Snapshotted ${Object.keys(vessels).length} vessels`);
              };

              aisWs.on('open', () => {
                const sub = {
                  APIKey: AIS_KEY,
                  BoundingBoxes: body.BoundingBoxes || [[[-11, 95], [6, 141]]],
                  FilterMessageTypes: ["PositionReport", "ShipStaticData"]
                };
                aisWs.send(JSON.stringify(sub));

                // Collect for 4 seconds then close
                timeout = setTimeout(finish, 4000);
              });

              aisWs.on('message', (rawData) => {
                try {
                  const data = JSON.parse(rawData.toString());
                  const mmsi = data.MetaData?.MMSI || data.Metadata?.MMSI;
                  if (mmsi) {
                    if (!vessels[mmsi]) {
                      vessels[mmsi] = {
                        mmsi,
                        name: data.MetaData?.ShipName?.trim() || 'UNKNOWN',
                        position: { lat: 0, lng: 0 },
                        sog: 0, cog: 0, heading: 0,
                        lastUpdate: Date.now()
                      };
                    }
                    const v = vessels[mmsi];
                    const msg = data.Message?.PositionReport || data.Message?.ShipStaticData || data.Message;
                    if (data.MessageType === 'PositionReport') {
                      v.position = { lat: msg.Latitude, lng: msg.Longitude };
                      v.sog = msg.Sog; v.cog = msg.Cog; v.heading = msg.TrueHeading;
                    } else if (data.MessageType === 'ShipStaticData') {
                      v.name = msg.Name?.trim() || v.name;
                    }
                  }
                } catch (e) { }
              });

              aisWs.on('error', (err) => {
                console.error('Proxy Error', err);
                finish();
              });

            } else {
              next();
            }
          });

          // 3. Finnhub Proxy (Local Dev)
          server.middlewares.use('/api/finnhub-proxy', async (req, res) => {
            const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
            const symbol = url.searchParams.get('symbol') || '^JKSE';
            const token = process.env.FINNHUB_KEY || "";

            try {
              const apiRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`);
              const data = await apiRes.json();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Proxy Error' }));
            }
          });

          // 4. Twelve Data Proxy (Local Dev)
          server.middlewares.use('/api/twelve-proxy', async (req, res) => {
            const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
            const symbol = url.searchParams.get('symbol') || 'IDX:JKSE';
            const apikey = process.env.TWELVE_KEY || "";

            try {
              const apiRes = await fetch(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apikey}`);
              const data = await apiRes.json();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Proxy Error' }));
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/binance-api': {
          target: 'https://data-api.binance.vision',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/binance-api/, ''),
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('proxy error', err);
            });
          }
        },
      },
    },
  }
})
