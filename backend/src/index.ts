import dotenv from "dotenv";
import { app } from "./app";

dotenv.config();
const port = Number(process.env.PORT || 3000);
app().listen(port, () => console.log(`✅ API jalan di http://localhost:${port} — health: /api/health`));
