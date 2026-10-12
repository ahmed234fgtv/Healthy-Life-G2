import type { SleepRecord } from '../types/sleep'
import { isRealCalendarDate } from './activityValidation'

export type SleepPeriod = '7' | '30' | 'all'

export interface SleepSummary {
  count: number
  total: number
  average: number | null
  min: SleepRecord | null
  max: SleepRecord | null
}

const SPANISH_MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sept',
  'oct',
  'nov',
  'dic',
]
const hoursFormatter = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 2,
})

function assertCalendarDate(value: string): void {
  if (!isRealCalendarDate(value)) {
    throw new RangeError('La fecha debe ser un día real en formato YYYY-MM-DD.')
  }
}

function compareChronologically(left: SleepRecord, right: SleepRecord): number {
  if (left.sleepDate < right.sleepDate) return -1
  if (left.sleepDate > right.sleepDate) return 1
  return left.id - right.id
}

/** At most 29 calendar steps: no timestamps, daylight-saving changes or year 0. */
function subtractCalendarDays(date: string, days: number): string {
  let [year, month, day] = date.split('-').map(Number)

  for (let remaining = days; remaining > 0; remaining -= 1) {
    if (day > 1) {
      day -= 1
      continue
    }

    if (month > 1) {
      month -= 1
    } else if (year > 1) {
      year -= 1
      month = 12
    } else {
      break
    }

    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
    const monthLengths = [
      31,
      leapYear ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ]
    day = monthLengths[month - 1]
  }

  return [
    String(year).padStart(4, '0'),
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-')
}

/** Records have already been validated by the API client. Each remains separate. */
export function filterSleepRecords(
  records: readonly SleepRecord[],
  period: SleepPeriod,
  today: string,
): SleepRecord[] {
  assertCalendarDate(today)

  if (period === 'all') return [...records].sort(compareChronologically)

  const start = subtractCalendarDays(today, period === '7' ? 6 : 29)
  return records
    .filter((record) => record.sleepDate >= start && record.sleepDate <= today)
    .sort(compareChronologically)
}

/** An average is per record, including multiple records on the same date. */
export function summarizeSleep(records: readonly SleepRecord[]): SleepSummary {
  let total = 0
  let min: SleepRecord | null = null
  let max: SleepRecord | null = null

  for (const record of records) {
    total += record.hoursSlept
    if (
      min === null ||
      record.hoursSlept < min.hoursSlept ||
      (record.hoursSlept === min.hoursSlept &&
        compareChronologically(record, min) < 0)
    ) {
      min = record
    }
    if (
      max === null ||
      record.hoursSlept > max.hoursSlept ||
      (record.hoursSlept === max.hoursSlept &&
        compareChronologically(record, max) < 0)
    ) {
      max = record
    }
  }

  return {
    count: records.length,
    total,
    average: records.length === 0 ? null : total / records.length,
    min,
    max,
  }
}

export function formatSleepDate(date: string, includeYear = true): string {
  assertCalendarDate(date)
  const [year, month, day] = date.split('-')
  const dayAndMonth = `${Number(day)} ${SPANISH_MONTHS[Number(month) - 1]}`
  return includeYear ? `${dayAndMonth} ${year}` : dayAndMonth
}

/** Exact mode preserves the stored number; summary mode never shows a tiny value as 0. */
export function formatSleepHours(hours: number, precise = false): string {
  if (precise) return String(hours).replace('.', ',')
  if (hours > 0 && hours < 0.01) return '<0,01'
  return hoursFormatter.format(hours)
}
