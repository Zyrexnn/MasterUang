// api/ai_advisor.rs — AI Advisor Proxy (Rust Serverless)
use serde::{Deserialize, Serialize};
use serde_json::json;
use vercel_runtime::{run, service_fn, Error, Request};
use http::{Response, StatusCode};
use http_body_util::{BodyExt, Full};
use bytes::Bytes;

type Body = Full<Bytes>;

#[derive(Deserialize)]
struct AdvisorRequest {
    prompt: String,
    context: String,
}

#[derive(Serialize)]
struct AdvisorResponse {
    reply: String,
    model: String,
}

#[derive(Deserialize)]
struct GeminiResponse {
    candidates: Option<Vec<GeminiCandidate>>,
    error: Option<GeminiError>,
}

#[derive(Deserialize)]
struct GeminiCandidate {
    content: Option<GeminiContent>,
}

#[derive(Deserialize)]
struct GeminiContent {
    parts: Option<Vec<GeminiPart>>,
}

#[derive(Deserialize)]
struct GeminiPart {
    text: Option<String>,
}

#[derive(Deserialize)]
struct GeminiError {
    message: Option<String>,
    status: Option<String>,
}

const GEMINI_MODEL: &str = "gemini-2.5-flash";
const GEMINI_BASE_URL: &str = "https://generativelanguage.googleapis.com/v1/models";

#[tokio::main]
async fn main() -> Result<(), Error> {
    run(service_fn(handler)).await
}

pub async fn handler(req: Request) -> Result<Response<Body>, Error> {
    let api_key = match std::env::var("GEMINI_API_KEY") {
        Ok(k) if !k.is_empty() => k,
        _ => {
            let res = json!({
                "error": "GEMINI_API_KEY not configured on server",
                "reply": "Maaf, layanan AI belum dikonfigurasi."
            }).to_string();
            return Ok(Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .header("Content-Type", "application/json")
                .body(Full::new(Bytes::from(res)))?);
        }
    };

    let body_bytes = req.into_body().collect().await?.to_bytes();
    let body: AdvisorRequest = match serde_json::from_slice(&body_bytes) {
        Ok(b) => b,
        Err(_) => {
            let res = json!({ "error": "Invalid JSON body" }).to_string();
            return Ok(Response::builder()
                .status(StatusCode::BAD_REQUEST)
                .header("Content-Type", "application/json")
                .body(Full::new(Bytes::from(res)))?);
        }
    };

    let system_prompt = format!(
        "Context: {}\n\nUser Question: {}\n\nInstructions: Provide short, professional financial advice as MasterUang AI Advisor. Respond in Indonesian unless the user speaks English.",
        body.context, body.prompt
    );

    let gemini_url = format!("{}/{}:generateContent?key={}", GEMINI_BASE_URL, GEMINI_MODEL, api_key);
    let client = reqwest::Client::new();
    
    let res = client.post(&gemini_url)
        .json(&json!({
            "contents": [{ "parts": [{ "text": system_prompt }] }]
        }))
        .send()
        .await?;

    let gemini_data: GeminiResponse = res.json().await?;

    if let Some(err) = gemini_data.error {
        let res = json!({ "error": err.message, "reply": "Layanan AI error." }).to_string();
        return Ok(Response::builder()
            .status(StatusCode::BAD_GATEWAY)
            .header("Content-Type", "application/json")
            .body(Full::new(Bytes::from(res)))?);
    }

    let ai_text = gemini_data.candidates
        .and_then(|c| c.into_iter().next())
        .and_then(|c| c.content)
        .and_then(|c| c.parts)
        .and_then(|p| p.into_iter().next())
        .and_then(|p| p.text)
        .unwrap_or_else(|| "Maaf, saya tidak dapat merespon.".to_string());

    let result = AdvisorResponse {
        reply: ai_text,
        model: GEMINI_MODEL.to_string(),
    };

    let final_res = serde_json::to_string(&result)?;
    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(Full::new(Bytes::from(final_res)))?)
}
