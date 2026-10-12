# Backend E2 — Seguimiento de hábitos saludables

API REST del módulo E2 de Healthy Life. Responsable: **Álvaro**.

- **Tecnologías:** Node.js + Express + TypeScript, SQLite (módulo `node:sqlite` integrado en Node).
- **Contrato con el frontend:** [`docs/hu1-api.md`](../docs/hu1-api.md).

## Requisitos

- **Node.js 22.13 o superior** (`node -v` para comprobarlo). No hace falta instalar SQLite aparte.

## Puesta en marcha

```bash
cd backend
npm install
npm run dev
```

El backend queda en `http://localhost:3001`. La base de datos se crea sola en `backend/data/healthy-life-e2.db`.

Al arrancar, Node muestra el aviso `ExperimentalWarning: SQLite is an experimental feature`. Es normal y no afecta al funcionamiento.

## Configuración

Todos los valores tienen un valor por defecto. Para cambiarlos, copia `.env.example` como `.env` (nunca se sube a Git) o define las variables al arrancar.

| Variable | Por defecto | Qué es |
| --- | --- | --- |
| `PORT` | `3001` | Puerto del backend |
| `DB_PATH` | `data/healthy-life-e2.db` | Fichero SQLite |
| `CORS_ORIGIN` | `http://localhost:5173` | Origen del frontend (Vite) |
| `DEMO_USER_ID` | `demo-user` | Usuario de prueba hasta integrar E1 |

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Arranca el backend y lo reinicia al guardar cambios |
| `npm start` | Arranca el backend |
| `npm test` | Ejecuta las pruebas (usan una base de datos en memoria) |
| `npm run typecheck` | Comprueba los tipos de TypeScript |

## Prueba manual rápida

```bash
curl -X POST http://localhost:3001/api/activities \
  -H "Content-Type: application/json" \
  -d '{"activityType":"walking","activityDate":"2026-10-09","notes":"Caminata por el parque"}'

curl http://localhost:3001/api/activities
```

En PowerShell, usa `curl.exe` en lugar de `curl`.

## Estructura

```text
backend/
├── src/
│   ├── server.ts       # Arranque y configuración
│   ├── app.ts          # Rutas de la API y gestión de errores
│   ├── validation.ts   # Validación en servidor del contrato HU1
│   └── db.ts           # Tabla SQLite y consultas
└── tests/
    └── activities.test.ts
```

## HU2 — Registrar horas de sueño

El contrato de sueño está documentado en [`docs/hu2-api.md`](../docs/hu2-api.md).
`POST /api/sleep` recibe `sleepDate` (`YYYY-MM-DD`, fecha real) y `hoursSlept`
(número finito mayor que 0 y menor o igual que 24; admite decimales).
`GET /api/sleep` permite comprobar los registros del usuario configurado, ordenados
por fecha e identificador descendentes. Se admiten varios registros del mismo día.

La tabla `sleep_records` se crea automáticamente en la misma base SQLite mediante
una ampliación aditiva: la tabla `activities` y sus datos se conservan.
Se utilizan las mismas variables `DB_PATH`, `DEMO_USER_ID`, `PORT` y `CORS_ORIGIN`.
No hace falta instalar dependencias nuevas ni cambiar el arranque.

`npm test` incluye las pruebas de HU1 y `tests/sleep.test.ts`. Las pruebas de HU2
comprueban validaciones, identidad, ordenación, errores, persistencia tras reabrir
un fichero temporal y ampliación de una base previa de HU1. Los ficheros temporales
se eliminan al terminar cada prueba.
