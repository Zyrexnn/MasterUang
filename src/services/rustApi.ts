// src/services/rustApi.ts — Vue → Rust Serverless Bridge
// Service layer untuk memanggil Rust API endpoints.
// Semua endpoints berjalan di /api/* (Vercel auto-routing).

// ════════════════════════════════════════════════════
//  Types
// ════════════════════════════════════════════════════

export interface Transaction {
    name: string
    category: string
    amount: number
    type: 'income' | 'expense'
    date: string
}

export interface CompoundInterestParams {
    principal: number
    rate: number               // e.g. 0.065 = 6.5%
    compounds_per_year: number // e.g. 12
    years: number
}

export interface AnalyzeResult {
    income: number
    expenses: number
    balance: number
    savings_rate: number
    category_distribution: Record<string, number>
    monthly_stats: { label: string; income: number; expense: number }[]
    compound_interest?: {
        future_value: number
        total_interest: number
        principal: number
        effective_rate: number
        monthly_breakdown: { month: number; value: number }[]
    }
}

export interface Aircraft {
    icao24: string
    callsign: string
    origin: string
    lat: number
    lng: number
    altitude: number
    geo_altitude: number
    velocity: number
    heading: number
    vertical_rate: number
    on_ground: boolean
    squawk: string | null
    category: number
    position_source: string
    last_update: number
}

export interface TelemetryResult {
    aircraft: Aircraft[]
    total_global: number
    timestamp: number
}

export interface AiAdvisorResult {
    reply: string
    model: string
}

// ════════════════════════════════════════════════════
//  API Functions
// ════════════════════════════════════════════════════

/**
 * Financial Math — Analisis transaksi + bunga majemuk
 * Endpoint: POST /api/analyze
 */
export async function analyzeTransactions(
    transactions: Transaction[],
    compoundInterest?: CompoundInterestParams
): Promise<AnalyzeResult> {
    const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            transactions,
            compound_interest: compoundInterest ?? null,
        }),
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Analyze API error: ${res.status}`)
    }

    return res.json()
}

/**
 * Telemetry Aggregator — Ambil data pesawat dari server
 * Endpoint: GET /api/telemetry?limit=300
 */
export async function fetchTelemetry(limit = 300): Promise<TelemetryResult> {
    const res = await fetch(`/api/telemetry?limit=${limit}`)

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))

        // Special handling for rate limiting
        if (res.status === 429) {
            throw new Error('Rate Limited - Wait 2 min')
        }

        throw new Error(err.error || `Telemetry API error: ${res.status}`)
    }

    return res.json()
}

/**
 * AI Advisor Proxy — Kirim pesan ke Gemini lewat Rust backend
 * Endpoint: POST /api/ai_advisor
 *
 * API key Gemini tersimpan aman di server, tidak ter-expose di browser.
 */
export async function sendAiMessage(
    prompt: string,
    context: string
): Promise<string> {
    const res = await fetch('/api/ai_advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context }),
    })

    const data: AiAdvisorResult | { reply?: string; error?: string } =
        await res.json().catch(() => ({}))

    // Even on error, try to return a user-friendly reply
    if ('reply' in data && data.reply) {
        return data.reply
    }

    if (!res.ok) {
        return 'Maaf, layanan AI sedang sibuk. Silakan coba lagi nanti.'
    }

    return 'Maaf, tidak ada respons dari AI.'
}
