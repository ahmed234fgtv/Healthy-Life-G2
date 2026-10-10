# Frontend HU1 · Healthy Life

Interfaz de **Registrar actividad física**, desarrollada con React, TypeScript y Vite para el módulo E2 del equipo Scrum & Run. Responsabilidad frontend: Ahmed. El contrato compartido es [`../docs/hu1-api.md`](../docs/hu1-api.md); el servidor y la persistencia corresponden a Álvaro.

## Ejecutar en local

Se recomienda **Node.js 24 LTS**. La versión mínima declarada es Node.js **22.12**. Utiliza npm y el `package-lock.json` incluido para reproducir la instalación.

Desde la raíz del repositorio:

```bash
cd frontend
npm ci
```

La API utiliza `http://localhost:3001` por defecto. Para configurar otra dirección, copia el ejemplo **solo si no existe ya `.env.local`**:

```bash
cp -n .env.example .env.local
```

Contenido esperado de `.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:3001
```

Después:

```bash
npm run dev
```

Abre **http://localhost:5173**. El puerto es fijo: si está ocupado, Vite informa del conflicto en lugar de cambiar silenciosamente de origen. El backend debe estar arrancado por separado siguiendo sus propias instrucciones.

En un entorno con vista previa o reenvío de puertos puede ser necesario `npm run dev -- --host 0.0.0.0`. `VITE_API_BASE_URL` debe ser una URL accesible **desde el navegador**; su `localhost` se refiere al equipo que abre la página. Si el backend se expone con otra URL, configura esa dirección y acuerda con Álvaro el origen permitido por CORS. Una página HTTPS necesita una API accesible mediante HTTPS.

Las variables `VITE_*` son públicas y quedan incorporadas en el frontend: no contienen contraseñas ni tokens. Reinicia Vite tras cambiar `.env.local`; vuelve a compilar si utilizas `dist/`. No hay proxy Vite: el contrato asigna CORS al backend.

## Funcionalidad

La única pantalla contiene:

| Campo                 | Comportamiento                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tipo de actividad     | Obligatorio: Caminar (`walking`), Correr (`running`), Bicicleta (`cycling`), Gimnasio / entrenamiento (`gym`) u Otra (`other`).                               |
| Fecha de la actividad | Obligatoria, con el día local actual como valor inicial. Acepta fechas reales del calendario gregoriano en `YYYY-MM-DD`, incluidos años bisiestos.            |
| Observaciones         | Opcionales, con contador y un límite de 500 caracteres. No se corta automáticamente el texto que excede el límite: se muestra el error y se bloquea el envío. |

La fecha se conserva como texto sin convertirla a UTC. No se impone una prohibición de fechas futuras porque el contrato no la establece. Las observaciones vacías o compuestas únicamente por espacios se omiten del JSON; las demás se envían tal como se escribieron, sin recortar espacios. El contador y la validación utilizan la longitud de las cadenas JavaScript: algunos símbolos, como determinados emojis, ocupan más de una unidad.

Los errores de campo aparecen al abandonar el campo o al intentar guardar. Un envío inválido enfoca el primer campo que requiere corrección. Durante la petición se deshabilitan los campos y el botón, se anuncia el estado de carga y una guarda adicional impide envíos simultáneos antes del siguiente renderizado de React.

El formulario conserva sus valores si falla la petición. Solo después de recibir y validar una respuesta `201 Created` muestra **«Actividad registrada correctamente.»** y prepara un nuevo formulario con la fecha local actual. No hay datos ficticios ni simulación de guardado en la aplicación.

## Comunicación con el backend

El cliente utiliza `fetch` para enviar `POST /api/activities` con `Content-Type: application/json`:

```json
{
  "activityType": "walking",
  "activityDate": "2026-10-09",
  "notes": "Caminata por el parque"
}
```

No se envían `userId`, duración ni intensidad. El backend asocia el usuario y genera `id` y `createdAt` después de guardar. Si no se enviaron observaciones, debe devolver `notes: null`.

Además del estado HTTP, el frontend comprueba en tiempo de ejecución la respuesta: identificador entero positivo, tipo y fecha coincidentes con la solicitud, observaciones coincidentes y fecha de creación ISO en UTC. TypeScript por sí solo no garantiza la forma del JSON recibido por la red.

