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

const GEMINI_MODEL: &str = "gemini-2.0-flash"; // Using 2.0 Flash as the standard
const GEMINI_BASE_URL: &str = "https://generativelanguage.googleapis.com/v1/models";

#[tokio::main]
async fn main() -> Result<(), Error> {
    run(service_fn(handler)).await
}

pub async fn handler(req: Request) -> Result<Response<String>, Error> {
    // ── Validate API Key ───────────────────────────
    let api_key = match std::env::var("GEMINI_API_KEY") {
        Ok(k) if !k.is_empty() => k,
        _ => {
            return Ok(Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .header("Content-Type", "application/json")
                .body(json!({
                    "error": "GEMINI_API_KEY not configured",
                    "reply": "Maaf, sistem AI sedang offline karena API Key belum dikonfigurasi."
                }).to_string())?);
        }
    };

    // ── Parse Request Body ───────
    let body_bytes = req.into_body().collect().await?.to_bytes();
    let body: AdvisorRequest = match serde_json::from_slice(&body_bytes) {
        Ok(b) => b,
        Err(_) => {
            return Ok(Response::builder()
                .status(StatusCode::BAD_REQUEST)
                .header("Content-Type", "application/json")
                .body(json!({ "error": "Payload tidak valid" }).to_string())?);
        }
    };

    // ── System Persona & Instructions ────────────────
    let system_instructions = "
    Anda adalah 'MasterUang AI Advisor', asisten keuangan elit dengan gaya bicara profesional, tajam, dan analitis layaknya analis Bloomberg. 
    Tujuan Anda adalah membantu pengguna mengelola keuangan mereka dengan bijak berdasarkan data transaksi yang diberikan.

    Karakteristik Jawaban:
    1. Profesional & Analitis: Gunakan istilah keuangan yang tepat namun mudah dimengerti. 
    2. Data-Driven: Selalu rujuk ke data saldo atau kategori pengeluaran jika tersedia di context.
    3. Actionable: Berikan saran konkret, bukan hanya teori (misal: 'Anda bisa menghemat 10% dengan mengurangi kategori Hiburan').
    4. Hemat Kata: Jangan terlalu bertele-tele. To-the-point namun sopan.
    5. Formatting: Gunakan Markdown (bold, bullet points) untuk membuat struktur jawaban yang jelas.

    Gunakan Bahasa Indonesia secara default, kecuali jika pengguna bertanya dalam bahasa lain.
    ";

    let context_data = format!("Context Keuangan Pengguna:\n{}\n\nUser Prompt: {}", body.context, body.prompt);

    let gemini_url = format!("{}/{}:generateContent?key={}", GEMINI_BASE_URL, GEMINI_MODEL, api_key);
    let client = reqwest::Client::new();
    
    let res = client.post(&gemini_url)
        .json(&json!({
            "contents": [
                {
                    "role": "user",
                    "parts": [{ "text": format!("{}\n\n{}", system_instructions, context_data) }]
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "topP": 0.8,
                "maxOutputTokens": 1024
            }
        }))
        .send()
        .await?;

    let gemini_data: GeminiResponse = res.json().await?;

    if let Some(err) = gemini_data.error {
        return Ok(Response::builder()
            .status(StatusCode::BAD_GATEWAY)
            .header("Content-Type", "application/json")
            .body(json!({ "error": err.message, "reply": "Layanan pemrosesan AI sedang mengalami gangguan (Upstream Error)." }).to_string())?);
    }

    let ai_text = gemini_data.candidates
        .and_then(|c| c.into_iter().next())
        .and_then(|c| c.content)
        .and_then(|c| c.parts)
        .and_then(|p| p.into_iter().next())
        .and_then(|p| p.text)
        .unwrap_or_else(|| "Maaf, sistem gagal mensintesa jawaban. Silakan coba beberapa saat lagi.".to_string());

    let result = AdvisorResponse {
        reply: ai_text,
        model: GEMINI_MODEL.to_string(),
    };

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(serde_json::to_string(&result)?)?)
}
