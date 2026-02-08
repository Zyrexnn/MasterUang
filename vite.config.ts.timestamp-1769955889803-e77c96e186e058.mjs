// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/ikhsa/Documents/latihan/MasterUang/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/ikhsa/Documents/latihan/MasterUang/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
import { WebSocketServer, WebSocket } from "file:///C:/Users/ikhsa/Documents/latihan/MasterUang/node_modules/ws/wrapper.mjs";
var __vite_injected_original_dirname = "C:\\Users\\ikhsa\\Documents\\latihan\\MasterUang";
var AIS_KEY = "2cc55d8ebda9b80070621b84206429afac05b6a7";
var AIS_URL = "wss://stream.aisstream.io/v0/stream";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [
      vue(),
      {
        name: "ais-proxy",
        configureServer(server) {
          const wss = new WebSocketServer({ noServer: true });
          server.httpServer?.on("upgrade", (req, socket, head) => {
            if (req.url === "/api/ais-proxy") {
              wss.handleUpgrade(req, socket, head, (ws) => {
                console.log("\u{1F4E1} [AIS Proxy] Neural Link Established");
                const aisWs = new WebSocket(AIS_URL);
                aisWs.on("open", () => {
                  console.log("\u2705 [AIS Proxy] Uplink to AISStream.io Active");
                });
                aisWs.on("message", (message) => {
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.send(message.toString());
                  }
                });
                ws.on("message", (message) => {
                  try {
                    const sub = JSON.parse(message.toString());
                    if (sub.APIKey === "SERVER_INJECTED") {
                      sub.APIKey = AIS_KEY;
                      console.log("\u{1F511} [AIS Proxy] Credential Injected into Packet");
                    }
                    if (aisWs.readyState === WebSocket.OPEN) {
                      aisWs.send(JSON.stringify(sub));
                    }
                  } catch (e) {
                    console.error("\u274C [AIS Proxy] Parse Error:", e);
                  }
                });
                aisWs.on("close", () => ws.close());
                ws.on("close", () => aisWs.close());
                aisWs.on("error", (err) => console.error("\u274C [AIS Proxy] Stream Error:", err));
              });
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    server: {
      proxy: {
        "/binance-api": {
          target: "https://data-api.binance.vision",
          changeOrigin: true,
          secure: true,
          rewrite: (path2) => path2.replace(/^\/binance-api/, ""),
          configure: (proxy, options) => {
            proxy.on("error", (err, req, res) => {
              console.log("proxy error", err);
            });
          }
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxpa2hzYVxcXFxEb2N1bWVudHNcXFxcbGF0aWhhblxcXFxNYXN0ZXJVYW5nXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxpa2hzYVxcXFxEb2N1bWVudHNcXFxcbGF0aWhhblxcXFxNYXN0ZXJVYW5nXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9pa2hzYS9Eb2N1bWVudHMvbGF0aWhhbi9NYXN0ZXJVYW5nL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSdcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCB7IFdlYlNvY2tldFNlcnZlciwgV2ViU29ja2V0IH0gZnJvbSAnd3MnXG5cbmNvbnN0IEFJU19LRVkgPSBcIjJjYzU1ZDhlYmRhOWI4MDA3MDYyMWI4NDIwNjQyOWFmYWMwNWI2YTdcIjtcbmNvbnN0IEFJU19VUkwgPSBcIndzczovL3N0cmVhbS5haXNzdHJlYW0uaW8vdjAvc3RyZWFtXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSlcblxuICByZXR1cm4ge1xuICAgIHBsdWdpbnM6IFtcbiAgICAgIHZ1ZSgpLFxuICAgICAge1xuICAgICAgICBuYW1lOiAnYWlzLXByb3h5JyxcbiAgICAgICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgICAgIGNvbnN0IHdzcyA9IG5ldyBXZWJTb2NrZXRTZXJ2ZXIoeyBub1NlcnZlcjogdHJ1ZSB9KTtcblxuICAgICAgICAgIHNlcnZlci5odHRwU2VydmVyPy5vbigndXBncmFkZScsIChyZXEsIHNvY2tldCwgaGVhZCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcS51cmwgPT09ICcvYXBpL2Fpcy1wcm94eScpIHtcbiAgICAgICAgICAgICAgd3NzLmhhbmRsZVVwZ3JhZGUocmVxLCBzb2NrZXQsIGhlYWQsICh3cykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcdUQ4M0RcdURDRTEgW0FJUyBQcm94eV0gTmV1cmFsIExpbmsgRXN0YWJsaXNoZWQnKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGFpc1dzID0gbmV3IFdlYlNvY2tldChBSVNfVVJMKTtcblxuICAgICAgICAgICAgICAgIGFpc1dzLm9uKCdvcGVuJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1x1MjcwNSBbQUlTIFByb3h5XSBVcGxpbmsgdG8gQUlTU3RyZWFtLmlvIEFjdGl2ZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgYWlzV3Mub24oJ21lc3NhZ2UnLCAobWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgaWYgKHdzLnJlYWR5U3RhdGUgPT09IFdlYlNvY2tldC5PUEVOKSB7XG4gICAgICAgICAgICAgICAgICAgIHdzLnNlbmQobWVzc2FnZS50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHdzLm9uKCdtZXNzYWdlJywgKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1YiA9IEpTT04ucGFyc2UobWVzc2FnZS50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1Yi5BUElLZXkgPT09IFwiU0VSVkVSX0lOSkVDVEVEXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICBzdWIuQVBJS2V5ID0gQUlTX0tFWTtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnXHVEODNEXHVERDExIFtBSVMgUHJveHldIENyZWRlbnRpYWwgSW5qZWN0ZWQgaW50byBQYWNrZXQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoYWlzV3MucmVhZHlTdGF0ZSA9PT0gV2ViU29ja2V0Lk9QRU4pIHtcbiAgICAgICAgICAgICAgICAgICAgICBhaXNXcy5zZW5kKEpTT04uc3RyaW5naWZ5KHN1YikpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1x1Mjc0QyBbQUlTIFByb3h5XSBQYXJzZSBFcnJvcjonLCBlKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGFpc1dzLm9uKCdjbG9zZScsICgpID0+IHdzLmNsb3NlKCkpO1xuICAgICAgICAgICAgICAgIHdzLm9uKCdjbG9zZScsICgpID0+IGFpc1dzLmNsb3NlKCkpO1xuICAgICAgICAgICAgICAgIGFpc1dzLm9uKCdlcnJvcicsIChlcnIpID0+IGNvbnNvbGUuZXJyb3IoJ1x1Mjc0QyBbQUlTIFByb3h5XSBTdHJlYW0gRXJyb3I6JywgZXJyKSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgcHJveHk6IHtcbiAgICAgICAgJy9iaW5hbmNlLWFwaSc6IHtcbiAgICAgICAgICB0YXJnZXQ6ICdodHRwczovL2RhdGEtYXBpLmJpbmFuY2UudmlzaW9uJyxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgc2VjdXJlOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9iaW5hbmNlLWFwaS8sICcnKSxcbiAgICAgICAgICBjb25maWd1cmU6IChwcm94eSwgb3B0aW9ucykgPT4ge1xuICAgICAgICAgICAgcHJveHkub24oJ2Vycm9yJywgKGVyciwgcmVxLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3Byb3h5IGVycm9yJywgZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfVxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBK1QsU0FBUyxjQUFjLGVBQWU7QUFDclcsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sVUFBVTtBQUNqQixTQUFTLGlCQUFpQixpQkFBaUI7QUFIM0MsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTSxVQUFVO0FBQ2hCLElBQU0sVUFBVTtBQUdoQixJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxDQUFDO0FBRXZDLFNBQU87QUFBQSxJQUNMLFNBQVM7QUFBQSxNQUNQLElBQUk7QUFBQSxNQUNKO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFDTixnQkFBZ0IsUUFBUTtBQUN0QixnQkFBTSxNQUFNLElBQUksZ0JBQWdCLEVBQUUsVUFBVSxLQUFLLENBQUM7QUFFbEQsaUJBQU8sWUFBWSxHQUFHLFdBQVcsQ0FBQyxLQUFLLFFBQVEsU0FBUztBQUN0RCxnQkFBSSxJQUFJLFFBQVEsa0JBQWtCO0FBQ2hDLGtCQUFJLGNBQWMsS0FBSyxRQUFRLE1BQU0sQ0FBQyxPQUFPO0FBQzNDLHdCQUFRLElBQUksK0NBQXdDO0FBRXBELHNCQUFNLFFBQVEsSUFBSSxVQUFVLE9BQU87QUFFbkMsc0JBQU0sR0FBRyxRQUFRLE1BQU07QUFDckIsMEJBQVEsSUFBSSxrREFBNkM7QUFBQSxnQkFDM0QsQ0FBQztBQUVELHNCQUFNLEdBQUcsV0FBVyxDQUFDLFlBQVk7QUFDL0Isc0JBQUksR0FBRyxlQUFlLFVBQVUsTUFBTTtBQUNwQyx1QkFBRyxLQUFLLFFBQVEsU0FBUyxDQUFDO0FBQUEsa0JBQzVCO0FBQUEsZ0JBQ0YsQ0FBQztBQUVELG1CQUFHLEdBQUcsV0FBVyxDQUFDLFlBQVk7QUFDNUIsc0JBQUk7QUFDRiwwQkFBTSxNQUFNLEtBQUssTUFBTSxRQUFRLFNBQVMsQ0FBQztBQUN6Qyx3QkFBSSxJQUFJLFdBQVcsbUJBQW1CO0FBQ3BDLDBCQUFJLFNBQVM7QUFDYiw4QkFBUSxJQUFJLHVEQUFnRDtBQUFBLG9CQUM5RDtBQUNBLHdCQUFJLE1BQU0sZUFBZSxVQUFVLE1BQU07QUFDdkMsNEJBQU0sS0FBSyxLQUFLLFVBQVUsR0FBRyxDQUFDO0FBQUEsb0JBQ2hDO0FBQUEsa0JBQ0YsU0FBUyxHQUFHO0FBQ1YsNEJBQVEsTUFBTSxtQ0FBOEIsQ0FBQztBQUFBLGtCQUMvQztBQUFBLGdCQUNGLENBQUM7QUFFRCxzQkFBTSxHQUFHLFNBQVMsTUFBTSxHQUFHLE1BQU0sQ0FBQztBQUNsQyxtQkFBRyxHQUFHLFNBQVMsTUFBTSxNQUFNLE1BQU0sQ0FBQztBQUNsQyxzQkFBTSxHQUFHLFNBQVMsQ0FBQyxRQUFRLFFBQVEsTUFBTSxvQ0FBK0IsR0FBRyxDQUFDO0FBQUEsY0FDOUUsQ0FBQztBQUFBLFlBQ0g7QUFBQSxVQUNGLENBQUM7QUFBQSxRQUNIO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUN0QztBQUFBLElBQ0Y7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLE9BQU87QUFBQSxRQUNMLGdCQUFnQjtBQUFBLFVBQ2QsUUFBUTtBQUFBLFVBQ1IsY0FBYztBQUFBLFVBQ2QsUUFBUTtBQUFBLFVBQ1IsU0FBUyxDQUFDQSxVQUFTQSxNQUFLLFFBQVEsa0JBQWtCLEVBQUU7QUFBQSxVQUNwRCxXQUFXLENBQUMsT0FBTyxZQUFZO0FBQzdCLGtCQUFNLEdBQUcsU0FBUyxDQUFDLEtBQUssS0FBSyxRQUFRO0FBQ25DLHNCQUFRLElBQUksZUFBZSxHQUFHO0FBQUEsWUFDaEMsQ0FBQztBQUFBLFVBQ0g7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsicGF0aCJdCn0K
