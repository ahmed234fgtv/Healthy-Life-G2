# Cómo explicar el frontend de HU1

## Qué he implementado

«Mi responsabilidad es la pantalla que permite registrar una actividad física. El usuario elige la actividad, indica la fecha y puede escribir observaciones. React valida los datos, envía una petición HTTP al backend de Álvaro y muestra una confirmación solamente cuando el servidor devuelve un registro válido. Mi parte no guarda directamente en SQLite».

El alcance es HU1. No incluye duración o intensidad, que pertenecen a HU6, ni login, historial o estadísticas. El acuerdo técnico está en [`docs/hu1-api.md`](../../docs/hu1-api.md).

## El recorrido de un registro

1. **Entrada.** El usuario modifica un campo. React actualiza `values`, el estado que contiene los tres valores del formulario.
2. **Validación.** `validateActivity` comprueba que el tipo existe, la fecha es real y las observaciones no superan 500 caracteres. Si hay errores, no se llama a la API y el primer campo incorrecto recibe el foco.
3. **Preparación.** `toActivityPayload` construye un objeto con las claves exactas del contrato. Aplica `trim()` a las observaciones, igual que el backend, y las omite si quedan vacías. Conserva los espacios y saltos de línea interiores y no modifica el texto del formulario.
4. **Envío.** `createActivity` hace `fetch` con método `POST`, cuerpo JSON y cabecera `Content-Type: application/json` a `/api/activities`.
5. **Espera.** La pantalla deshabilita los campos y el botón, muestra «Guardando actividad…» y evita enviar otra petición simultánea.
6. **Resultado.** Si llegan `201` y un registro válido, muestra «Actividad registrada correctamente.» y limpia el formulario para el siguiente registro. Si hay un error, explica lo ocurrido y conserva los datos.

Ejemplo de petición sin observaciones:

```json
{
  "activityType": "walking",
  "activityDate": "2026-10-09"
}
```

No se envía `userId`: el servidor decide qué usuario corresponde. Tampoco se inventan `id` o `createdAt`; los genera el backend.

## Para qué sirve cada archivo

| Archivo                                            | Explicación sencilla                                                                                        |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/main.tsx`                                     | Arranca React y carga los estilos y las fuentes incluidas en la aplicación.                                 |
| `src/pages/RegisterActivityPage.tsx`               | Compone la pantalla: cabecera, introducción, formulario y pie.                                              |
| `src/components/ActivityForm.tsx`                  | Presenta los campos, sus etiquetas, el botón y los mensajes de validación o resultado.                      |
| `src/hooks/useActivityForm.ts`                     | Coordina el estado y lo que sucede cuando el usuario escribe, sale de un campo o guarda.                    |
| `src/components/FieldError.tsx`                    | Muestra un mensaje de error con un identificador que el campo puede referenciar. Evita repetir ese marcado. |
| `src/components/MovementIllustration.tsx`          | Dibuja la pista decorativa en SVG. No representa estadísticas ni datos inventados.                          |
| `src/types/activity.ts`                            | Define los cinco tipos de actividad y distingue los datos del formulario, del envío y de la respuesta.      |
| `src/lib/activityValidation.ts`                    | Contiene funciones pequeñas que validan datos y construyen el JSON, sin depender de React ni de la red.     |
| `src/services/activities.ts`                       | Se encarga de HTTP, el tiempo de espera, la respuesta del servidor y los errores de comunicación.           |
| `src/styles.css`                                   | Define la identidad visual, los tamaños de pantalla y los estados accesibles de los controles.              |
| `*.test.ts`, `*.test.tsx` y `e2e/activity.spec.ts` | Comprueban reglas, comunicación y comportamiento de la pantalla en distintos niveles.                       |

La separación permite probar la fecha o el JSON sin abrir un navegador, y modificar la presentación sin mezclarla con los detalles del servidor. No hacen falta un router ni un gestor global de estado para una sola pantalla.

## Cómo funciona el estado de React

El hook propio `useActivityForm` concentra la interacción para que `ActivityForm` pueda centrarse en presentar los campos. Dentro del hook, `useState` conserva los valores y provoca un nuevo renderizado cuando cambian. Mantiene:

- `values`: tipo, fecha y observaciones.
- `touched`: qué campos ha revisado el usuario; permite mostrar errores después de interactuar, sin llenar de mensajes la pantalla al abrirla.
- `submitting`: si hay una petición pendiente; controla el botón, los campos y el anuncio de carga.
- `feedback`: la confirmación o el error de la petición.
- `validationNotice`: el aviso general que acompaña los errores del formulario.

`useRef` conserva información entre renderizados sin redibujar la interfaz. `inFlight` bloquea inmediatamente un segundo envío, incluso antes de que React haya actualizado el botón. Otras referencias permiten enfocar campos y cancelar la petición mediante `AbortController` cuando la pantalla se desmonta. El efecto de limpieza evita aplicar un resultado a una pantalla que ya no está activa.

## Decisiones que conviene poder justificar

**¿Por qué TypeScript y también validación en ejecución?**

TypeScript ayuda durante el desarrollo a detectar que faltan campos o se utilizan tipos incorrectos. El JSON del servidor llega desde fuera de la aplicación: puede estar mal formado aunque el código compile. Por eso se lee como `unknown` y se comprueba su estructura antes de tratarlo como una actividad.

**¿Por qué no basta con que `fetch` termine?**

`fetch` también resuelve su promesa cuando el servidor devuelve un error como `400` o `500`. Hay que leer el estado HTTP. Además, el contrato requiere `201`: un `200`, un JSON roto o una respuesta con otros datos no sirven para confirmar este registro.

**¿Cómo se evita cambiar accidentalmente la fecha?**

Una actividad tiene un día de calendario, no un instante. Se envía el texto `YYYY-MM-DD` tal como lo produce el campo. El validador comprueba por separado año, mes, día y años bisiestos, sin convertirlos a UTC. La fecha inicial usa `getFullYear`, `getMonth` y `getDate`, que corresponden al día local del navegador. El contrato no prohíbe fechas futuras y no se añade esa regla.

**¿Por qué no se recortan las observaciones al escribir?**

El usuario puede corregir el texto que ha introducido y ve cuánto supera el límite; no se pierde una parte de lo que pega. El validador impide enviar más de 500 caracteres antes de normalizar. Al preparar el JSON, `trim()` elimina los espacios de los extremos para coincidir con lo que guarda el backend; si queda vacío, se omite `notes`. El texto visible se conserva durante la edición y tras un fallo. La respuesta debe coincidir exactamente con las observaciones normalizadas que se enviaron, o contener `notes: null` si se omitieron. La longitud utilizada es la de JavaScript, por lo que algunos emojis cuentan más de una unidad.

**¿Por qué no reintentar automáticamente una petición fallida?**

El servidor podría haber guardado y haberse perdido la respuesta. Repetir el POST automáticamente podría duplicar la actividad. Hay un límite de espera de 15 segundos y un mensaje de resultado no confirmado. El bloqueo local evita envíos simultáneos, pero una garantía total frente a duplicados necesitaría un acuerdo de idempotencia con el backend.

**¿Dónde se guarda la información?**

Mientras se escribe, en el estado de React. Después de guardar correctamente, en el backend y su SQLite. El frontend no usa una base de datos local ni simula persistencia. Recargar la página descarta un borrador sin enviar.

**¿Por qué el cliente no tiene un proxy ni un usuario fijo?**

El contrato ya asigna CORS y la asociación del usuario al backend. El frontend configura solo la URL base mediante `VITE_API_BASE_URL` y envía los datos de actividad. Así se respetan las responsabilidades acordadas con Álvaro.

## Diseño y accesibilidad

La composición da personalidad a una herramienta pequeña: título con una tipografía editorial, campos numerados, una pista dibujada expresamente y un botón rojo sobrio. La paleta propuesta utiliza rojo `#a71930`, tinta `#242722` y fondo `#f5f3ed`. No se presenta como paleta oficial de la URJC porque la guía de Behance no pudo consultarse: respondió `403`.

