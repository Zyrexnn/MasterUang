// api/ai_advisor.rs — AI Advisor Proxy (Rust Serverless)
use serde::{Deserialize, Serialize};
use serde_json::json;
use vercel_runtime::{run, service_fn, Error, Request, Response};
use http::StatusCode;
use http_body_util::BodyExt;

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

// Using 1.5-flash as it is definitely available in v1 endpoint
const GEMINI_MODEL: &str = "gemini-1.5-flash"; 
const GEMINI_BASE_URL: &str = "https://generativelanguage.googleapis.com/v1/models";

#[tokio::main]
async fn main() -> Result<(), Error> {
    run(service_fn(handler)).await
}

pub async fn handler(req: Request) -> Result<Response<String>, Error> {
    let api_key = std::env::var("GEMINI_API_KEY").unwrap_or_default();
    
    if api_key.is_empty() {
        return Ok(Response::builder()
            .status(StatusCode::INTERNAL_SERVER_ERROR)
            .header("Content-Type", "application/json")
            .body(json!({
                "error": "GEMINI_API_KEY_MISSING",
                "reply": "Maaf, API Key belum diatur di Vercel Environment Variables."
            }).to_string())?);
    }

    let body_bytes = req.into_body().collect().await?.to_bytes();
    let body: AdvisorRequest = match serde_json::from_slice(&body_bytes) {
        Ok(b) => b,
        Err(_) => {
            return Ok(Response::builder()
                .status(StatusCode::BAD_REQUEST)
                .body(json!({ "error": "Invalid JSON" }).to_string())?);
        }
    };

    let system_instructions = "Anda adalah 'MasterUang AI Advisor'. Berikan saran finansial yang profesional dan to-the-point.";
    let gemini_url = format!("{}/{}:generateContent?key={}", GEMINI_BASE_URL, GEMINI_MODEL, api_key);
    let client = reqwest::Client::new();
    
    let res = client.post(&gemini_url)
        .json(&json!({
            "contents": [{
                "parts": [{ "text": format!("{}\n\nContext:\n{}\n\nUser Question: {}", system_instructions, body.context, body.prompt) }]
            }]
        }))
        .send()
        .await?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Ok(Response::builder()
            .status(StatusCode::BAD_GATEWAY)
            .body(json!({ "error": "Gemini API Error", "details": err_text }).to_string())?);
    }

    let gemini_data: GeminiResponse = res.json().await?;

    let ai_text = gemini_data.candidates
        .and_then(|c| c.into_iter().next())
        .and_then(|c| c.content)
        .and_then(|c| c.parts)
        .and_then(|p| p.into_iter().next())
        .and_then(|p| p.text)
        .unwrap_or_else(|| "Maaf, AI tidak memberikan respon.".to_string());

    let result = AdvisorResponse {
        reply: ai_text,
        model: GEMINI_MODEL.to_string(),
    };

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(serde_json::to_string(&result)?)?)
}
