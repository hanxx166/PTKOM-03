import { app } from "./app";
// Import untuk efek samping: lib/env melempar error kalau JWT_SECRET atau
// FRONTEND_URL kosong. app sudah menariknya lewat middleware, tapi baris ini
// membuat ketergantungan itu eksplisit dan urutan boot-nya jelas.
import "./lib/env";

const port = Number(process.env.PORT || 3000);
app().listen(port, () => console.log(`✅ API jalan di http://localhost:${port} — health: /api/health`));