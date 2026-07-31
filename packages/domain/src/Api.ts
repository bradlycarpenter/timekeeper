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
  LinkAlreadyExists,
  NoWorkToday,
  SheetAuthFailed,
  SheetNotConnected,
  UpstreamFailed,
} from './Errors.ts'
import { JiraProject, JiraStatusCategory } from './Jira.ts'
import { UserSettings, UserSettingsPatch } from './Settings.ts'
import { StubDraft, StubId, StubPreview } from './Stub.ts'
import {
  HistoryEntry,
  OvertimeDraft,
  PostNow,
  Today,
  TodayEntry,
} from './Today.ts'
import { SheetEntryRange, SheetProject } from './Warp.ts'

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
  /* One rule per request, not a batch of the whole rule set: a slow or
   * unreachable board then only stalls the row being edited, and each draft
   * can be cached and debounced independently by its own atom key. */
  .add(
    HttpApiEndpoint.post('preview', '/projects/:projectKey/preview', {
      params: { projectKey: Schema.String },
      payload: StubDraft,
      success: StubPreview,
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
      error: LinkAlreadyExists,
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
  .add(
    HttpApiEndpoint.post('markOvertime', '/:id/overtime', {
      params: { id: BoardSheetId },
      payload: OvertimeDraft,
      success: TodayEntry,
      error: [HttpApiError.NotFound, AlreadyPosted],
    }),
  )
  /* The ticket key is the identifier here rather than a row id: the client
   * knows the ticket it is unmarking, not the row we happened to write. */
  .add(
    HttpApiEndpoint.delete('clearOvertime', '/:id/overtime/:issueKey', {
      params: { id: BoardSheetId, issueKey: Schema.String },
      success: TodayEntry,
      error: [HttpApiError.NotFound],
    }),
  )
  .middleware(Authentication)
  .prefix('/api/today')

const timesheet = HttpApiGroup.make('timesheet')
  .add(
    HttpApiEndpoint.get('entries', '/entries', {
      query: {
        from: Schema.optional(Schema.String),
        to: Schema.optional(Schema.String),
      },
      success: SheetEntryRange,
      error: [SheetNotConnected, UpstreamFailed],
    }),
  )
  .middleware(Authentication)
  .prefix('/api/timesheet')

const settings = HttpApiGroup.make('settings')
  .add(HttpApiEndpoint.get('get', '/', { success: UserSettings }))
  .add(
    HttpApiEndpoint.patch('update', '/', {
      payload: UserSettingsPatch,
      success: UserSettings,
    }),
  )
  .middleware(Authentication)
  .prefix('/api/settings')

export const api = HttpApi.make('timekeeper')
  .add(viewer)
  .add(connections)
  .add(sheet)
  .add(board)
  .add(links)
  .add(today)
  .add(timesheet)
  .add(settings)
