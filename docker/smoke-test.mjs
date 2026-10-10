// Comprobación HTTP de HU1 contra el backend real de Docker. Node.js >= 22.
const baseUrl = 'http://localhost:3001'
const marker = `docker-smoke-${Date.now()}`
const activityDate = new Date().toISOString().slice(0, 10)

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

try {
  const health = await fetch(`${baseUrl}/api/health`)
  assert(health.ok, `Healthcheck HTTP ${health.status}`)
  const healthBody = await health.json()
  assert(healthBody.status === 'ok', 'La API no devuelve status: ok')

  const create = await fetch(`${baseUrl}/api/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      activityType: 'walking',
      activityDate,
      notes: marker,
    }),
  })
  assert(create.status === 201, `POST esperaba 201, recibió ${create.status}`)
  const activity = await create.json()
  assert(Number.isInteger(activity.id) && activity.id > 0, 'ID inválido')
  assert(activity.activityType === 'walking', 'Tipo distinto al enviado')
  assert(activity.activityDate === activityDate, 'Fecha distinta a la enviada')
  assert(activity.notes === marker, 'Observaciones distintas a las enviadas')
  assert(typeof activity.createdAt === 'string', 'Sin fecha de creación')

  const list = await fetch(`${baseUrl}/api/activities`)
  assert(list.ok, `Listado HTTP ${list.status}`)
  const activities = await list.json()
  assert(Array.isArray(activities), 'Listado de actividades no es un array')
  assert(activities.some((a) => a.id === activity.id && a.notes === marker),
    'La actividad creada no aparece guardada')

  console.log(`OK: salud, registro 201 y persistencia inmediata (actividad ${activity.id}).`)
  console.log('Para comprobar persistencia tras reiniciar: docker compose restart backend')
  console.log(`Después consulta /api/activities y busca las observaciones ${marker}`)
} catch (error) {
  console.error('ERROR en prueba HU1 Docker:', error.message)
  process.exitCode = 1
}
