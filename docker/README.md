# HU1 — Despliegue con Docker

Configuración del módulo E2 de Healthy Life (Scrum & Run) sobre los directorios `frontend/` y `backend/` existentes. **No se modifica el código de Ahmed ni el de Álvaro.**

## Requisito

Docker Desktop (Windows/Mac) o Docker Engine con el complemento Compose (Linux). Es necesario que `docker compose version` funcione. **No hace falta instalar Node.js en el ordenador** para ejecutar los contenedores.

## Arranque

Desde la carpeta raíz `Healthy-Life-G2` (donde está `compose.yaml`):

```sh
docker compose up --build -d
docker compose ps
```

Espera a que `backend` aparezca como `healthy`. Abre la interfaz en **http://localhost:5173**. La API está en **http://localhost:3001**.

La primera ejecución descarga imágenes e instala dependencias. Las siguientes suelen ser más rápidas.

## Comprobación real de HU1

1. Comprueba el estado de la API: abre http://localhost:3001/api/health y confirma `{"status":"ok"}`.
2. Entra en http://localhost:5173, rellena tipo de actividad y fecha; añade observaciones si quieres y pulsa **Guardar actividad**. Debería mostrar confirmación después de recibir la respuesta `201` del backend.
3. Abre http://localhost:3001/api/activities para verificar que aparece la actividad guardada. No hay mocks: el backend la almacena en SQLite.
4. Reinicia **solo** el backend con `docker compose restart backend`.
5. Vuelve a abrir http://localhost:3001/api/activities: la actividad anterior debe continuar, porque SQLite está en el volumen `healthy_life_db`.

Como verificación automática adicional, si tienes Node.js local instalado, ejecuta:

```sh
node docker/smoke-test.mjs
```

El script comprueba salud, creación `201` y lectura posterior de la actividad. No verifica por sí solo la persistencia tras un reinicio; para eso sigue los pasos 4 y 5.

## Operaciones habituales

```sh
# Ver registros de ambos contenedores
docker compose logs --tail=100 backend frontend

# Parar la aplicación (sin borrar las actividades)
docker compose down

# Volver a arrancar conservando la base de datos
docker compose up -d
```

**Importante:** `docker compose down --volumes` **borra la base de datos del volumen**. No lo ejecutes si quieres conservar las actividades.

## Diseño de la solución

- **Frontend:** se compila con Node.js 24 y lo sirve Nginx en el puerto local `5173`. En la compilación se configura `VITE_API_BASE_URL=http://localhost:3001`.
- **Backend:** se ejecuta con Node.js 24 y el comando `npm start` de Álvaro, en `3001`. Se mantiene `CORS_ORIGIN=http://localhost:5173`.
- **SQLite:** la ruta `DB_PATH=/app/data/healthy-life-e2.db` está dentro del volumen Docker `healthy_life_db`.
- Los puertos están limitados a `127.0.0.1` para esta demostración local. Para acceso externo o despliegue en servidores hay que revisar host, HTTPS, CORS y URL pública de la API; esta configuración no es un servicio público de producción.

Si los puertos 5173 o 3001 ya están ocupados por aplicaciones que ejecutaste fuera de Docker, detén esas aplicaciones antes de `docker compose up`.
