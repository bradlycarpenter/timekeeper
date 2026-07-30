import { Api, type Connections as ConnectionsDomain } from '@tk/domain'
import { Effect, Layer, Option } from 'effect'
import { HttpApiBuilder } from 'effect/unstable/httpapi'
import { Repo } from '../Repo.ts'
import { Warp } from '../Warp.ts'

export const ViewerLive = HttpApiBuilder.group(Api.api, 'viewer', (handlers) =>
  handlers.handle('me', () => Api.CurrentUser),
)

export const ConnectionsLive = HttpApiBuilder.group(
  Api.api,
  'connections',
  (handlers) =>
    handlers
      .handle('get', () =>
        Effect.gen(function* () {
          const user = yield* Api.CurrentUser
          const repo = yield* Repo
          const warp = yield* Warp

          const token = yield* repo.sheetToken(user.id)
          const accountId = yield* repo.jiraAccountId(user.id)

          /* A stored token can stop working when the Warp password changes, so
           * the connection is proved rather than assumed. */
          const sheet: ConnectionsDomain.SheetConnection = yield* Option.match(
            token,
            {
              onNone: () =>
                Effect.succeed({ status: 'disconnected' as const }),
              onSome: (value) =>
                warp.me(value).pipe(
                  Effect.map(
                    (person) =>
                      ({
                        status: 'connected',
                        personId: person.PersonId,
                        email: person.Email,
                      }) as const,
                  ),
                  Effect.catchTag('UpstreamFailed', () =>
                    Effect.succeed({ status: 'stale' as const }),
                  ),
                ),
            },
          )

          return {
            sheet,
            board: Option.match(accountId, {
              onNone: () => ({ status: 'disconnected' }) as const,
              onSome: (value) =>
                ({ status: 'connected', accountId: value }) as const,
            }),
          }
        }),
      )
      .handle('connectSheet', ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* Api.CurrentUser
          const repo = yield* Repo
          const warp = yield* Warp

          const token = yield* warp.authorise(payload.email, payload.password)
          const person = yield* warp.me(token)
          yield* repo.saveSheetToken(user.id, token)

          return {
            status: 'connected' as const,
            personId: person.PersonId,
            email: person.Email,
          }
        }),
      )
      .handle('disconnectSheet', () =>
        Effect.gen(function* () {
          const user = yield* Api.CurrentUser
          const repo = yield* Repo
          yield* repo.deleteSheetToken(user.id)
        }),
      ),
)
