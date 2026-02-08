# 🛡️ Keamanan API CoinMarketCap (MasterUang)

Arsitektur baru ini telah diperkuat untuk mencegah kebocoran data dan mematuhi kebijakan CORS.

## ✅ Implementasi Keamanan

1. **No Client Exposure**: API Key (`a07b0...`) tidak lagi dipanggil di frontend (`services/api.ts`). Kode frontend hanya memanggil endpoint lokal `/api/cmc-proxy`.
2. **Server-Side Injection**: API Key hanya disuntikkan di sisi server (Vite Proxy di Dev, Vercel Functions di Prod). Orang luar yang melakukan inspeksi kode browser tidak akan bisa melihat kunci Anda.
3. **CORS Policy Bypass**: Dengan menggunakan proxy, permintaan berasal dari "domain yang sama" menurut browser, menghilangkan kesalahan *Cross-Origin Resource Sharing*.
4. **Rate Limiting Protection**:
   - Implementasi **Pinia Caching** (5 menit) memastikan aplikasi tidak melakukan spam request meskipun user refresh halaman berkali-kali.
   - Interval otomatis disetel ke 120 detik, aman untuk plan Free CMC.

## 🚀 Langkah Deploy Vercel

Agar fitur ini berfungsi di production:

1. Buka [Dashboard Vercel](https://vercel.com).
2. Pilih project `MasterUang`.
3. Pergi ke **Settings** > **Environment Variables**.
4. Tambahkan :
   - Key: `CMC_API_KEY`
   - Value: `a07b08e533494d3a91706474e46631f9`
5. Klik **Add** dan redeploy aplikasi.

## ⚠️ Penanganan Error
- **401 Unauthorized**: Terjadi jika key salah atau belum di-set di Vercel env.
- **429 Too Many Requests**: Terjadi jika kuota harian habis. Sistem akan otomatis memberikan pesan ramah ke user.
- **1006 (Plan Limit)**: Jika plan Free tidak mendukung endpoint V2, sistem otomatis beralih ke **CoinGecko Public API** (tanpa key) sebagai cadangan agar aplikasi tidak terlihat "rusak".
