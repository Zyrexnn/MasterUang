// api/analyze.rs — Financial Math Engine (Rust Serverless)
// Endpoint: POST /api/analyze
//
// Menerima data transaksi + parameter bunga majemuk,
// mengembalikan analisis keuangan lengkap.

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use vercel_runtime::{run, service_fn, Error, Request, RequestExt};

// ── Request Types ──────────────────────────────────

#[derive(Deserialize)]
struct AnalyzeRequest {
    #[serde(default)]
    transactions: Vec<Transaction>,
    compound_interest: Option<CompoundInterestParams>,
}

#[derive(Deserialize)]
struct Transaction {
    name: String,
    category: String,
    amount: f64,
    #[serde(rename = "type")]
    tx_type: String, // "income" | "expense"
    date: String,
}

#[derive(Deserialize)]
struct CompoundInterestParams {
    principal: f64,
    rate: f64,              // Annual rate (e.g. 0.065 = 6.5%)
    compounds_per_year: u32, // e.g. 12 for monthly
    years: f64,
}

// ── Response Types ─────────────────────────────────

#[derive(Serialize)]
struct AnalyzeResponse {
    income: f64,
    expenses: f64,
    balance: f64,
    savings_rate: f64,
    category_distribution: HashMap<String, f64>,
    monthly_stats: Vec<MonthStat>,
    compound_interest: Option<CompoundInterestResult>,
}

#[derive(Serialize)]
struct MonthStat {
    label: String,
    income: f64,
    expense: f64,
}

#[derive(Serialize)]
struct CompoundInterestResult {
    future_value: f64,
    total_interest: f64,
    principal: f64,
    effective_rate: f64,
    monthly_breakdown: Vec<MonthlyGrowth>,
}

#[derive(Serialize)]
struct MonthlyGrowth {
    month: u32,
    value: f64,
}

// ── Main ───────────────────────────────────────────

#[tokio::main]
async fn main() -> Result<(), Error> {
    run(service_fn(handler)).await
}

async fn handler(req: Request) -> Result<Value, Error> {
    // Parse JSON body
    let body = match req.payload::<AnalyzeRequest>() {
        Ok(Some(b)) => b,
        Ok(None) => {
            return Ok(json!({
                "statusCode": 400,
                "body": json!({ "error": "Request body is empty" }).to_string()
            }));
        }
        Err(e) => {
            return Ok(json!({
                "statusCode": 400,
                "body": json!({ "error": format!("Invalid JSON: {}", e) }).to_string()
            }));
        }
    };

    // ── Aggregate Transactions ─────────────────────
    let mut income: f64 = 0.0;
    let mut expenses: f64 = 0.0;
    let mut category_dist: HashMap<String, f64> = HashMap::new();
    let mut monthly: HashMap<String, (f64, f64)> = HashMap::new(); // (income, expense)

    for tx in &body.transactions {
        match tx.tx_type.as_str() {
            "income" => income += tx.amount,
            "expense" => {
                let abs = tx.amount.abs();
                expenses += abs;
                *category_dist
                    .entry(tx.category.clone())
                    .or_insert(0.0) += abs;
            }
            _ => {}
        }

        // Monthly grouping (YYYY-MM)
        let month_key = if tx.date.len() >= 7 {
            tx.date[..7].to_string()
        } else {
            "unknown".to_string()
        };
        let entry = monthly.entry(month_key).or_insert((0.0, 0.0));
        match tx.tx_type.as_str() {
            "income" => entry.0 += tx.amount,
            "expense" => entry.1 += tx.amount.abs(),
            _ => {}
        }
    }

    let balance = income - expenses;
    let savings_rate = if income > 0.0 {
        ((income - expenses) / income) * 100.0
    } else {
        0.0
    };

    // Sort monthly stats
    let mut monthly_keys: Vec<String> = monthly.keys().cloned().collect();
    monthly_keys.sort();
    let monthly_stats: Vec<MonthStat> = monthly_keys
        .iter()
        .map(|k| {
            let (inc, exp) = monthly[k];
            MonthStat {
                label: k.clone(),
                income: inc,
                expense: exp,
            }
        })
        .collect();

    // ── Compound Interest ──────────────────────────
    let compound_result = body.compound_interest.map(|ci| {
        let n = ci.compounds_per_year as f64;
        let total_periods = (n * ci.years) as u32;
        let future_value = ci.principal * (1.0 + ci.rate / n).powf(n * ci.years);
        let effective_rate = (1.0 + ci.rate / n).powf(n) - 1.0;

        // Monthly breakdown (sample every month)
        let monthly_breakdown: Vec<MonthlyGrowth> = (1..=total_periods)
            .filter(|&m| m % (ci.compounds_per_year / 12).max(1) == 0 || m == total_periods)
            .take(120) // Cap at 10 years of monthly data
            .map(|m| {
                let t = m as f64 / n;
                MonthlyGrowth {
                    month: m,
                    value: (ci.principal * (1.0 + ci.rate / n).powf(m as f64) * 100.0).round()
                        / 100.0,
                }
            })
            .collect();

        CompoundInterestResult {
            future_value: (future_value * 100.0).round() / 100.0,
            total_interest: ((future_value - ci.principal) * 100.0).round() / 100.0,
            principal: ci.principal,
            effective_rate: (effective_rate * 10000.0).round() / 100.0, // percentage with 2 decimals
            monthly_breakdown,
        }
    });

    // ── Build Response ─────────────────────────────
    let response = AnalyzeResponse {
        income: (income * 100.0).round() / 100.0,
        expenses: (expenses * 100.0).round() / 100.0,
        balance: (balance * 100.0).round() / 100.0,
        savings_rate: (savings_rate * 100.0).round() / 100.0,
        category_distribution: category_dist,
        monthly_stats,
        compound_interest: compound_result,
    };

    Ok(json!({
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Cache-Control": "s-maxage=60, stale-while-revalidate=30"
        },
        "body": serde_json::to_string(&response).unwrap_or_default()
    }))
}
