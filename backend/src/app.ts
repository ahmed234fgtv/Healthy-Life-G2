// Definición de la API. Separada de server.ts para poder probarla sin
// arrancar un servidor real (los tests usan una base de datos en memoria).
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import type { DatabaseSync } from "node:sqlite";
import { insertActivity, listActivities, type ActivityRow } from "./db.ts";
import { validateNewActivity } from "./validation.ts";

export interface AppConfig {
  db: DatabaseSync;
  /** Usuario de prueba hasta integrar las cuentas de E1. */
  demoUserId: string;
  /** Origen del frontend permitido por CORS (Vite: http://localhost:5173). */
  corsOrigin: string;
}

function toApi(row: ActivityRow) {
  return {
    id: row.id,
    activityType: row.activity_type,
    activityDate: row.activity_date,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function errorBody(code: string, message: string) {
  return { error: { code, message } };
}

export function createApp({ db, demoUserId, corsOrigin }: AppConfig) {
  const app = express();
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: "10kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // HU1 — Registrar actividad física
  app.post("/api/activities", (req, res) => {
    const result = validateNewActivity(req.body);
    if (!result.ok) {
      res.status(400).json(errorBody("VALIDATION_ERROR", result.message));
      return;
    }
    const row = insertActivity(db, { userId: demoUserId, ...result.value });
    res.status(201).json(toApi(row));
  });

  // Auxiliar: permite comprobar que lo registrado se ha guardado.
  app.get("/api/activities", (_req, res) => {
    res.json(listActivities(db, demoUserId).map(toApi));
  });

  app.use("/api", (_req, res) => {
    res.status(404).json(errorBody("NOT_FOUND", "Recurso no encontrado."));
  });

  // JSON mal formado o errores inesperados: nunca se exponen detalles internos.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const e = err as { type?: string; status?: number };
    if (e?.type === "entity.parse.failed") {
      res.status(400).json(errorBody("VALIDATION_ERROR", "El cuerpo no es un JSON válido."));
      return;
    }
    if (e?.type === "entity.too.large") {
      res.status(413).json(errorBody("PAYLOAD_TOO_LARGE", "La petición es demasiado grande."));
      return;
    }
    console.error(err);
    res.status(500).json(errorBody("INTERNAL_ERROR", "Error interno del servidor."));
  });

  return app;
}
