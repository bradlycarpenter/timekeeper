import { Errors, Jira as JiraDomain } from '@tk/domain'
import { Context, Effect, Layer, Schema } from 'effect'
import { HttpClient, HttpClientRequest } from 'effect/unstable/http'
import { Auth } from './Auth.ts'
import { Bindings } from './Bindings.ts'
import { decodeJson, send } from './Http.ts'

const CLOUD_ID_TTL = 60 * 60 * 24

const AccessibleResources = Schema.Array(
  Schema.Struct({
    id: Schema.String,
    url: Schema.String,
    name: Schema.String,
  }),
)

const IssuePage = Schema.Struct({
  issues: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      key: Schema.String,
      fields: Schema.Struct({
        summary: Schema.String,
        status: Schema.optional(Schema.Struct({ name: Schema.String })),
      }),
    }),
  ),
  isLast: Schema.optional(Schema.Boolean),
  nextPageToken: Schema.optional(Schema.String),
})

const ProjectPage = Schema.Struct({
  issues: Schema.Array(
    Schema.Struct({
      fields: Schema.Struct({ project: JiraDomain.JiraProject }),
    }),
  ),
  nextPageToken: Schema.optional(Schema.String),
})

const StatusesByType = Schema.Array(
  Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    statuses: Schema.Array(
      Schema.Struct({
        id: JiraDomain.JiraStatusId,
        name: Schema.String,
        statusCategory: Schema.Struct({
          key: Schema.String,
          colorName: Schema.String,
          name: Schema.String,
        }),
      }),
    ),
  }),
)

export class Jira extends Context.Service<
  Jira,
  {
    readonly projects: (
      userId: string,
    ) => Effect.Effect<
      ReadonlyArray<JiraDomain.JiraProject>,
      Errors.BoardNotConnected | Errors.UpstreamFailed
    >
    readonly statuses: (
      userId: string,
      projectKey: string,
    ) => Effect.Effect<
      ReadonlyArray<JiraDomain.JiraStatusCategory>,
      Errors.BoardNotConnected | Errors.UpstreamFailed
    >
    readonly search: (
      userId: string,
      jql: string,
    ) => Effect.Effect<
      ReadonlyArray<JiraDomain.JiraIssue>,
      Errors.BoardNotConnected | Errors.UpstreamFailed
    >
  }
>()('tk/Jira') {}

export const JiraLive = Layer.effect(
  Jira,
  Effect.gen(function* () {
    const env = yield* Bindings
    const auth = yield* Auth
    const http = yield* HttpClient.HttpClient

    const request = (token: string, url: string) =>
      http.execute(
        HttpClientRequest.get(url).pipe(
          HttpClientRequest.setHeaders({
            authorization: `Bearer ${token}`,
            accept: 'application/json',
          }),
        ),
      )

    /** OAuth calls go through `api.atlassian.com/ex/jira/{cloudId}`, so the id
     * of the user's site has to be resolved first. It is stable, so it is
     * cached per user. */
    const cloudId = (userId: string, token: string) =>
      Effect.gen(function* () {
        const cacheKey = `jira-cloud-id:${userId}`
        const cached = yield* Effect.tryPromise(() =>
          env.KV.get(cacheKey, { type: 'text' }),
        ).pipe(Effect.catchCause(() => Effect.succeed(null)))

        if (cached) return cached

        const response = yield* send(
          request(
            token,
            'https://api.atlassian.com/oauth/token/accessible-resources',
          ),
          'jira',
          'accessible resources',
        )
        const resources = yield* decodeJson(
          AccessibleResources,
          'jira',
          'your Jira sites',
        )(response)

        const first = resources[0]
        if (!first) {
          return yield* Effect.fail(new Errors.BoardNotConnected())
        }

        yield* Effect.tryPromise(() =>
          env.KV.put(cacheKey, first.id, { expirationTtl: CLOUD_ID_TTL }),
        ).pipe(Effect.catchCause(() => Effect.void))

        return first.id
      })

    const site = (userId: string) =>
      Effect.gen(function* () {
        const token = yield* auth.jiraToken(userId)
        const id = yield* cloudId(userId, token)
        return {
          token,
          url: (path: string) =>
            `https://api.atlassian.com/ex/jira/${id}${path}`,
        }
      })

    return {
      search: (userId, jql) =>
        Effect.gen(function* () {
          const { token, url } = yield* site(userId)
          const issues: Array<JiraDomain.JiraIssue> = []
          let nextPageToken: string | undefined

          do {
            const params = new URLSearchParams({
              jql,
              fields: 'summary,status',
            })
            if (nextPageToken) params.set('nextPageToken', nextPageToken)

            const response = yield* send(
              request(token, url(`/rest/api/3/search/jql?${params}`)),
              'jira',
              'issue search',
            )
            const page = yield* decodeJson(
              IssuePage,
              'jira',
              'matching issues',
            )(response)

            for (const issue of page.issues) {
              issues.push({
                id: issue.id,
                key: issue.key,
                summary: issue.fields.summary,
                ...(issue.fields.status ? { status: issue.fields.status.name } : {}),
              })
            }

            /* Jira reports the last page either by flag or by omitting the
             * token; trusting only the token avoids looping forever when the
             * flag says otherwise. */
            nextPageToken = page.isLast === true ? undefined : page.nextPageToken
          } while (nextPageToken)

          return issues
        }),

      /* Everyone at Warp can see every Jira project, so the useful list is the
       * projects the user actually has open work in. */
      projects: (userId) =>
        Effect.gen(function* () {
          const { token, url } = yield* site(userId)
          const byId = new Map<string, JiraDomain.JiraProject>()
          let nextPageToken: string | undefined

          do {
            const params = new URLSearchParams({
              jql: 'assignee = currentUser() AND statusCategory != Done',
              fields: 'project',
              maxResults: '100',
            })
            if (nextPageToken) params.set('nextPageToken', nextPageToken)

            const response = yield* send(
              request(token, url(`/rest/api/3/search/jql?${params}`)),
              'jira',
              'project search',
            )
            const page = yield* decodeJson(
              ProjectPage,
              'jira',
              'your Jira projects',
            )(response)

            for (const issue of page.issues) {
              byId.set(issue.fields.project.id, issue.fields.project)
            }

            nextPageToken = page.nextPageToken
          } while (nextPageToken)

          return [...byId.values()]
        }),

      statuses: (userId, projectKey) =>
        Effect.gen(function* () {
          const { token, url } = yield* site(userId)
          const response = yield* send(
            request(
              token,
              url(
                `/rest/api/3/project/${encodeURIComponent(projectKey)}/statuses`,
              ),
            ),
            'jira',
            'status lookup',
          )
          const byType = yield* decodeJson(
            StatusesByType,
            'jira',
            'the board statuses',
          )(response)

          /* Statuses are returned per issue type and repeat across them, so
           * they are folded into their categories and deduplicated. */
          const categories = new Map<
            string,
            {
              key: string
              name: string
              colorName: string
              statuses: Array<JiraDomain.JiraStatus>
            }
          >()

          for (const issueType of byType) {
            for (const status of issueType.statuses) {
              const { statusCategory } = status
              let category = categories.get(statusCategory.name)
              if (!category) {
                category = {
                  key: statusCategory.key,
                  name: statusCategory.name,
                  colorName: statusCategory.colorName,
                  statuses: [],
                }
                categories.set(statusCategory.name, category)
              }
              if (!category.statuses.some((s) => s.id === status.id)) {
                category.statuses.push({ id: status.id, name: status.name })
              }
            }
          }

          return [...categories.values()]
        }),
    }
  }),
)
