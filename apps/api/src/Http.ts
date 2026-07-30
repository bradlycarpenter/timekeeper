import { Errors } from '@tk/domain'
import { Effect, Schema } from 'effect'
import type { HttpClientResponse } from 'effect/unstable/http'

export type UpstreamService = 'warp' | 'jira'

export const upstream = (service: UpstreamService, detail: string) =>
  new Errors.UpstreamFailed({ service, detail })

/** Reads a response body against a schema, collapsing transport and shape
 * failures into one `UpstreamFailed` after logging the real cause. */
export const decodeJson =
  <S extends Schema.Top>(schema: S, service: UpstreamService, what: string) =>
  (
    response: HttpClientResponse.HttpClientResponse,
  ): Effect.Effect<
    S['Type'],
    Errors.UpstreamFailed,
    S['DecodingServices']
  > =>
    response.json.pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(schema)),
      Effect.tapCause((cause) =>
        Effect.logError(`${service}: could not read ${what}`, cause),
      ),
      Effect.mapError(() =>
        upstream(service, `Could not read ${what} from ${service}`),
      ),
    )

/** Wraps a request whose failure is never actionable by the user. */
export const send = <A, E>(
  effect: Effect.Effect<A, E>,
  service: UpstreamService,
  what: string,
): Effect.Effect<A, Errors.UpstreamFailed> =>
  effect.pipe(
    Effect.tapCause((cause) =>
      Effect.logError(`${service}: ${what} failed`, cause),
    ),
    Effect.mapError(() => upstream(service, `${service} did not answer`)),
  )
