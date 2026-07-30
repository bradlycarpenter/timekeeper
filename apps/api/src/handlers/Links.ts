import { Api, type BoardSheet as BoardSheetDomain } from '@tk/domain'
import { Effect, Option } from 'effect'
import { HttpApiBuilder, HttpApiError } from 'effect/unstable/httpapi'
import { Repo } from '../Repo.ts'

/** Reads a link back after a write so the client gets the whole thing and never
 * has to stitch a response into its own copy. */
const requireLink = (userId: string, id: BoardSheetDomain.BoardSheetId) =>
  Effect.gen(function* () {
    const repo = yield* Repo
    const link = yield* repo.link(userId, id)
    return yield* Option.match(link, {
      onNone: () => Effect.fail(new HttpApiError.NotFound()),
      onSome: Effect.succeed,
    })
  })

export const LinksLive = HttpApiBuilder.group(Api.api, 'links', (handlers) =>
  handlers
    .handle('list', () =>
      Effect.gen(function* () {
        const user = yield* Api.CurrentUser
        const repo = yield* Repo
        return yield* repo.links(user.id)
      }),
    )
    .handle('create', ({ payload }) =>
      Effect.gen(function* () {
        const user = yield* Api.CurrentUser
        const repo = yield* Repo
        const id = yield* repo.createLink(user.id, payload)
        return yield* Effect.orDie(requireLink(user.id, id))
      }),
    )
    .handle('get', ({ params }) =>
      Effect.gen(function* () {
        const user = yield* Api.CurrentUser
        return yield* requireLink(user.id, params.id)
      }),
    )
    .handle('update', ({ params, payload }) =>
      Effect.gen(function* () {
        const user = yield* Api.CurrentUser
        const repo = yield* Repo
        yield* requireLink(user.id, params.id)
        yield* repo.updateLink(user.id, params.id, payload)
        return yield* requireLink(user.id, params.id)
      }),
    )
    .handle('remove', ({ params }) =>
      Effect.gen(function* () {
        const user = yield* Api.CurrentUser
        const repo = yield* Repo
        yield* requireLink(user.id, params.id)
        yield* repo.deleteLink(user.id, params.id)
      }),
    )
    .handle('addStub', ({ params, payload }) =>
      Effect.gen(function* () {
        const user = yield* Api.CurrentUser
        const repo = yield* Repo
        yield* requireLink(user.id, params.id)
        yield* repo.addStub(params.id, payload)
        return yield* requireLink(user.id, params.id)
      }),
    )
    .handle('removeStub', ({ params }) =>
      Effect.gen(function* () {
        const user = yield* Api.CurrentUser
        const repo = yield* Repo
        yield* requireLink(user.id, params.id)
        yield* repo.deleteStub(params.id, params.stubId)
        return yield* requireLink(user.id, params.id)
      }),
    ),
)
