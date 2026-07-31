import { Errors, Warp as WarpDomain } from '@tk/domain'
import { Context, DateTime, Duration, Effect, Layer, Schema } from 'effect'
import { Bindings } from './Bindings.ts'
import { Warp, ENTRY_PAGE_SIZE } from './Warp.ts'

/** A wide window costs one Warp round trip per page, so the scan stops rather
 * than spending the worker's whole subrequest budget. Callers are told it
 * stopped short instead of being handed a silently truncated window. */
const ENTRY_PAGE_LIMIT = 20
const MAX_ENTRY_WINDOW_DAYS = 400
const DAY_CACHE_TTL = Duration.toSeconds(Duration.days(30))

const Day = Schema.Array(WarpDomain.SheetEntry)
const decodeDay = Schema.decodeUnknownEffect(Day)

const dayKey = (personId: number, date: string) =>
  `entries:v1:${personId}:${date}`

const eachDay = (from: string, to: string) => {
  const days: Array<string> = []
  let cursor = DateTime.makeUnsafe(`${from}T00:00:00Z`)
  const last = DateTime.makeUnsafe(`${to}T00:00:00Z`)
  while (
    DateTime.isLessThanOrEqualTo(cursor, last) &&
    days.length < MAX_ENTRY_WINDOW_DAYS
  ) {
    days.push(DateTime.formatIsoDate(cursor))
    cursor = DateTime.addDuration(cursor, Duration.days(1))
  }
  return days
}

export class Entries extends Context.Service<
  Entries,
  {
    /** The user's own entries between `from` and `to` inclusive, newest first. */
    readonly forRange: (input: {
      readonly token: string
      readonly personId: number
      readonly from: string
      readonly to: string
      readonly today: string
    }) => Effect.Effect<WarpDomain.SheetEntryRange, Errors.UpstreamFailed>
    /** Drops a cached day so a freshly posted entry shows up immediately. */
    readonly invalidate: (input: {
      readonly personId: number
      readonly date: string
    }) => Effect.Effect<void>
  }
>()('tk/Entries') {}

export const EntriesLive = Layer.effect(
  Entries,
  Effect.gen(function* () {
    const env = yield* Bindings
    const warp = yield* Warp

    const readDay = (personId: number, date: string) =>
      Effect.gen(function* () {
        const raw = yield* Effect.tryPromise(() =>
          env.KV.get(dayKey(personId, date), { type: 'json' }),
        ).pipe(Effect.catchCause(() => Effect.succeed(null)))

        if (raw === null) return undefined

        return yield* decodeDay(raw).pipe(
          Effect.catchCause(() => Effect.succeed(undefined)),
        )
      })

    const writeDay = (
      personId: number,
      date: string,
      entries: ReadonlyArray<WarpDomain.SheetEntry>,
    ) =>
      Effect.tryPromise(() =>
        env.KV.put(dayKey(personId, date), JSON.stringify(entries), {
          expirationTtl: DAY_CACHE_TTL,
        }),
      ).pipe(
        Effect.catchCause((cause) =>
          Effect.logWarning('entries: day cache write failed', cause),
        ),
      )

    /* One scan from the earliest missing day fills in every day it passes,
     * because Warp returns the whole company oldest-first from `from`. */
    const scanFrom = (input: {
      readonly token: string
      readonly personId: number
      readonly from: string
      readonly to: string
    }) =>
      Effect.gen(function* () {
        const found = new Map<string, Array<WarpDomain.SheetEntry>>()
        let page = 0
        let complete = false
        let frontier = input.from

        while (!complete && page < ENTRY_PAGE_LIMIT) {
          const batch = yield* warp.entries(input.token, {
            from: input.from,
            page,
          })

          for (const raw of batch) {
            const entry = WarpDomain.toSheetEntry(raw)
            if (entry.date > frontier) frontier = entry.date
            if (raw.Person?.PersonId !== input.personId) continue
            const day = found.get(entry.date)
            if (day === undefined) found.set(entry.date, [entry])
            else day.push(entry)
          }

          if (batch.length < ENTRY_PAGE_SIZE || frontier > input.to) {
            complete = true
          }
          page++
        }

        return { found, frontier, complete }
      })

    return {
      forRange: (input) =>
        Effect.gen(function* () {
          if (input.to < input.from) {
            return {
              from: input.from,
              to: input.to,
              entries: [],
              totalHours: 0,
              overtimeHours: 0,
              coveredThrough: input.to,
              complete: true,
            }
          }

          const days = eachDay(input.from, input.to)
          const cached = new Map<
            string,
            ReadonlyArray<WarpDomain.SheetEntry>
          >()

          /* Today is still being written to, so it is never served from cache. */
          const hits = yield* Effect.forEach(
            days.filter((date) => date < input.today),
            (date) =>
              Effect.map(
                readDay(input.personId, date),
                (entries) => [date, entries] as const,
              ),
            { concurrency: 16 },
          )

          for (const [date, entries] of hits) {
            if (entries !== undefined) cached.set(date, entries)
          }

          const missing = days.filter((date) => !cached.has(date))
          let coveredThrough = input.to
          let complete = true

          if (missing.length > 0) {
            const scan = yield* scanFrom({
              token: input.token,
              personId: input.personId,
              from: missing[0]!,
              to: input.to,
            })
            coveredThrough = scan.complete ? input.to : scan.frontier
            complete = scan.complete

            const scanned = missing.filter((date) => date <= coveredThrough)
            for (const date of scanned) {
              cached.set(date, scan.found.get(date) ?? [])
            }

            yield* Effect.forEach(
              scanned.filter((date) => date < input.today),
              (date) =>
                writeDay(
                  input.personId,
                  date,
                  scan.found.get(date) ?? [],
                ),
              { concurrency: 16, discard: true },
            )
          }

          const entries = Array.from(cached.values())
            .flat()
            .sort((left, right) => right.entryId - left.entryId)

          return {
            from: input.from,
            to: input.to,
            entries,
            totalHours: entries
              .filter((entry) => !entry.overtime)
              .reduce((total, entry) => total + entry.hours, 0),
            overtimeHours: entries
              .filter((entry) => entry.overtime)
              .reduce((total, entry) => total + entry.hours, 0),
            coveredThrough,
            complete,
          }
        }),

      invalidate: (input) =>
        Effect.tryPromise(() =>
          env.KV.delete(dayKey(input.personId, input.date)),
        ).pipe(Effect.catchCause(() => Effect.void)),
    }
  }),
)
