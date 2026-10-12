import { useCallback, useEffect, useState } from 'react'
import { getSleepRecords, SleepApiError } from '../services/sleep'
import type { SleepRecord } from '../types/sleep'

export function useSleepRecords(active: boolean, revision: number) {
  const [records, setRecords] = useState<SleepRecord[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  useEffect(() => {
    if (!active) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    let obsolete = false
    setLoading(true)
    setError(null)

    getSleepRecords({ signal: controller.signal })
      .then((result) => {
        if (!obsolete) setRecords(result)
      })
      .catch((failure: unknown) => {
        if (obsolete) return
        setError(
          failure instanceof SleepApiError
            ? failure.message
            : 'No se han podido consultar tus registros de sueño. Vuelve a intentarlo.',
        )
      })
      .finally(() => {
        if (!obsolete) setLoading(false)
      })

    return () => {
      // También descarta respuestas tardías de transportes que ignoren abort().
      obsolete = true
      controller.abort()
    }
  }, [active, revision, attempt])

  return { records, loading, error, retry }
}