Se distinguen los mensajes de validación de `400 / VALIDATION_ERROR`, los errores HTTP `404`, `413`, `500` y otros estados fallidos, los errores de red, el tiempo de espera agotado y las respuestas inesperadas. El mensaje español de un `400` con la estructura acordada puede mostrarse directamente; otros fallos reciben mensajes comprensibles sin exponer detalles internos.

La espera máxima es de **15 segundos**, incluida la lectura del cuerpo. El cliente permite cancelar la petición al desmontar la pantalla. **El POST nunca se reintenta automáticamente**: perder la respuesta o agotar el tiempo no demuestra que el servidor no haya guardado. El formulario no promete un registro «exactamente una vez»; esa garantía requeriría acordar un mecanismo de idempotencia con el backend.

## Organización

```text
frontend/
├── src/
│   ├── main.tsx                         # Montaje de React y fuentes locales
│   ├── pages/RegisterActivityPage.tsx   # Composición de la pantalla HU1
│   ├── components/
│   │   ├── ActivityForm.tsx             # Campos, botón y mensajes del formulario
│   │   ├── FieldError.tsx               # Mensaje de error vinculado a un campo
│   │   └── MovementIllustration.tsx     # Ilustración SVG decorativa original
│   ├── hooks/useActivityForm.ts         # Estado, validación, envío y cancelación
│   ├── types/activity.ts               # Tipos y catálogo de actividades
│   ├── lib/activityValidation.ts       # Calendario, validación y JSON de envío
│   ├── services/activities.ts          # Cliente HTTP y validación de respuesta
│   ├── styles.css                      # Diseño, estados y adaptación responsive
│   ├── test/setup.ts                   # Preparación de pruebas de componentes
│   └── **/*.test.ts(x)                 # Pruebas junto al código que comprueban
├── e2e/activity.spec.ts                # Pruebas de navegador con API interceptada
├── public/favicon.svg
├── docs/defensa-hu1.md                 # Explicación del código para clase
├── .env.example
├── vite.config.ts
├── playwright.config.ts
├── tsconfig.json
└── package.json / package-lock.json
```

Las dependencias de ejecución son React, React DOM y los paquetes de fuentes locales de Fontsource. El desarrollo utiliza TypeScript, Vite y su plugin de React; las pruebas utilizan Vitest, jsdom, Testing Library, Playwright y axe. Prettier mantiene el formato del código. No se utiliza una biblioteca de componentes, un framework CSS ni un gestor global de estado.

## Diseño y accesibilidad

La composición combina una introducción editorial con un formulario de registro numerado y una ilustración de pista dibujada en SVG. El color destaca la acción principal y los estados, con bordes contenidos y sin una sucesión de tarjetas de dashboard.

La guía de Behance indicada como referencia no pudo consultarse en este entorno: devolvió HTTP `403`. Por tanto, los siguientes valores son **decisiones de diseño propuestas**, no colores oficiales de la URJC:

| Uso                       | Propuesta       |
| ------------------------- | --------------- |
| Acento y acción principal | Rojo `#a71930`  |
| Texto principal           | Tinta `#242722` |
| Fondo                     | Papel `#f5f3ed` |

Se emplea **DM Sans** para interfaz y **Instrument Serif** para el título, empaquetadas localmente mediante Fontsource. Ambas utilizan licencia SIL Open Font License, incluida en sus paquetes. El navegador no necesita solicitar tipografías a un servicio externo. La marca tipográfica de Healthy Life es una propuesta propia; no reproduce un logotipo oficial de la universidad.

El CSS define estados normal, hover, foco, pulsado, deshabilitado y guardando para el botón. Las transiciones de campos y mensajes duran aproximadamente 160–260 ms. El indicador de envío gira solo mientras existe una petición. `prefers-reduced-motion` elimina animaciones y transiciones.

El diseño pasa a una columna en tablet y móvil. Incluye etiquetas asociadas, campos obligatorios identificados, foco visible, enlace para saltar al formulario, errores mediante `aria-describedby` y `aria-invalid`, anuncios de error con `role="alert"` y confirmaciones con una región de estado. La ilustración decorativa se oculta a lectores de pantalla.

## Pruebas y compilación

Ejecuta desde `frontend/`:

```bash
npm test
npm run typecheck
npm run build
npm run format:check
```