DM Sans se utiliza para leer y rellenar; Instrument Serif da identidad al título. Ambas fuentes se sirven localmente mediante Fontsource y tienen licencia SIL Open Font License. No se ha incorporado una biblioteca visual de componentes.

Las etiquetas explican cada campo, el teclado puede recorrer el formulario y el foco siempre es visible. Los errores están vinculados a su campo y los resultados se anuncian con regiones accesibles. En móvil los elementos pasan a una columna; los controles conservan una superficie cómoda. Las animaciones son breves y señalan cambios de estado. Se eliminan cuando el sistema solicita reducir el movimiento.

## Qué demuestran las pruebas y qué no

Vitest comprueba funciones de validación y el cliente HTTP. Testing Library comprueba el formulario mediante etiquetas, botones y mensajes, como lo utiliza una persona. Playwright abre un navegador con tamaños de escritorio y móvil, comprueba interacción, estados y desbordamientos, y utiliza axe para detectar problemas de accesibilidad que pueden comprobarse automáticamente.

Las pruebas cubren fechas inexistentes, el límite de observaciones, el JSON exacto, respuestas válidas y erróneas, fallos de red, duplicados y ausencia de confirmaciones falsas. Los mocks existen únicamente dentro de las pruebas: permiten reproducir esos casos sin depender del servidor.

En esta implementación se han ejecutado correctamente **118 pruebas con Vitest**, **14 pruebas de navegador con Playwright**, la comprobación de TypeScript y la compilación de producción. Las [capturas del README](../README.md#capturas) muestran varios estados. La confirmación fotografiada utiliza un `201` simulado en una prueba, no un registro persistido realmente.

Eso **no demuestra todavía la integración con el backend real**, CORS ni la persistencia en SQLite. Esas comprobaciones deben realizarse conjuntamente con Álvaro. Tampoco equivale a una auditoría manual completa de accesibilidad ni a comprobar todos los navegadores.

## Propuesta de demostración en clase

1. Arrancar el backend real y el frontend, y mostrar que la URL de API coincide con la acordada.
2. Pulsar guardar sin elegir actividad para explicar validación y foco.
3. Elegir una actividad, mantener una fecha real y escribir observaciones.
4. Abrir la pestaña de red del navegador y mostrar el POST, su JSON y el `201` antes de señalar la confirmación.
5. Con Álvaro, comprobar el registro a través del endpoint auxiliar acordado y confirmar la persistencia. No hace falta añadir una pantalla de historial.
6. Mostrar una respuesta de error o una desconexión y explicar por qué se conservan los datos y no aparece éxito.
7. Mostrar la adaptación móvil, el recorrido por teclado y los comandos de pruebas del README.

Si no está disponible el backend, se puede demostrar la interfaz, sus validaciones y sus pruebas automatizadas. Hay que explicar expresamente que el registro real y su persistencia siguen pendientes de integración; no se debe presentar una prueba con mocks como un guardado real.
