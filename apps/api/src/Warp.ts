import { Errors, Warp as WarpDomain } from '@tk/domain'
import { Context, Effect, Layer, Schema } from 'effect'
import { HttpClient, HttpClientRequest } from 'effect/unstable/http'
import { Bindings, warpDomain } from './Bindings.ts'
import { decodeJson, send, upstream } from './Http.ts'

const PROJECTS_CACHE_KEY = 'warp-projects'
const PROJECTS_CACHE_TTL = 60 * 60 * 24 * 7
const PER_PAGE = 500

/** Warp lists every person's entries, roughly 150 a day across the company, so
 * a page of this size covers about a week. */
export const ENTRY_PAGE_SIZE = 1000

const AuthorisedToken = Schema.Struct({ token: Schema.String })
const WarpEntries = Schema.Array(WarpDomain.WarpEntry)
const SheetProjects = Schema.Array(WarpDomain.SheetProject)
const WarpProjects = Schema.Array(WarpDomain.WarpProject)

export type EntryDraft = {
  readonly taskId: number
  readonly personId: number
  readonly costCodeId: number
  readonly hours: number
  readonly entryDate: string
  readonly comments: string
  readonly overtime: boolean
}

export class Warp extends Context.Service<
  Warp,
  {
    /** Exchanges Warp credentials for the long-lived token we store. */
    readonly authorise: (
      email: string,
      password: string,
    ) => Effect.Effect<string, Errors.SheetAuthFailed | Errors.UpstreamFailed>
    readonly me: (
      token: string,
    ) => Effect.Effect<WarpDomain.WarpPerson, Errors.UpstreamFailed>
    readonly projects: (
      token: string,
    ) => Effect.Effect<
      ReadonlyArray<WarpDomain.SheetProject>,
      Errors.UpstreamFailed
    >
    readonly createEntry: (
      token: string,
      draft: EntryDraft,
    ) => Effect.Effect<number, Errors.UpstreamFailed>
    /** One page of the company-wide entry list from `from` onwards. Callers
     * filter to their own person and page until they pass the date they want. */
    readonly entries: (
      token: string,
      options: { readonly from: string; readonly page: number },
    ) => Effect.Effect<
      ReadonlyArray<WarpDomain.WarpEntry>,
      Errors.UpstreamFailed
    >
  }
>()('tk/Warp') {}

