// api/telemetry.rs — Aggregator Telemetry (Rust Serverless)
use serde::Serialize;
use serde_json::{json, Value};
use vercel_runtime::{run, service_fn, Error, Request};
use http::{Response, StatusCode};
use http_body_util::Full;
use bytes::Bytes;

type Body = Full<Bytes>;

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

const OPENSKY_URL: &str = "https://opensky-network.org/api/states/all";
const POSITION_SOURCES: &[&str] = &["ADS-B", "ASTERIX", "MLAT", "FLARM"];

#[tokio::main]
async fn main() -> Result<(), Error> {
    run(service_fn(handler)).await
}

pub async fn handler(req: Request) -> Result<Response<Body>, Error> {
    let query_str = req.uri().query().unwrap_or("");
    let limit: usize = query_str.split('&')
        .find(|s| s.starts_with("limit="))
        .and_then(|s| s.split('=').nth(1))
        .and_then(|v| v.parse().ok())
        .unwrap_or(300);

    let client = reqwest::Client::new();
    let username = std::env::var("OPENSKY_USERNAME").ok();
    let password = std::env::var("OPENSKY_PASSWORD").ok();

    let mut request = client.get(OPENSKY_URL);
    if let (Some(u), Some(p)) = (username, password) {
        if !u.is_empty() && !p.is_empty() {
            request = request.basic_auth(u, Some(p));
        }
    }

    let res = match request.send().await {
        Ok(r) => r,
        Err(e) => {
            let err_res = json!({ "error": format!("OpenSky unreachable: {}", e) }).to_string();
            return Ok(Response::builder()
                .status(StatusCode::BAD_GATEWAY)
                .body(Full::new(Bytes::from(err_res)))?);
        }
    };

    if res.status() == 429 {
        let err_res = json!({ "error": "Rate limited" }).to_string();
        return Ok(Response::builder()
            .status(StatusCode::TOO_MANY_REQUESTS)
            .header("Retry-After", "120")
            .body(Full::new(Bytes::from(err_res)))?);
    }

    let data: Value = res.json().await?;
    let states = data["states"].as_array();
    let total_global = states.map(|s| s.len()).unwrap_or(0);

    let aircraft: Vec<Aircraft> = states.map(|s_list| {
        s_list.iter().filter_map(|s| {
            let arr = s.as_array()?;
            let lng = arr.get(5)?.as_f64()?;
            let lat = arr.get(6)?.as_f64()?;
            if (lat == 0.0 && lng == 0.0) || lat > 90.0 || lat < -90.0 { return None; }

            Some(Aircraft {
                icao24: arr.get(0)?.as_str()?.to_string(),
                callsign: arr.get(1).and_then(|v| v.as_str()).unwrap_or("").trim().to_string(),
                origin: arr.get(2).and_then(|v| v.as_str()).unwrap_or("").to_string(),
                lat, lng,
                altitude: arr.get(7).and_then(|v| v.as_f64()).unwrap_or(0.0),
                geo_altitude: arr.get(13).and_then(|v| v.as_f64()).or_else(|| arr.get(7).and_then(|v| v.as_f64())).unwrap_or(0.0),
                on_ground: arr.get(8).and_then(|v| v.as_bool()).unwrap_or(false),
                velocity: arr.get(9).and_then(|v| v.as_f64()).unwrap_or(0.0),
                heading: arr.get(10).and_then(|v| v.as_f64()).unwrap_or(0.0),
                vertical_rate: arr.get(11).and_then(|v| v.as_f64()).unwrap_or(0.0),
                squawk: arr.get(14).and_then(|v| v.as_str()).map(String::from),
                position_source: POSITION_SOURCES.get(arr.get(16).and_then(|v| v.as_u64()).unwrap_or(0) as usize).unwrap_or(&"Unknown").to_string(),
                category: arr.get(17).and_then(|v| v.as_u64()).unwrap_or(0) as u8,
                last_update: arr.get(4).and_then(|v| v.as_f64()).map(|t| t * 1000.0).unwrap_or(0.0),
            })
        }).take(limit).collect()
    }).unwrap_or_default();

    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_millis() as u64;
    let resp_data = TelemetryResponse { aircraft, total_global, timestamp: now };

    let final_res = serde_json::to_string(&resp_data)?;
    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .header("Cache-Control", "s-maxage=120, stale-while-revalidate=60")
        .body(Full::new(Bytes::from(final_res)))?)
}
