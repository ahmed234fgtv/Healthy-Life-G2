# Contrato de API — HU2 Registrar horas de sueño

Contrato compartido entre el frontend y el backend del módulo E2 de Healthy Life.
Cualquier cambio en este documento se acuerda entre ambos y se sube mediante Pull Request.
Referencia Jira: **SCRUM-2**.

## Historia

> **HU2 — Registrar horas de sueño.** Como usuario de Healthy Life, quiero registrar las horas que duermo para llevar un seguimiento de mis hábitos de descanso.

El registro contiene la fecha y las horas de sueño. No incluye calidad del sueño, observaciones, estadísticas ni una pantalla de historial.

## Conexión

| Dato | Valor en local |
| --- | --- |
| URL base del backend | `http://localhost:3001` |
| Variable del frontend | `VITE_API_BASE_URL=http://localhost:3001` |
| Origen del frontend (Vite) | `http://localhost:5173` |
| CORS | Lo resuelve el **backend** (no hace falta proxy en Vite) |

Se utiliza la misma aplicación y configuración que HU1.

## `POST /api/sleep`

```http
POST /api/sleep
Content-Type: application/json
```

### Solicitud

```json
{
  "sleepDate": "2026-10-10",
  "hoursSlept": 7.5
}
```

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `sleepDate` | `string` | Sí | Fecha real del calendario gregoriano en formato `YYYY-MM-DD`, con año entre `0001` y `9999`. Se rechaza p. ej. `2026-02-30`. Sin hora ni zona horaria |
| `hoursSlept` | `number` | Sí | Número finito, mayor que `0` y menor o igual que `24`. Se admiten decimales, como `7.5`; no se admiten cadenas como `"7.5"` |

No se restringen las fechas futuras ni se impone un registro único por fecha: pueden existir varios registros de sueño para un mismo día.

No se envía `userId`. Mientras no exista la integración con E1 (Gestión de usuarios), el backend asocia los registros al mismo usuario de prueba configurado (`DEMO_USER_ID`) que utiliza HU1.

### Respuesta correcta — `201 Created`

```json
{
  "id": 1,
  "sleepDate": "2026-10-10",
  "hoursSlept": 7.5,
  "createdAt": "2026-10-11T08:30:00.000Z"
}
```

- `id` y `createdAt` los genera el backend **después** de guardar en la base de datos.
- `createdAt` es fecha y hora en UTC (ISO 8601).
- `sleepDate` conserva el día enviado, sin conversiones de zona horaria; `hoursSlept` se devuelve como número.

### Datos inválidos — `400 Bad Request`

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Las horas de sueño no son válidas."
  }
}
```

`message` está en español y puede mostrarse directamente al usuario. También se devuelve `400` si el cuerpo no es un JSON válido.

### Otros errores

Todos los errores usan el mismo formato `{ "error": { "code", "message" } }`:

| Código HTTP | `code` | Cuándo |
| --- | --- | --- |
| `404` | `NOT_FOUND` | Ruta de la API inexistente |
| `413` | `PAYLOAD_TOO_LARGE` | Petición de más de 10 KB |
| `500` | `INTERNAL_ERROR` | Error inesperado (sin detalles internos) |

Si no llega respuesta, es un **error de red** (backend apagado o URL incorrecta): el frontend debe distinguirlo de los anteriores y no mostrar nunca «guardado correctamente» sin un `201` y una respuesta válida.

## Endpoints auxiliares

| Endpoint | Para qué |
| --- | --- |
| `GET /api/sleep` | Lista los registros de sueño del usuario de prueba. Sirve para comprobar que se ha guardado; no implica desarrollar una pantalla de historial |
| `GET /api/health` | Devuelve `{ "status": "ok" }` si el backend está arrancado |

`GET /api/sleep` devuelve `200 OK` con un array de registros con la misma estructura que la respuesta del POST, sin `userId`. Devuelve `[]` si ese usuario no tiene registros. El orden es por fecha de sueño descendente y, para una misma fecha, por identificador descendente (`ORDER BY sleep_date DESC, id DESC`). Solo se devuelven los registros asociados al usuario configurado.

```json
[
  {
    "id": 1,
    "sleepDate": "2026-10-10",
    "hoursSlept": 7.5,
    "createdAt": "2026-10-11T08:30:00.000Z"
  }
]
```

## Persistencia

Los registros se guardan en **SQLite**, en el mismo archivo de HU1 (`backend/data/healthy-life-e2.db`, generado automáticamente y excluido de Git). Se añade una tabla independiente, `sleep_records`, con estos cinco campos:

| Campo | Tipo SQLite | Uso |
| --- | --- | --- |
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Identificador del registro |
| `user_id` | `TEXT NOT NULL` | Usuario asociado por el backend |
| `sleep_date` | `TEXT NOT NULL` | Día en formato `YYYY-MM-DD` |
| `hours_slept` | `REAL NOT NULL` | Horas de sueño, incluidos decimales |
| `created_at` | `TEXT NOT NULL` | Fecha y hora de creación en UTC |

La creación de `sleep_records` es aditiva: conserva la tabla `activities` y sus datos. No se añade una restricción de unicidad por fecha. El frontend nunca accede a la base de datos directamente.
