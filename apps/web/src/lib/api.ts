import { Api } from '@tk/domain'
import { FetchHttpClient } from 'effect/unstable/http'
import { AtomHttpApi } from 'effect/unstable/reactivity'

/** Derived from the same `HttpApi` the worker implements, so every request and
 * response here is the server's own type. The app is served from the same origin
 * as the API, so the session cookie rides along without configuration. */
export class ApiClient extends AtomHttpApi.Service<ApiClient>()('ApiClient', {
  api: Api.api,
  httpClient: FetchHttpClient.layer,
}) {}

/** Keys mutations invalidate, so posting or editing refreshes exactly the views
 * that depend on what changed. */
export const keys = {
  connections: ['connections'],
  links: ['links'],
  today: ['today'],
  history: ['history'],
} as const