export const WarpLive = Layer.effect(
  Warp,
  Effect.gen(function* () {
    const env = yield* Bindings
    const domain = yield* warpDomain
    const http = yield* HttpClient.HttpClient
    const base = `https://${domain}`

    const authed = (token: string, request: HttpClientRequest.HttpClientRequest) =>
      http.execute(
        HttpClientRequest.setHeaders(request, {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        }),
      )

    const fetchProjectPage = (
      token: string,
      page: number,
    ): Effect.Effect<
      ReadonlyArray<WarpDomain.WarpProject>,
      Errors.UpstreamFailed
    > =>
      Effect.gen(function* () {
        const response = yield* send(
          authed(
            token,
            HttpClientRequest.get(
              `${base}/api/Project?per_page=${PER_PAGE}&page=${page}`,
            ),
          ),
          'warp',
          'project list',
        )
        const projects = yield* decodeJson(
          WarpProjects,
          'warp',
          'your Warp projects',
        )(response)

        return projects.length < PER_PAGE
          ? projects
          : [...projects, ...(yield* fetchProjectPage(token, page + 1))]
      })

    const cachedProjects = Effect.gen(function* () {
      const raw = yield* Effect.tryPromise(() =>
        env.KV.get(PROJECTS_CACHE_KEY, { type: 'json' }),
      ).pipe(Effect.catchCause(() => Effect.succeed(null)))

      return yield* Schema.decodeUnknownEffect(SheetProjects)(raw).pipe(
        Effect.map((projects) => (projects.length > 0 ? projects : undefined)),
        Effect.catchCause(() => Effect.succeed(undefined)),
      )
    })

    return {
      authorise: (email, password) =>
        Effect.gen(function* () {
          const response = yield* send(
            http.execute(
              HttpClientRequest.post(`${base}/api/account/authorise`).pipe(
                HttpClientRequest.bodyJsonUnsafe({
                  Email: email,
                  Password: password,
                }),
              ),
            ),
            'warp',
            'sign in',
          )

          /* Warp answers 4xx for wrong credentials, which is a message for the
           * user rather than a fault to report. */
          if (response.status >= 400 && response.status < 500) {
            return yield* Effect.fail(new Errors.SheetAuthFailed())
          }

          const body = yield* decodeJson(
            AuthorisedToken,
            'warp',
            'the sign in response',
          )(response)

          return body.token
        }),

      me: (token) =>
        Effect.gen(function* () {
          const response = yield* send(
            authed(token, HttpClientRequest.get(`${base}/api/users/me`)),
            'warp',
            'profile lookup',
          )
          return yield* decodeJson(
            WarpDomain.WarpPerson,
            'warp',
            'your Warp profile',
          )(response)
        }),

      /* The project list is large, changes rarely and is the same for everyone,
       * so it is cached for the whole namespace rather than per user. */
      projects: (token) =>
        Effect.gen(function* () {
          const cached = yield* cachedProjects
          if (cached) return cached

          const projects = (yield* fetchProjectPage(token, 0)).map(
            WarpDomain.toSheetProject,
          )

          yield* Effect.tryPromise(() =>
            env.KV.put(PROJECTS_CACHE_KEY, JSON.stringify(projects), {
              expirationTtl: PROJECTS_CACHE_TTL,
            }),
          ).pipe(
            Effect.catchCause((cause) =>
              Effect.logWarning('warp: project cache write failed', cause),
            ),
          )

          return projects
        }),

      createEntry: (token, draft) =>
        Effect.gen(function* () {
          const response = yield* send(
            authed(
              token,
              HttpClientRequest.post(`${base}/api/entry/create`).pipe(
                HttpClientRequest.bodyJsonUnsafe({
                  TaskId: String(draft.taskId),
                  PersonId: String(draft.personId),
                  CostCodeId: String(draft.costCodeId),
                  DepartmentId: '1',
                  Overtime: draft.overtime ? '1' : '0',
                  Time: String(draft.hours),
                  /* Warp stamps entries at end of day in its own local time. */
                  EntryDate: `${draft.entryDate}T17:00:00`,
                  Comments: draft.comments,
                  WorkLogId: '0',
                  Audited: '0',
                }),
              ),
            ),
            'warp',
            'entry creation',
          )

          if (response.status < 200 || response.status >= 300) {
            const detail = yield* response.text.pipe(
              Effect.catchCause(() => Effect.succeed('')),
            )
            yield* Effect.logError('warp: entry rejected', {
              status: response.status,
              detail,
            })
            return yield* Effect.fail(
              upstream('warp', 'Warp rejected the timesheet entry'),
            )
          }

          const created = yield* decodeJson(
            WarpDomain.WarpEntryCreated,
            'warp',
            'the created entry',
          )(response)

          return created.EntryId
        }),

      /* `to` is deliberately not sent: passing it alongside `from` collapses
       * Warp's result to the `from` day alone. Its person filters are ignored
       * too, so the caller pages forward and filters itself. */
      entries: (token, options) =>
        Effect.gen(function* () {
          const response = yield* send(
            authed(
              token,
              HttpClientRequest.get(
                `${base}/api/entry/?from=${options.from}&page=${options.page}&per_page=${ENTRY_PAGE_SIZE}`,
              ),
            ),
            'warp',
            'entry list',
          )
          return yield* decodeJson(
            WarpEntries,
            'warp',
            'your timesheet entries',
          )(response)
        }),
    }
  }),
)
