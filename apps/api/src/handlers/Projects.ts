import { Api, Errors } from '@tk/domain'
import { Effect, Option } from 'effect'
import { HttpApiBuilder } from 'effect/unstable/httpapi'
import { Jira } from '../Jira.ts'
import { composeMessage, jqlForStub, partFor } from '../Message.ts'
import { Repo } from '../Repo.ts'
import { Warp } from '../Warp.ts'

export const SheetLive = HttpApiBuilder.group(Api.api, 'sheet', (handlers) =>
  handlers.handle('projects', () =>
    Effect.gen(function* () {
      const user = yield* Api.CurrentUser
      const repo = yield* Repo
      const warp = yield* Warp

      const token = yield* Effect.flatMap(repo.sheetToken(user.id), (stored) =>
        Option.match(stored, {
          onNone: () => Effect.fail(new Errors.SheetNotConnected()),
          onSome: Effect.succeed,
        }),
      )

      const projects = yield* warp.projects(token)
      return projects.filter((project) => project.isActive)
    }),
  ),
)

export const BoardLive = HttpApiBuilder.group(Api.api, 'board', (handlers) =>
  handlers
    .handle('projects', () =>
      Effect.gen(function* () {
        const user = yield* Api.CurrentUser
        const jira = yield* Jira
        return yield* jira.projects(user.id)
      }),
    )
    .handle('statuses', ({ params }) =>
      Effect.gen(function* () {
        const user = yield* Api.CurrentUser
        const jira = yield* Jira
        return yield* jira.statuses(user.id, params.projectKey)
      }),
    )
    .handle('preview', ({ params, payload }) =>
      Effect.gen(function* () {
        const user = yield* Api.CurrentUser
        const jira = yield* Jira
        const issues = yield* jira.search(
          user.id,
          jqlForStub(params.projectKey, payload),
        )
        return {
          issues,
          message: composeMessage([partFor(payload, issues)]),
        }
      }),
    ),
)
