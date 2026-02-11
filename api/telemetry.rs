// api/telemetry.rs — Aggregator Telemetry (Rust Serverless)
// Endpoint: GET /api/telemetry?limit=300
//
// Fetches aircraft data from OpenSky Network server-side,
// filters & transforms into clean JSON for the front-end.

use serde::Serialize;
use serde_json::{json, Value};
use vercel_runtime::{run, service_fn, Error, Request};

// ── Response Types ─────────────────────────────────

#[derive(Serialize)]
struct Aircraft {
    icao24: String,
    callsign: String,
    origin: String,
    lat: f64,
    lng: f64,
    altitude: f64,
    geo_altitude: f64,
    velocity: f64,
    heading: f64,
    vertical_rate: f64,
    on_ground: bool,
    squawk: Option<String>,
    category: u8,
    position_source: String,
    last_update: f64,
}

#[derive(Serialize)]
struct TelemetryResponse {
    aircraft: Vec<Aircraft>,
    total_global: usize,
    timestamp: u64,
}

// ── Constants ──────────────────────────────────────

const OPENSKY_URL: &str = "https://opensky-network.org/api/states/all";

const POSITION_SOURCES: &[&str] = &["ADS-B", "ASTERIX", "MLAT", "FLARM"];

const CATEGORY_NAMES: &[(u8, &str)] = &[
    (0, "Unknown"), (1, "No Info"), (2, "Light"),
    (3, "Small"),   (4, "Large"),  (5, "High Vortex"),
    (6, "Heavy"),   (7, "High Performance"), (8, "Rotorcraft"),
    (9, "Glider"),  (10, "Lighter-than-air"), (11, "Parachutist"),
    (12, "Ultralight"), (14, "UAV/Drone"), (15, "Space Vehicle"),
];

// ── Main ───────────────────────────────────────────

#[tokio::main]
async fn main() -> Result<(), Error> {
    run(service_fn(handler)).await
}

async fn handler(req: Request) -> Result<Value, Error> {
    // Parse query params
    let url = req.uri();
    let query: Vec<(String, String)> = url
        .query()
        .map(|q| {
            q.split('&')
                .filter_map(|pair| {
                    let mut parts = pair.splitn(2, '=');
                    Some((parts.next()?.to_string(), parts.next()?.to_string()))
                })
                .collect()
        })
        .unwrap_or_default();

    let limit: usize = query
        .iter()
        .find(|(k, _)| k == "limit")
        .and_then(|(_, v)| v.parse().ok())
        .unwrap_or(300);

    // ── Fetch OpenSky ──────────────────────────────
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .unwrap_or_default();

    // Optional auth (higher rate limits)
    let username = std::env::var("OPENSKY_USERNAME").ok();
    let password = std::env::var("OPENSKY_PASSWORD").ok();

    let mut request = client.get(OPENSKY_URL);
    if let (Some(u), Some(p)) = (&username, &password) {
        if !u.is_empty() && !p.is_empty() {
            request = request.basic_auth(u, Some(p));
        }
    }

    let response = match request.send().await {
        Ok(r) => r,
        Err(e) => {
            return Ok(json!({
                "statusCode": 502,
                "headers": { "Content-Type": "application/json" },
                "body": json!({ "error": format!("OpenSky unreachable: {}", e) }).to_string()
            }));
        }
    };

    if response.status() == 429 {
        return Ok(json!({
            "statusCode": 429,
            "headers": {
                "Content-Type": "application/json",
                "Retry-After": "120"
            },
            "body": json!({
                "error": "Rate limited by OpenSky. Try again in 2 minutes.",
                "is_rate_limited": true
            }).to_string()
        }));
    }

    if !response.status().is_success() {
        return Ok(json!({
            "statusCode": response.status().as_u16(),
            "headers": { "Content-Type": "application/json" },
            "body": json!({ "error": "OpenSky API error" }).to_string()
        }));
    }

    let data: Value = match response.json().await {
        Ok(d) => d,
        Err(e) => {
            return Ok(json!({
                "statusCode": 502,
                "headers": { "Content-Type": "application/json" },
                "body": json!({ "error": format!("Failed to parse OpenSky data: {}", e) }).to_string()
            }));
        }
    };

    // ── Transform & Filter ─────────────────────────
    let states = data["states"].as_array();
    let total_global = states.map(|s| s.len()).unwrap_or(0);

    let aircraft: Vec<Aircraft> = states
        .map(|states| {
            states
                .iter()
                .filter_map(|s| {
                    let arr = s.as_array()?;
                    // Must have lat (index 6) and lng (index 5)
                    let lng = arr.get(5)?.as_f64()?;
                    let lat = arr.get(6)?.as_f64()?;

                    // Skip invalid coordinates
                    if lat == 0.0 && lng == 0.0 { return None; }
                    if lat > 90.0 || lat < -90.0 { return None; }

                    let pos_source_idx = arr.get(16)
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0) as usize;

                    let category = arr.get(17)
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0) as u8;

                    Some(Aircraft {
                        icao24: arr.get(0)?.as_str()?.to_string(),
                        callsign: arr.get(1)
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .trim()
                            .to_string(),
                        origin: arr.get(2)
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string(),
                        lat,
                        lng,
                        altitude: arr.get(7).and_then(|v| v.as_f64()).unwrap_or(0.0),
                        geo_altitude: arr.get(13)
                            .and_then(|v| v.as_f64())
                            .or_else(|| arr.get(7).and_then(|v| v.as_f64()))
                            .unwrap_or(0.0),
                        on_ground: arr.get(8).and_then(|v| v.as_bool()).unwrap_or(false),
                        velocity: arr.get(9).and_then(|v| v.as_f64()).unwrap_or(0.0),
                        heading: arr.get(10).and_then(|v| v.as_f64()).unwrap_or(0.0),
                        vertical_rate: arr.get(11).and_then(|v| v.as_f64()).unwrap_or(0.0),
                        squawk: arr.get(14).and_then(|v| v.as_str()).map(String::from),
                        position_source: POSITION_SOURCES
                            .get(pos_source_idx)
                            .unwrap_or(&"Unknown")
                            .to_string(),
                        category,
                        last_update: arr.get(4)
                            .and_then(|v| v.as_f64())
                            .map(|t| t * 1000.0)
                            .unwrap_or(0.0),
                    })
                })
                .take(limit)
                .collect()
        })
        .unwrap_or_default();

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;

    let response = TelemetryResponse {
        aircraft,
        total_global,
        timestamp: now,
    };

    Ok(json!({
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Cache-Control": "s-maxage=120, stale-while-revalidate=60"
        },
        "body": serde_json::to_string(&response).unwrap_or_default()
    }))
}
