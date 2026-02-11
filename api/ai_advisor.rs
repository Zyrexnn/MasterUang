// api/ai_advisor.rs — AI Advisor Proxy (Rust Serverless)
// Endpoint: POST /api/ai_advisor
//
// Mengamankan GEMINI_API_KEY di server-side.
// Menerima prompt + financial context, forward ke Gemini 2.5 Flash,
// dan mengembalikan AI response.

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use vercel_runtime::{run, service_fn, Error, Request, RequestExt};

// ── Types ──────────────────────────────────────────

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

// Gemini API response structures
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

// ── Constants ──────────────────────────────────────

const GEMINI_MODEL: &str = "gemini-2.5-flash";
const GEMINI_BASE_URL: &str = "https://generativelanguage.googleapis.com/v1/models";

// ── Main ───────────────────────────────────────────

#[tokio::main]
async fn main() -> Result<(), Error> {
    run(service_fn(handler)).await
}

async fn handler(req: Request) -> Result<Value, Error> {
    // ── Validate API Key ───────────────────────────
    let api_key = match std::env::var("GEMINI_API_KEY") {
        Ok(k) if !k.is_empty() => k,
        _ => {
            return Ok(json!({
                "statusCode": 500,
                "headers": { "Content-Type": "application/json" },
                "body": json!({
                    "error": "GEMINI_API_KEY not configured on server",
                    "reply": "Maaf, layanan AI belum dikonfigurasi. Hubungi administrator."
                }).to_string()
            }));
        }
    };

    // ── Parse Request ──────────────────────────────
    let body = match req.payload::<AdvisorRequest>() {
        Ok(Some(b)) => b,
        Ok(None) => {
            return Ok(json!({
                "statusCode": 400,
                "headers": { "Content-Type": "application/json" },
                "body": json!({ "error": "Request body is empty" }).to_string()
            }));
        }
        Err(e) => {
            return Ok(json!({
                "statusCode": 400,
                "headers": { "Content-Type": "application/json" },
                "body": json!({ "error": format!("Invalid JSON: {}", e) }).to_string()
            }));
        }
    };

    // ── Build Gemini Payload ───────────────────────
    let system_prompt = format!(
        "Context: {}\n\n\
         User Question: {}\n\n\
         Instructions: Provide short, professional financial advice as MasterUang AI Advisor. \
         Respond in Indonesian unless the user speaks English. \
         Be concise but thorough. Use bullet points when appropriate.",
        body.context, body.prompt
    );

    let gemini_url = format!(
        "{}/{}:generateContent?key={}",
        GEMINI_BASE_URL, GEMINI_MODEL, api_key
    );

    let gemini_body = json!({
        "contents": [{
            "parts": [{
                "text": system_prompt
            }]
        }]
    });

    // ── Call Gemini API ────────────────────────────
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .unwrap_or_default();

    let response = match client
        .post(&gemini_url)
        .header("Content-Type", "application/json")
        .json(&gemini_body)
        .send()
        .await
    {
        Ok(r) => r,
        Err(e) => {
            return Ok(json!({
                "statusCode": 502,
                "headers": { "Content-Type": "application/json" },
                "body": json!({
                    "error": format!("Failed to reach Gemini: {}", e),
                    "reply": "Gagal terhubung ke AI. Periksa koneksi internet."
                }).to_string()
            }));
        }
    };

    let gemini_data: GeminiResponse = match response.json().await {
        Ok(d) => d,
        Err(e) => {
            return Ok(json!({
                "statusCode": 502,
                "headers": { "Content-Type": "application/json" },
                "body": json!({
                    "error": format!("Invalid Gemini response: {}", e),
                    "reply": "Maaf, respons AI tidak valid. Silakan coba lagi."
                }).to_string()
            }));
        }
    };

    // ── Handle Gemini Errors ───────────────────────
    if let Some(err) = gemini_data.error {
        let msg = err.message.unwrap_or_else(|| "Unknown error".into());
        let status = err.status.unwrap_or_default();

        let reply = if status == "PERMISSION_DENIED" {
            "Akses AI ditolak. API Key tidak valid.".to_string()
        } else {
            format!("Layanan AI error: {}", msg)
        };

        return Ok(json!({
            "statusCode": 502,
            "headers": { "Content-Type": "application/json" },
            "body": json!({ "error": msg, "reply": reply }).to_string()
        }));
    }

    // ── Extract AI Text ────────────────────────────
    let ai_text = gemini_data
        .candidates
        .and_then(|c| c.into_iter().next())
        .and_then(|c| c.content)
        .and_then(|c| c.parts)
        .and_then(|p| p.into_iter().next())
        .and_then(|p| p.text)
        .unwrap_or_else(|| {
            "Maaf, saya tidak dapat merespon saat ini. Silakan coba pertanyaan lain.".to_string()
        });

    let result = AdvisorResponse {
        reply: ai_text,
        model: GEMINI_MODEL.to_string(),
    };

    Ok(json!({
        "statusCode": 200,
        "headers": { "Content-Type": "application/json" },
        "body": serde_json::to_string(&result).unwrap_or_default()
    }))
}
