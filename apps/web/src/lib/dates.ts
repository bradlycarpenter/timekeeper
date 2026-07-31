/** Entry dates are plain calendar days, so they are formatted as UTC to stop the
 * viewer's own offset shifting the label a day either way. */
const asDate = (isoDay: string) => new Date(`${isoDay}T12:00:00Z`)

export const formatDayLong = (isoDay: string) =>
  asDate(isoDay).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })

export const formatDayShort = (isoDay: string) =>
  asDate(isoDay).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })

export const formatDayNumeric = (isoDay: string) =>
  asDate(isoDay).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })

export const formatWeekday = (isoDay: string) =>
  asDate(isoDay).toLocaleDateString(undefined, {
    weekday: 'short',
    timeZone: 'UTC',
  })

export const formatMonth = (isoDay: string) =>
  asDate(isoDay).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

const pad = (value: number) => String(value).padStart(2, '0')

const isoDay = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`

/** Month arithmetic on plain calendar strings, so no timezone ever shifts which
 * month the user is looking at. `month` is zero-based, as `Date` has it. */
export const monthBounds = (year: number, month: number) => ({
  from: isoDay(year, month, 1),
  to: isoDay(year, month, new Date(Date.UTC(year, month + 1, 0)).getUTCDate()),
})

export const addMonths = (
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } => {
  const total = year * 12 + month + delta
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 }
}

/** Weekends are excluded: a Saturday with nothing logged is not a gap. */
export const isWeekend = (day: string) => {
  const weekday = asDate(day).getUTCDay()
  return weekday === 0 || weekday === 6
}

export const eachDayBetween = (from: string, to: string) => {
  const days: Array<string> = []
  const cursor = new Date(`${from}T12:00:00Z`)
  const last = new Date(`${to}T12:00:00Z`)
  while (cursor <= last) {
    days.push(
      isoDay(
        cursor.getUTCFullYear(),
        cursor.getUTCMonth(),
        cursor.getUTCDate(),
      ),
    )
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}
