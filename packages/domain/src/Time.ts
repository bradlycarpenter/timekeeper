/** The working timezone the whole product bills against. Shared rather than
 * duplicated: the worker resolves entry dates in it, and the web app needs the
 * same calendar day to show today's date without waiting for a round trip.
 *
 * The `TIMEZONE` binding may override it on the worker. If the team ever moves
 * zone, this, that binding, and the cron hour in `wrangler.jsonc` all change
 * together. */
export const DEFAULT_TIME_ZONE = 'Africa/Johannesburg'

/** Today's calendar date in the working zone, as `YYYY-MM-DD`. `en-CA` is used
 * because it formats as ISO; the zone, not the viewer's locale, decides the
 * day. */
export const entryDateIn = (
  timeZone: string = DEFAULT_TIME_ZONE,
  now: Date = new Date(),
): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
