// Persistencia del módulo E2 con SQLite.
// Usa el módulo sqlite integrado en Node (node:sqlite), así no hace falta
// compilar dependencias nativas en Windows/Mac/Linux.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface ActivityRow {
  id: number;
  user_id: string;
  activity_type: string;
  activity_date: string;
  notes: string | null;
  created_at: string;
}

export interface NewActivity {
  userId: string;
  activityType: string;
  activityDate: string;
  notes: string | null;
}

export interface SleepRow {
  id: number;
  user_id: string;
  sleep_date: string;
  hours_slept: number;
  created_at: string;
}

export interface NewSleep {
  userId: string;
  sleepDate: string;
  hoursSlept: number;
}

export function openDatabase(path: string): DatabaseSync {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       TEXT    NOT NULL,
      activity_type TEXT    NOT NULL,
      activity_date TEXT    NOT NULL,
      notes         TEXT,
      created_at    TEXT    NOT NULL
    )
  `);
  // Migración aditiva: conserva la tabla activities y sus registros existentes.
  db.exec(`
    CREATE TABLE IF NOT EXISTS sleep_records (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT    NOT NULL,
      sleep_date  TEXT    NOT NULL,
      hours_slept REAL    NOT NULL,
      created_at  TEXT    NOT NULL
    )
  `);
  return db;
}

export function insertActivity(db: DatabaseSync, a: NewActivity): ActivityRow {
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO activities (user_id, activity_type, activity_date, notes, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(a.userId, a.activityType, a.activityDate, a.notes, createdAt);

  return db
    .prepare(`SELECT * FROM activities WHERE id = ?`)
    .get(Number(result.lastInsertRowid)) as unknown as ActivityRow;
}

export function listActivities(db: DatabaseSync, userId: string): ActivityRow[] {
  return db
    .prepare(
      `SELECT * FROM activities WHERE user_id = ?
       ORDER BY activity_date DESC, id DESC`
    )
    .all(userId) as unknown as ActivityRow[];
}

export function insertSleep(db: DatabaseSync, sleep: NewSleep): SleepRow {
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO sleep_records (user_id, sleep_date, hours_slept, created_at)
       VALUES (?, ?, ?, ?)`
    )
    .run(sleep.userId, sleep.sleepDate, sleep.hoursSlept, createdAt);

  return db
    .prepare(`SELECT * FROM sleep_records WHERE id = ?`)
    .get(Number(result.lastInsertRowid)) as unknown as SleepRow;
}

export function listSleep(db: DatabaseSync, userId: string): SleepRow[] {
  return db
    .prepare(
      `SELECT * FROM sleep_records WHERE user_id = ?
       ORDER BY sleep_date DESC, id DESC`
    )
    .all(userId) as unknown as SleepRow[];
}
