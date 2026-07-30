import { Api } from '@tk/domain'
import { FileSystem, Layer, Path } from 'effect'
import { Etag, FetchHttpClient, HttpPlatform, HttpRouter } from 'effect/unstable/http'
import { HttpApiBuilder } from 'effect/unstable/httpapi'
import { Reactivity } from 'effect/unstable/reactivity'
import { D1Client } from '@effect/sql-d1'
import { AuthLive } from './Auth.ts'
import { Bindings, type Env } from './Bindings.ts'
import { AuthenticationLive } from './handlers/Authentication.ts'
import { ConnectionsLive, ViewerLive } from './handlers/Connections.ts'
import { LinksLive } from './handlers/Links.ts'
import { BoardLive, SheetLive } from './handlers/Projects.ts'
import { TodayLive } from './handlers/Today.ts'
import { JiraLive } from './Jira.ts'
import { RepoLive } from './Repo.ts'
import { TimesheetLive } from './Timesheet.ts'
import { WarpLive } from './Warp.ts'

/** Workers has no filesystem; the API layer only asks for these to serve static
 * files, which this worker never does. */
const PlatformLive = Layer.mergeAll(
  Path.layer,
  Etag.layerWeak,
  HttpPlatform.layer,
).pipe(Layer.provideMerge(FileSystem.layerNoop({})))

export const servicesLayer = (env: Env) => {
  const bindings = Layer.succeed(Bindings, env)
  const sql = D1Client.layer({ db: env.DB }).pipe(
    Layer.provide(Reactivity.layer),
  )
  const infrastructure = Layer.mergeAll(
    bindings,
    sql,
    FetchHttpClient.layer,
  )
  const auth = AuthLive.pipe(Layer.provide(infrastructure))
  const repo = RepoLive.pipe(Layer.provide(infrastructure))
  const warp = WarpLive.pipe(Layer.provide(infrastructure))
  const jira = JiraLive.pipe(Layer.provide(Layer.merge(infrastructure, auth)))

  const timesheet = TimesheetLive.pipe(
    Layer.provide(Layer.mergeAll(infrastructure, repo, warp, jira)),
  )

  return Layer.mergeAll(infrastructure, auth, repo, warp, jira, timesheet)
}

const apiLayer = (env: Env) => {
  const services = servicesLayer(env)

  const groups = Layer.mergeAll(
    ViewerLive,
    ConnectionsLive,
    SheetLive,
    BoardLive,
    LinksLive,
    TodayLive,
  ).pipe(Layer.provide(AuthenticationLive))

  /* Handler requirements travel as per-request markers that are only discharged
   * against what the app layer *outputs*, so the services are merged in rather
   * than merely provided. */
  return HttpApiBuilder.layer(Api.api, {
    openapiPath: '/api/openapi.json',
  }).pipe(
    Layer.provide(groups),
    Layer.provide(PlatformLive),
    Layer.provideMerge(services),
  )
}

/** Bindings arrive per request but the layer is built without a request context,
 * so the handler is built once per isolate from the first request's env. A
 * worker isolate only ever serves one set of bindings. */
let cached: { readonly handler: (request: Request) => Promise<Response> } | undefined

export const webHandler = (env: Env) => {
  cached ??= HttpRouter.toWebHandler(apiLayer(env))
  return cached.handler
}