`build` vuelve a comprobar TypeScript y genera `dist/`. Para revisar esa compilación: `npm run preview`. Para desarrollar ejecutando las pruebas continuamente: `npm run test:watch`. `npm run format:check` comprueba el formato; `npm run format` lo aplica a los archivos del frontend.

Pruebas de navegador:

```bash
npx playwright install chromium
npm run test:e2e
```

Playwright arranca Vite automáticamente y ejecuta los proyectos `desktop` y `mobile`. Si este entorno en la nube ya dispone de Chromium del sistema, puede utilizarse sin descargar otro navegador:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

La variable es opcional y solo debe apuntar a un ejecutable existente. Las capturas generadas se guardan en `test-results/`, excluido de Git; en caso de fallo también se conserva una traza.

| Nivel        | Cobertura                                                                                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validación   | Opciones, campos obligatorios, fechas reales e inexistentes, bisiestos, fecha local, límite 500/501, notas opcionales y JSON.                                               |
| Cliente HTTP | URL y cuerpo enviados, ausencia de campos ajenos al contrato, `201` válido, `400`, `404`, `413`, `500`, red, JSON o estructura inesperados, cancelación y tiempo de espera. |
| Componentes  | Renderizado, interacción, mensajes vinculados, conservación y limpieza de valores, estado de carga, bloqueo de duplicados y confirmación solo tras éxito real.              |
| Navegador    | Escritorio y móvil, teclado, foco, hover, envío, errores, movimiento reducido, desbordamientos en varios anchos y auditorías automáticas axe.                               |

Los mocks de `fetch` y las respuestas interceptadas por Playwright se limitan a las pruebas. Las pruebas de navegador recorren el frontend completo, pero **no validan el backend real, CORS ni SQLite**. Una auditoría automática de accesibilidad tampoco sustituye una revisión humana con lector de pantalla.

### Resultados de esta implementación

| Comprobación ejecutada                                                   | Resultado                                                              |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `npm test`                                                               | 104 pruebas superadas: 21 de interfaz y 83 de validación/cliente HTTP. |
| `npm run typecheck`                                                      | Sin errores de TypeScript.                                             |
| `npm run build`                                                          | Compilación de producción completada.                                  |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` | 14 pruebas superadas entre los proyectos de escritorio y móvil.        |

Las pruebas de navegador incluyen auditorías axe en los estados inicial, validación, éxito y error del servidor, además de foco por teclado, hover, movimiento reducido y comprobaciones de desbordamiento a varios anchos. Se ejecutaron en Chromium; no se ha validado aquí Safari ni Firefox.

## Capturas

Las imágenes conservadas en [`docs/screenshots/`](docs/screenshots/) permiten revisar la presentación sin arrancar el proyecto:

| Vista                                             | Captura                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Escritorio, formulario inicial                    | [desktop.png](docs/screenshots/desktop.png)                                         |
| Móvil, formulario inicial                         | [mobile.png](docs/screenshots/mobile.png)                                           |
| Errores de validación en móvil                    | [validation-mobile.png](docs/screenshots/validation-mobile.png)                     |
| Confirmación tras un `201` simulado por la prueba | [success-desktop.png](docs/screenshots/success-desktop.png)                         |
| Error de red simulado por la prueba               | [network-error-desktop.png](docs/screenshots/network-error-desktop.png)             |
| Petición real sin backend disponible, sin mocks   | [backend-unavailable-desktop.png](docs/screenshots/backend-unavailable-desktop.png) |

La captura de éxito procede exclusivamente de una prueba con respuesta HTTP interceptada. Ilustra el estado visual; **no acredita un registro persistido por el backend real**. La captura con el backend no disponible documenta el error de conexión de la aplicación real, sin simular una respuesta satisfactoria.

## Integración pendiente

Con el backend de Álvaro disponible, comprobar conjuntamente el origen CORS, el `POST` y su respuesta `201`, errores reales y la persistencia en SQLite. Los endpoints auxiliares `GET /api/health` y `GET /api/activities` pueden ayudar a esa comprobación; el frontend no los utiliza ni añade un historial.

El backend mantiene la asociación al usuario de prueba `DEMO_USER_ID` mientras no exista la integración con E1. Este frontend no implementa autenticación, estadísticas, objetivos, duración ni intensidad. Tampoco contiene servidor, consultas SQL ni configuración Docker.

Para preparar la exposición, consulta [la explicación para defender HU1 en clase](docs/defensa-hu1.md).
