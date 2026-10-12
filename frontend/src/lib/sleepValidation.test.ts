import { describe, expect, it } from 'vitest'
import type { SleepFormValues } from '../types/sleep'
import { toSleepPayload, validateSleep } from './sleepValidation'

const validValues: SleepFormValues = {
  sleepDate: '2026-10-09',
  hoursSlept: '7.5',
}

describe('sleep form validation', () => {
  it.each([
    '0.000000001',
    '0.0001',
    '.5',
    '0.5',
    '1',
    '7.',
    '7.125',
    '8',
    '24',
    '24.0',
  ])(
    'accepts positive decimal hours up to 24 without imposing a step (%s)',
    (hoursSlept) => {
      expect(validateSleep({ ...validValues, hoursSlept })).toEqual({})
    },
  )

  it.each(['2024-02-29', '2000-02-29', '0001-01-01', '9999-12-31'])(
    'accepts real Gregorian dates without a future-date restriction (%s)',
    (sleepDate) => {
      expect(validateSleep({ ...validValues, sleepDate })).toEqual({})
    },
  )

  it('reports both required fields together', () => {
    expect(validateSleep({ sleepDate: '', hoursSlept: '' })).toEqual({
      sleepDate: expect.any(String),
      hoursSlept: expect.any(String),
    })
  })

  it.each(['', ' ', '\t\n', '\u00a0'])(
    'treats blank hours as missing rather than zero (%j)',
    (hoursSlept) => {
      const error = validateSleep({ ...validValues, hoursSlept }).hoursSlept
      expect(error).toEqual(
        validateSleep({ ...validValues, hoursSlept: '' }).hoursSlept,
      )
      expect(error).toEqual(expect.any(String))
      expect(error).not.toEqual(
        validateSleep({ ...validValues, hoursSlept: '0' }).hoursSlept,
      )
    },
  )

  it.each([
    '2026-02-30',
    '2026-02-29',
    '1900-02-29',
    '2100-02-29',
    '2026-04-31',
    '2026-13-01',
    '2026-00-01',
    '2026-01-00',
    '0000-01-01',
    '2026-1-09',
    '09/10/2026',
    '2026-10-09T00:00:00.000Z',
    ' 2026-10-09',
    '2026-10-09\n',
  ])('rejects impossible or noncanonical calendar dates (%j)', (sleepDate) => {
    expect(validateSleep({ ...validValues, sleepDate })).toEqual({
      sleepDate: expect.any(String),
    })
  })

  it.each([
    '0',
    '0.0',
    '-0',
    '-1',
    '24.01',
    '25',
    '1e1',
    '1E1',
    '0x8',
    '0b1000',
    'Infinity',
    '-Infinity',
    'NaN',
    '7,5',
    '7 5',
    '7hours',
    '.',
    '+8',
  ])('rejects out-of-range or nondecimal hours (%j)', (hoursSlept) => {
    expect(validateSleep({ ...validValues, hoursSlept })).toEqual({
      hoursSlept: expect.any(String),
    })
  })
})

describe('sleep payload construction', () => {
  it.each([
    ['7.125', 7.125],
    ['7.', 7],
    ['0.000000001', 1e-9],
    ['0.0001', 0.0001],
    ['.5', 0.5],
    ['24', 24],
    [' \t7.5\n ', 7.5],
  ])(
    'converts %j to a JSON number without rounding',
    (hoursSlept, expected) => {
      const values = { ...validValues, hoursSlept }
      expect(toSleepPayload(values)).toEqual({
        sleepDate: '2026-10-09',
        hoursSlept: expected,
      })
      expect(values.hoursSlept).toBe(hoursSlept)
    },
  )

  it.each(['2026-03-29', '2026-10-25', '2099-12-31'])(
    'keeps the supplied calendar date intact (%s)',
    (sleepDate) => {
      expect(toSleepPayload({ ...validValues, sleepDate }).sleepDate).toBe(
        sleepDate,
      )
    },
  )

  it('only includes the two agreed fields and leaves the form unchanged', () => {
    const values = {
      ...validValues,
      userId: 6,
      activityType: 'walking',
      notes: 'A field from another history',
    }
    expect(toSleepPayload(values)).toEqual({
      sleepDate: '2026-10-09',
      hoursSlept: 7.5,
    })
    expect(values).toEqual({
      ...validValues,
      userId: 6,
      activityType: 'walking',
      notes: 'A field from another history',
    })
  })

  it.each([
    { ...validValues, sleepDate: '' },
    { ...validValues, sleepDate: '2026-02-30' },
    { ...validValues, hoursSlept: '' },
    { ...validValues, hoursSlept: '0' },
    { ...validValues, hoursSlept: '24.01' },
    { ...validValues, hoursSlept: '1e1' },
  ])('refuses to construct an invalid payload (%j)', (values) => {
    expect(() => toSleepPayload(values)).toThrow()
  })
})
