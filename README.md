# 🪙 MasterUang - Premium Finance & Intelligence Dashboard

[![Proprietary](https://img.shields.io/badge/License-Proprietary-rose?style=for-the-badge)](LICENSE)
[![Vue 3](https://img.shields.io/badge/Vue-3.4-42b883?style=for-the-badge&logo=vue.js)](https://vuejs.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth/DB-3ec946?style=for-the-badge&logo=supabase)](https://supabase.com/)

**MasterUang** is an elite financial ecosystem and intelligence terminal inspired by the Bloomberg professional experience. It merges high-fidelity financial tracking with real-time global telemetry—tracking everything from your personal expenses to the global distribution of airborne and maritime assets.

---

## ✨ Core Intelligence Modules

### 📊 Wealth Management
- **Transaction Engine**: Precise logging of income and expenditures with category-based intelligence.
- **Visual Analytics**: Dynamic, interactive data visualization powered by **ApexCharts** for comprehensive trend analysis.
- **Enterprise Storage**: Resilient data management via **Supabase** with robust Row-Level Security (RLS).

### 📈 Market Intelligence Terminal
- **Global Indices**: Monitor S&P 500, Dow Jones, and local **IHSG (IDX)** performance in real-time.
- **Asset Tickers**: Live price streams for major commodities (Gold/Silver) and Indonesian blue-chip stocks (BBCA, TLKM).
- **Crypto Command Center**: Premium terminal for cryptocurrency price action and historical charting.
- **Live News Feed**: Institutional-grade financial and crypto news stream to keep you ahead of the curve.

### 🤖 AI Financial Advisor (Gemini)
- **Contextual Analysis**: Leverages **Google Gemini API** to analyze your spending history and provide surgical financial advice.
- **Saving Strategies**: AI-driven tips on optimizing cash flow based on real-time data.
- **Zen Chat Interface**: A minimalist, low-latency chat interface for complex financial querying.

### 🛰️ Aerial & Maritime Intelligence (Live Telemetry)
- **Flight Tracker (OpenSky Network)**: Real-time global flight tracking with advanced telemetry (Altitude, Velocity, Heading, Squawk codes).
- **Performance Optimized**: Features viewport culling and smart caching for smooth rendering of thousands of aircraft.
- **Maritime Surveillance**: Global AIS data integration via **VesselFinder** for real-time ship tracking and maritime traffic analysis.

### 🔒 Operational Security
- **Identity Protection**: Secure authentication and session management via Supabase Auth.
- **Data Isolation**: Comprehensive RLS policies ensuring users only interact with their own encrypted financial records.
- **Router Guards**: Sophisticated client-side protection for sensitive views.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vue 3 (Composition API), Vite |
| **State** | Pinia (Persistent Stores) |
| **Styling**| Tailwind 3.4, DaisyUI, Glassmorphism CSS |
| **Backend** | Supabase (PostgreSQL, Auth) |
| **Analysis** | Google Gemini Generative AI |
| **Charting** | ApexCharts, Lightweight Charts |
| **Mapping** | Leaflet, Leaflet MarkerCluster |
| **APIs** | OpenSky Network, Finnhub, Twelve Data, VesselFinder |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn
- Supabase Account (for DB/Auth)
- Google Gemini API Key

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Zyrexnn/MasterUang.git

# Navigate to project directory
cd MasterUang

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# Core
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Intelligence APIs
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_CMC_API_KEY=your_coinmarketcap_key

# Market/Telemetry (Optional Proxies)
FINNHUB_KEY=your_finnhub_key
TWELVE_KEY=your_twelvedata_key
AIS_KEY=your_aisstream_key
```

### 4. Database Initialization
Execute the setup scripts in `supabase-setup.sql` via your Supabase SQL Editor to initialize tables and RLS policies.

### 5. Deployment
```bash
npm run dev
```
Navigate to `http://localhost:5173`.

---

## 🎨 Bloomberg-Zen Aesthetic
MasterUang adheres to a strict "Bloomberg-Zen" design philosophy:
- **Typography**: [JetBrains Mono](https://www.jetbrains.com/lp/mono/) for terminal feel & [Outfit](https://fonts.google.com/specimen/Outfit) for modern UI.
- **Color Space**: High-contrast monochrome palette (#000000 - #121212) with **Bloomberg Amber** (#F59E0B) highlights.
- **UI Elements**: Glassmorphism overlays, subtle micro-animations, and institutional-grade density.

---

## 🔒 License & Legal
This project is **PROPRIETARY**. All rights reserved by **Ikhsan (@Zyrexnn)**.

**Permitted Use**: You are authorized to run this project for personal evaluation, learning, or educational review.

**Strictly Prohibited**:
- Commercial redistribution or monetization.
- Publicly hosting derivative works without explicit written consent.
- Removal of copyright headers and original attribution.

---
Built with intensity and precision by [Ikhsan](https://github.com/Zyrexnn) 🚀
