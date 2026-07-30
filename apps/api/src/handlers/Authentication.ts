import { Api } from '@tk/domain'
import { Effect, Layer, Option } from 'effect'
import { HttpServerRequest } from 'effect/unstable/http'
import { HttpApiError } from 'effect/unstable/httpapi'
import { Auth } from '../Auth.ts'

/** Resolves the better-auth session cookie once per request and hands handlers a
 * `CurrentUser`, so no handler reads headers or decides what unauthenticated
 * means. */
export const AuthenticationLive = Layer.effect(
  Api.Authentication,
  Effect.gen(function* () {
    const auth = yield* Auth

    return (httpEffect) =>
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest
        const user = yield* auth.session(new Headers(request.headers))

        if (Option.isNone(user)) {
          return yield* Effect.fail(new HttpApiError.Unauthorized())
        }

        return yield* Effect.provideService(
          httpEffect,
          Api.CurrentUser,
          user.value,
        )
      })
  }),
)
