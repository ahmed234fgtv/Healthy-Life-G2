import { useEffect, useRef, useState, type FormEvent } from 'react'
import { localToday } from '../lib/activityValidation'
import { toSleepPayload, validateSleep } from '../lib/sleepValidation'
import { SleepApiError, createSleep } from '../services/sleep'
import type { SleepFormValues } from '../types/sleep'

type FieldName = keyof SleepFormValues
type Feedback = { kind: 'success' | 'error'; message: string } | null
const emptyForm = (): SleepFormValues => ({
  sleepDate: localToday(),
  hoursSlept: '',
})

export function useSleepForm() {
  const [values, setValues] = useState<SleepFormValues>(emptyForm)
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>(
    {},
  )
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [validationNotice, setValidationNotice] = useState(false)
  const inFlight = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const form = useRef<HTMLFormElement>(null)
  const errors = validateSleep(values)

  useEffect(() => () => controller.current?.abort(), [])

  function update(field: FieldName, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }))
    if (feedback?.kind === 'success') setFeedback(null)
    setValidationNotice(false)
  }

  function blur(field: FieldName) {
    setTouched((previous) => ({ ...previous, [field]: true }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // The synchronous lock also prevents a second submit before React re-renders.
    if (inFlight.current) return
    setFeedback(null)
    setTouched({ sleepDate: true, hoursSlept: true })
    const firstInvalid = (Object.keys(errors) as FieldName[])[0]
    if (firstInvalid) {
      setValidationNotice(true)
      const field = form.current?.elements.namedItem(firstInvalid)
      if (field instanceof HTMLElement) field.focus()
      return
    }

    setValidationNotice(false)
    inFlight.current = true
    setSubmitting(true)
    const requestController = new AbortController()
    controller.current = requestController
    try {
      await createSleep(toSleepPayload(values), {
        signal: requestController.signal,
      })
      if (requestController.signal.aborted) return
      setFeedback({
        kind: 'success',
        message: 'Horas de sueño registradas correctamente.',
      })
      setValues(emptyForm())
      setTouched({})
    } catch (error) {
      if (requestController.signal.aborted) return
      setFeedback({
        kind: 'error',
        message:
          error instanceof SleepApiError
            ? error.message
            : 'No se ha podido confirmar el registro. Tus datos siguen en el formulario.',
      })
    } finally {
      inFlight.current = false
      if (!requestController.signal.aborted) setSubmitting(false)
    }
  }

  const visibleError = (field: FieldName) =>
    touched[field] ? errors[field] : undefined

  return {
    values,
    submitting,
    feedback,
    validationNotice,
    form,
    update,
    blur,
    submit,
    visibleError,
  }
}
