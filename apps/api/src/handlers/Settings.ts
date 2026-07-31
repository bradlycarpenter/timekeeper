import { Api } from '@tk/domain'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/unstable/httpapi'
import { Repo } from '../Repo.ts'

export const SettingsLive = HttpApiBuilder.group(
  Api.api,
  'settings',
  (handlers) =>
    handlers
      .handle('get', () =>
        Effect.gen(function* () {
          const user = yield* Api.CurrentUser
          const repo = yield* Repo
          return { standardHours: yield* repo.standardHours(user.id) }
        }),
      )
      .handle('update', ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* Api.CurrentUser
          const repo = yield* Repo

          if (payload.standardHours !== undefined) {
            yield* repo.saveStandardHours(user.id, payload.standardHours)
          }

          return { standardHours: yield* repo.standardHours(user.id) }
        }),
      ),
)
