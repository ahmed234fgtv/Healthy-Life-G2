// Punto de arranque. La configuración llega por variables de entorno
// (ver .env.example); todos los valores tienen un valor por defecto local.
import { createApp } from "./app.ts";
import { openDatabase } from "./db.ts";

const PORT = Number(process.env.PORT ?? 3001);
const DB_PATH = process.env.DB_PATH ?? "data/healthy-life-e2.db";
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";
const DEMO_USER_ID = process.env.DEMO_USER_ID ?? "demo-user";

const db = openDatabase(DB_PATH);
const app = createApp({ db, demoUserId: DEMO_USER_ID, corsOrigin: CORS_ORIGIN });

app.listen(PORT, () => {
  console.log(`Backend E2 escuchando en http://localhost:${PORT}`);
  console.log(`Base de datos: ${DB_PATH} · CORS permitido para: ${CORS_ORIGIN}`);
});
