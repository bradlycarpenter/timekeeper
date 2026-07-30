import { Api, type BoardSheet as BoardSheetDomain } from '@tk/domain'
import { Effect, Option } from 'effect'
import { HttpApiBuilder, HttpApiError } from 'effect/unstable/httpapi'
import { Repo } from '../Repo.ts'
import { Timesheet } from '../Timesheet.ts'

const requireLink = (userId: string, id: BoardSheetDomain.BoardSheetId) =>
  Effect.gen(function* () {
    const repo = yield* Repo
    const link = yield* repo.link(userId, id)
    return yield* Option.match(link, {
      onNone: () => Effect.fail(new HttpApiError.NotFound()),
      onSome: Effect.succeed,
    })
  })

export const TodayLive = HttpApiBuilder.group(Api.api, 'today', (handlers) =>
  handlers
    .handle('get', () =>
      Effect.gen(function* () {
        const user = yield* Api.CurrentUser
        const timesheet = yield* Timesheet
        return yield* timesheet.today(user.id)
      }),
    )
    .handle('history', ({ query }) =>
      Effect.gen(function* () {
        const user = yield* Api.CurrentUser
        const repo = yield* Repo
        return yield* repo.history(user.id, Math.min(query.limit ?? 30, 200))
      }),
    )
    .handle('post', ({ params, payload }) =>
      Effect.gen(function* () {
        const user = yield* Api.CurrentUser
        const timesheet = yield* Timesheet
        const link = yield* requireLink(user.id, params.id)
        const date = yield* timesheet.entryDate

        return yield* timesheet.post(user.id, link, date, payload.message)
      }),
    )
    .handle('skip', ({ params }) =>
      Effect.gen(function* () {
        const user = yield* Api.CurrentUser
        const timesheet = yield* Timesheet
        const link = yield* requireLink(user.id, params.id)
        const date = yield* timesheet.entryDate

        return yield* timesheet.skip(user.id, link, date)
      }),
    ),
)
