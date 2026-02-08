# 🪙 MasterUang - Premium Finance & Market Dashboard

[![Vue.js](https://img.shields.io/badge/Vue.js-3.4-4fc08d?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License-MIT](https://img.shields.io/badge/License-MIT-amber?style=for-the-badge)](LICENSE)

**MasterUang** is a sophisticated, Bloomberg-inspired financial tracking platform designed for users who demand professional-grade market insights and seamless expense management. Combining real-time financial data with AI-driven analysis, MasterUang provides a "Zen" interface for complex data visualization.

---

## ✨ Key Features

### 📊 Financial Management
- **Transaction Tracking**: Comprehensive logging of income and expenses.
- **Visual Analytics**: Interactive charts using **ApexCharts** for spending patterns.
- **Secure Storage**: All data is securely handled via **Supabase** with Row-Level Security (RLS).

### 📈 Market Intelligence
- **Crypto Terminal**: Real-time price tickers and historical charts for major cryptocurrencies.
- **Live News Feed**: Curated financial and crypto news to stay ahead of market trends.
- **Indices & Forex**: Monitoring of global market indices and currency pairs.

### 🤖 AI Financial Advisor
- **Gemini Powered**: Integration with Google Gemini API for personalized financial advice.
- **Context-Aware**: The AI understands your transaction history to provide tailor-made savings tips.
- **Intuitive Chat**: Dark-themed, sleek chat interface for financial queries.

### ⚓ Maritime Tracking (Beta)
- **Real-time AIS**: Integrated ship tracking using Leaflet and live AIS data streams.
- **Vessel Monitoring**: Search and track vessels globally with advanced map filtering.

### 🔒 Enterprise-Grade Security
- **Supabase Auth**: Secure authentication with persistent sessions.
- **Router Guards**: Protected routes preventing unauthorized access.
- **RLS Policies**: Data isolation ensuring users only see their own financial records.

---

## �️ Tech Stack

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
- **Backend**: [Supabase](https://supabase.com/) (Auth + PostgreSQL)
- **Charts**: [ApexCharts](https://apexcharts.com/)
- **Maps**: [Leaflet](https://leafletjs.com/)
- **AI**: [Google Gemini API](https://ai.google.dev/)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn
- Supabase Account
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

### 3. Environment Variables
Create a `.env` file in the root directory and add your credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_CMC_API_KEY=your_coinmarketcap_key
```

### 4. Database Setup
Run the following SQL in your Supabase SQL Editor to enable Row Level Security (RLS) for the `transactions` table:

```sql
-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to manage only their own data
CREATE POLICY "Users can manage own transactions" 
ON transactions FOR ALL 
USING (auth.uid() = user_id);
```

### 5. Launch
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎨 Aesthetic Design
MasterUang uses a custom **Bloomberg-Zen** theme:
- **Primary Palette**: Deep Charcoals (#121212) and Slate Grays.
- **Accents**: Amber (#f59e0b) for highlights and call-to-actions.
- **Typography**: [JetBrains Mono](https://www.jetbrains.com/lp/mono/) for that professional terminal feel.

---

## 🤝 Contribution
Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License
Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ by [Ikhsan](https://github.com/Zyrexnn)
