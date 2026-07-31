import { Api, Errors } from '@tk/domain'
import { DateTime, Duration, Effect, Option } from 'effect'
import { HttpApiBuilder } from 'effect/unstable/httpapi'
import { timeZone } from '../Bindings.ts'
import { Entries } from '../Entries.ts'
import { Repo } from '../Repo.ts'
import { Warp } from '../Warp.ts'

const DEFAULT_WINDOW_DAYS = 30

export const TimesheetEntriesLive = HttpApiBuilder.group(
  Api.api,
  'timesheet',
  (handlers) =>
    handlers.handle('entries', ({ query }) =>
      Effect.gen(function* () {
        const user = yield* Api.CurrentUser
        const repo = yield* Repo
        const warp = yield* Warp
        const entries = yield* Entries
        const zone = yield* timeZone

        const token = yield* Effect.flatMap(
          repo.sheetToken(user.id),
          Option.match({
            onNone: () => Effect.fail(new Errors.SheetNotConnected()),
            onSome: Effect.succeed,
          }),
        )

        const now = DateTime.setZone(yield* DateTime.now, zone)
        const today = DateTime.formatIsoDate(now)
        const to = query.to ?? today
        const from =
          query.from ??
          DateTime.formatIsoDate(
            DateTime.subtractDuration(now, Duration.days(DEFAULT_WINDOW_DAYS)),
          )

        const person = yield* warp.me(token)

        return yield* entries.forRange({
          token,
          personId: person.PersonId,
          from,
          to,
          today,
        })
      }),
    ),
)
