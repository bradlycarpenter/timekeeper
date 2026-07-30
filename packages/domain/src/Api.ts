import { Context, Schema } from 'effect'
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
  HttpApiMiddleware,
  HttpApiSchema,
} from 'effect/unstable/httpapi'
import { BoardSheet, BoardSheetDraft, BoardSheetId, BoardSheetPatch } from './BoardSheet.ts'
import { Connections, SheetCredentials, SheetConnection, Viewer } from './Connections.ts'
import {
  AlreadyPosted,
  BoardNotConnected,
  NoWorkToday,
  SheetAuthFailed,
  SheetNotConnected,
  UpstreamFailed,
} from './Errors.ts'
import { JiraProject, JiraStatusCategory } from './Jira.ts'
import { StubDraft, StubId } from './Stub.ts'
import { HistoryEntry, PostNow, Today, TodayEntry } from './Today.ts'
import { SheetProject } from './Warp.ts'

/** The signed-in user, provided by the authentication middleware so handlers
 * never read session cookies themselves. */
export class CurrentUser extends Context.Service<
  CurrentUser,
  { readonly id: string; readonly name: string; readonly email: string; readonly image?: string }
>()('tk/CurrentUser') {}

/** Sessions ride on the better-auth cookie, so there is no security scheme to
 * declare; the middleware either resolves a user or fails Unauthorized. */
export class Authentication extends HttpApiMiddleware.Service<
  Authentication,
  { provides: CurrentUser }
>()('tk/Authentication', {
  error: HttpApiError.Unauthorized,
}) {}

const viewer = HttpApiGroup.make('viewer')
  .add(HttpApiEndpoint.get('me', '/viewer', { success: Viewer }))
  .middleware(Authentication)
  .prefix('/api')

const connections = HttpApiGroup.make('connections')
  .add(HttpApiEndpoint.get('get', '/', { success: Connections }))
  .add(
    HttpApiEndpoint.post('connectSheet', '/sheet', {
      payload: SheetCredentials,
      success: SheetConnection,
      error: [SheetAuthFailed, UpstreamFailed],
    }),
  )
  .add(
    HttpApiEndpoint.delete('disconnectSheet', '/sheet', {
      success: HttpApiSchema.NoContent,
    }),
  )
  .middleware(Authentication)
  .prefix('/api/connections')

const sheet = HttpApiGroup.make('sheet')
  .add(
    HttpApiEndpoint.get('projects', '/projects', {
      success: Schema.Array(SheetProject),
      error: [SheetNotConnected, UpstreamFailed],
    }),
  )
  .middleware(Authentication)
  .prefix('/api/sheet')

const board = HttpApiGroup.make('board')
  .add(
    HttpApiEndpoint.get('projects', '/projects', {
      success: Schema.Array(JiraProject),
      error: [BoardNotConnected, UpstreamFailed],
    }),
  )
  .add(
    HttpApiEndpoint.get('statuses', '/projects/:projectKey/statuses', {
      params: { projectKey: Schema.String },
      success: Schema.Array(JiraStatusCategory),
      error: [BoardNotConnected, UpstreamFailed],
    }),
  )
  .middleware(Authentication)
  .prefix('/api/board')

const links = HttpApiGroup.make('links')
  .add(HttpApiEndpoint.get('list', '/', { success: Schema.Array(BoardSheet) }))
  .add(
    HttpApiEndpoint.post('create', '/', {
      payload: BoardSheetDraft,
      success: BoardSheet,
    }),
  )
  .add(
    HttpApiEndpoint.get('get', '/:id', {
      params: { id: BoardSheetId },
      success: BoardSheet,
      error: HttpApiError.NotFound,
    }),
  )
  .add(
    HttpApiEndpoint.patch('update', '/:id', {
      params: { id: BoardSheetId },
      payload: BoardSheetPatch,
      success: BoardSheet,
      error: HttpApiError.NotFound,
    }),
  )
  .add(
    HttpApiEndpoint.delete('remove', '/:id', {
      params: { id: BoardSheetId },
      success: HttpApiSchema.NoContent,
      error: HttpApiError.NotFound,
    }),
  )
  .add(
    HttpApiEndpoint.post('addStub', '/:id/stubs', {
      params: { id: BoardSheetId },
      payload: StubDraft,
      success: BoardSheet,
      error: HttpApiError.NotFound,
    }),
  )
  .add(
    HttpApiEndpoint.delete('removeStub', '/:id/stubs/:stubId', {
      params: { id: BoardSheetId, stubId: StubId },
      success: BoardSheet,
      error: HttpApiError.NotFound,
    }),
  )
  .middleware(Authentication)
  .prefix('/api/links')

const today = HttpApiGroup.make('today')
  /* A board that will not answer is reported against the entry it affects
   * rather than failing the whole day's view, so this cannot fail. */
  .add(HttpApiEndpoint.get('get', '/', { success: Today }))
  .add(
    HttpApiEndpoint.get('history', '/history', {
      query: { limit: Schema.optional(Schema.Number) },
      success: Schema.Array(HistoryEntry),
    }),
  )
  .add(
    HttpApiEndpoint.post('post', '/:id/post', {
      params: { id: BoardSheetId },
      payload: PostNow,
      success: TodayEntry,
      error: [
        HttpApiError.NotFound,
        AlreadyPosted,
        NoWorkToday,
        SheetNotConnected,
        BoardNotConnected,
        UpstreamFailed,
      ],
    }),
  )
  .add(
    HttpApiEndpoint.post('skip', '/:id/skip', {
      params: { id: BoardSheetId },
      success: TodayEntry,
      error: [HttpApiError.NotFound, AlreadyPosted],
    }),
  )
  .middleware(Authentication)
  .prefix('/api/today')

export const api = HttpApi.make('timekeeper')
  .add(viewer)
  .add(connections)
  .add(sheet)
  .add(board)
  .add(links)
  .add(today)
