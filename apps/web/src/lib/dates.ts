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
