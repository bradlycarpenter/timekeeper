import { Time } from '@tk/domain'
import { Context, DateTime, Effect } from 'effect'

export type DailyPostJob = {
  readonly boardSheetId: string
  readonly entryDate: string
}

export type Env = {
  readonly DB: D1Database
  readonly KV: KVNamespace
  readonly DAILY_POST_QUEUE: Queue<DailyPostJob>
  readonly BETTER_AUTH_SECRET: string
  readonly BETTER_AUTH_URL: string
  readonly BETTER_AUTH_TRUSTED_ORIGINS?: string
  readonly MICROSOFT_CLIENT_ID: string
  readonly MICROSOFT_CLIENT_SECRET?: string
  readonly MICROSOFT_TENANT_ID?: string
  readonly ATLASSIAN_CLIENT_ID: string
  readonly ATLASSIAN_CLIENT_SECRET?: string
  readonly WARP_DOMAIN: string
  /** IANA zone deciding which calendar day work is billed to. */
  readonly TIMEZONE?: string
}

export class Bindings extends Context.Service<Bindings, Env>()('tk/Bindings') {}

/** Re-exported from the domain so the worker and the web app cannot drift
 * onto different working days. */
export const DEFAULT_TIMEZONE = Time.DEFAULT_TIME_ZONE

export const warpDomain = Effect.map(Bindings, (env) => env.WARP_DOMAIN)

/** The zone the user's working day is measured in. Everything that decides
 * "today" goes through here so a late-evening visit doesn't roll the date over
 * while it is still the same working day locally. */
export const timeZone = Effect.map(Bindings, (env) =>
  DateTime.zoneMakeNamedUnsafe(env.TIMEZONE ?? DEFAULT_TIMEZONE),
)

export const today = Effect.gen(function* () {
  const zone = yield* timeZone
  const now = yield* DateTime.now
  return DateTime.formatIsoDate(DateTime.setZone(now, zone))
})
