import {
  BoardSheet as BoardSheetDomain,
  Jira,
  Stub as StubDomain,
  Today as TodayDomain,
  Warp as WarpDomain,
} from '@tk/domain'
import { Context, Effect, Layer, Option, Schema } from 'effect'
import { SqlClient } from 'effect/unstable/sql'
import type { SqlError } from 'effect/unstable/sql/SqlError'

/** Rows as SQLite hands them back: snake_case, conditions as integers. */
const BoardSheetRow = Schema.Struct({
  id: BoardSheetDomain.BoardSheetId,
  sheet_task_id: WarpDomain.WarpTaskId,
  sheet_name: Schema.String,
  sheet_client_name: Schema.String,
  board_id: Jira.JiraProjectId,
  board_name: Schema.String,
  board_key: Schema.String,
  hours: Schema.Number,
  cost_code_id: BoardSheetDomain.CostCodeId,
})

const StubRow = Schema.Struct({
  id: StubDomain.StubId,
  board_sheet_id: BoardSheetDomain.BoardSheetId,
  status_id: Jira.JiraStatusId,
  status_name: Schema.String,
  status_condition: Schema.Number,
  message_id: StubDomain.StubMessageId,
})

const PostRow = Schema.Struct({
  board_sheet_id: BoardSheetDomain.BoardSheetId,
  entry_date: TodayDomain.EntryDate,
  status: Schema.String,
  entry_id: Schema.NullOr(Schema.Number),
  message: Schema.NullOr(Schema.String),
  hours: Schema.NullOr(Schema.Number),
  error: Schema.NullOr(Schema.String),
})

const IdRow = Schema.Struct({ id: Schema.String })
const TokenRow = Schema.Struct({ auth_token: Schema.NullOr(Schema.String) })
const AccountRow = Schema.Struct({ account_id: Schema.String })
const UserIdRow = Schema.Struct({ user_id: Schema.String })

export type StoredPost = {
  readonly boardSheetId: BoardSheetDomain.BoardSheetId
  readonly entryDate: TodayDomain.EntryDate
  readonly status: TodayDomain.PostStatus
  readonly entryId?: number
  readonly message?: string
  readonly hours?: number
  readonly error?: string
}

const toPostStatus = (raw: string): TodayDomain.PostStatus =>
  raw === 'posted' ||
  raw === 'skipped' ||
  raw === 'failed' ||
  raw === 'queued' ||
  raw === 'processing'
    ? raw === 'processing'
      ? 'queued'
      : raw
    : 'pending'

export class Repo extends Context.Service<Repo, RepoShape>()('tk/Repo') {}

type RepoShape = {
  readonly links: (
    userId: string,
  ) => Effect.Effect<ReadonlyArray<BoardSheetDomain.BoardSheet>>
  readonly link: (
    userId: string,
    id: BoardSheetDomain.BoardSheetId,
  ) => Effect.Effect<Option.Option<BoardSheetDomain.BoardSheet>>
  /** Every link that has at least one rule, for the scheduled run. */
  readonly linksToPost: () => Effect.Effect<
    ReadonlyArray<{
      readonly userId: string
      readonly link: BoardSheetDomain.BoardSheet
    }>
  >
  readonly linkById: (
    id: BoardSheetDomain.BoardSheetId,
  ) => Effect.Effect<
    Option.Option<{
      readonly userId: string
      readonly link: BoardSheetDomain.BoardSheet
    }>
  >
  readonly createLink: (
    userId: string,
    draft: BoardSheetDomain.BoardSheetDraft,
  ) => Effect.Effect<BoardSheetDomain.BoardSheetId>
  readonly updateLink: (
    userId: string,
    id: BoardSheetDomain.BoardSheetId,
    patch: BoardSheetDomain.BoardSheetPatch,
  ) => Effect.Effect<void>
  readonly deleteLink: (
    userId: string,
    id: BoardSheetDomain.BoardSheetId,
  ) => Effect.Effect<void>
  readonly addStub: (
    id: BoardSheetDomain.BoardSheetId,
    draft: StubDomain.StubDraft,
  ) => Effect.Effect<void>
  readonly deleteStub: (
    id: BoardSheetDomain.BoardSheetId,
    stubId: StubDomain.StubId,
  ) => Effect.Effect<void>
  readonly sheetToken: (
    userId: string,
  ) => Effect.Effect<Option.Option<string>>
  readonly saveSheetToken: (
    userId: string,
    token: string,
  ) => Effect.Effect<void>
  readonly deleteSheetToken: (userId: string) => Effect.Effect<void>
  readonly jiraAccountId: (
    userId: string,
  ) => Effect.Effect<Option.Option<string>>
  readonly postsOn: (
    userId: string,
    entryDate: TodayDomain.EntryDate,
  ) => Effect.Effect<ReadonlyArray<StoredPost>>
  readonly history: (
    userId: string,
    limit: number,
  ) => Effect.Effect<ReadonlyArray<TodayDomain.HistoryEntry>>
  /** Claims the day for a link. Returns false when a row already exists, which
   * is how double posting is prevented without transactions, since D1 has
   * none. */
  readonly claimDay: (
    userId: string,
    boardSheetId: BoardSheetDomain.BoardSheetId,
    entryDate: TodayDomain.EntryDate,
    status: 'queued' | 'skipped',
  ) => Effect.Effect<boolean>
  readonly postFor: (
    userId: string,
    boardSheetId: BoardSheetDomain.BoardSheetId,
    entryDate: TodayDomain.EntryDate,
  ) => Effect.Effect<Option.Option<StoredPost>>
  /** Used when the user drives the change themselves, where their intent should
   * win over whatever the scheduled run had recorded. */
  readonly setStatus: (
    userId: string,
    boardSheetId: BoardSheetDomain.BoardSheetId,
    entryDate: TodayDomain.EntryDate,
    status: 'queued' | 'skipped',
  ) => Effect.Effect<void>
  readonly markPosted: (
    boardSheetId: BoardSheetDomain.BoardSheetId,
    entryDate: TodayDomain.EntryDate,
    result: {
      readonly entryId: number
      readonly message: string
      readonly hours: number
    },
  ) => Effect.Effect<void>
  readonly markFailed: (
    boardSheetId: BoardSheetDomain.BoardSheetId,
    entryDate: TodayDomain.EntryDate,
    error: string,
  ) => Effect.Effect<void>
  readonly releaseDay: (
    boardSheetId: BoardSheetDomain.BoardSheetId,
    entryDate: TodayDomain.EntryDate,
  ) => Effect.Effect<void>
}

export const RepoLive = Layer.effect(
  Repo,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const decodeBoardSheets = Schema.decodeUnknownEffect(
      Schema.Array(BoardSheetRow),
    )
    const decodeStubs = Schema.decodeUnknownEffect(Schema.Array(StubRow))
    const decodePosts = Schema.decodeUnknownEffect(Schema.Array(PostRow))

    /** Failures here are defects: a schema mismatch means our own migration and
     * code disagree, which no caller can sensibly recover from. */
    const orDie = <A, E>(effect: Effect.Effect<A, E>) => Effect.orDie(effect)

    const assemble = (
      rows: ReadonlyArray<typeof BoardSheetRow.Type>,
      stubRows: ReadonlyArray<typeof StubRow.Type>,
    ) =>
      rows.map((row) => ({
        id: row.id,
        sheetTaskId: row.sheet_task_id,
        sheetName: row.sheet_name,
        sheetClientName: row.sheet_client_name,
        boardId: row.board_id,
        boardName: row.board_name,
        boardKey: row.board_key,
        hours: row.hours,
        costCodeId: row.cost_code_id,
        stubs: stubRows
          .filter((stub) => stub.board_sheet_id === row.id)
          .map((stub) => ({
            id: stub.id,
            statusId: stub.status_id,
            statusName: stub.status_name,
            condition:
              StubDomain.statusConditionByCode[stub.status_condition] ??
              'entered',
            messageId: stub.message_id,
          })),
      }))

    const loadLinks = (where: Effect.Effect<ReadonlyArray<unknown>, SqlError>) =>
      Effect.gen(function* () {
        const rows = yield* orDie(
          decodeBoardSheets(yield* orDie(where)),
        )
        if (rows.length === 0) return []
        const ids = rows.map((row) => row.id)
        const stubRows = yield* orDie(
          decodeStubs(
            yield* orDie(
              sql`SELECT id, board_sheet_id, status_id, status_name, status_condition, message_id
                  FROM stub WHERE board_sheet_id IN ${sql.in(ids)}`,
            ),
          ),
        )
        return assemble(rows, stubRows)
      })

    const selectLinks = (userId: string) =>
      sql`SELECT id, sheet_task_id, sheet_name, sheet_client_name, board_id, board_name, board_key, hours, cost_code_id
          FROM board_sheet WHERE user_id = ${userId} ORDER BY sheet_client_name, sheet_name`

    return {
      links: (userId) => loadLinks(selectLinks(userId)),

      link: (userId, id) =>
        Effect.map(
          loadLinks(
            sql`SELECT id, sheet_task_id, sheet_name, sheet_client_name, board_id, board_name, board_key, hours, cost_code_id
                FROM board_sheet WHERE user_id = ${userId} AND id = ${id}`,
          ),
          (links) => Option.fromNullishOr(links[0]),
        ),

      linkById: (id) =>
        Effect.gen(function* () {
          const owner = yield* orDie(
            Schema.decodeUnknownEffect(Schema.Array(UserIdRow))(
              yield* orDie(
                sql`SELECT user_id FROM board_sheet WHERE id = ${id}`,
              ),
            ),
          )
          const userId = owner[0]?.user_id
          if (!userId) return Option.none()

          const links = yield* loadLinks(
            sql`SELECT id, sheet_task_id, sheet_name, sheet_client_name, board_id, board_name, board_key, hours, cost_code_id
                FROM board_sheet WHERE id = ${id}`,
          )
          const link = links[0]
          return link ? Option.some({ userId, link }) : Option.none()
        }),

      linksToPost: () =>
        Effect.gen(function* () {
          const owners = yield* orDie(
            Schema.decodeUnknownEffect(
              Schema.Array(Schema.Struct({ id: Schema.String, user_id: Schema.String })),
            )(
              yield* orDie(
                sql`SELECT DISTINCT bs.id, bs.user_id
                    FROM board_sheet bs
                    JOIN stub s ON s.board_sheet_id = bs.id`,
              ),
            ),
          )
          if (owners.length === 0) return []

          const links = yield* loadLinks(
            sql`SELECT id, sheet_task_id, sheet_name, sheet_client_name, board_id, board_name, board_key, hours, cost_code_id
                FROM board_sheet WHERE id IN ${sql.in(owners.map((o) => o.id))}`,
          )

          return links.flatMap((link) => {
            const owner = owners.find((o) => o.id === link.id)
            return owner ? [{ userId: owner.user_id, link }] : []
          })
        }),

      createLink: (userId, draft) =>
        Effect.gen(function* () {
          const rows = yield* orDie(
            Schema.decodeUnknownEffect(Schema.Array(IdRow))(
              yield* orDie(
                sql`INSERT INTO board_sheet
                      (id, user_id, sheet_task_id, sheet_name, sheet_client_name, board_id, board_name, board_key, hours, cost_code_id)
                    VALUES
                      (${crypto.randomUUID()}, ${userId}, ${draft.sheet.taskId}, ${draft.sheet.name}, ${draft.sheet.clientName},
                       ${draft.board.id}, ${draft.board.name}, ${draft.board.key}, ${draft.hours}, ${draft.costCodeId})
                    RETURNING id`,
              ),
            ),
          )
          return rows[0]!.id as BoardSheetDomain.BoardSheetId
        }),

      updateLink: (userId, id, patch) =>
        Effect.gen(function* () {
          if (patch.hours !== undefined) {
            yield* orDie(
              sql`UPDATE board_sheet SET hours = ${patch.hours} WHERE id = ${id} AND user_id = ${userId}`,
            )
          }
          if (patch.costCodeId !== undefined) {
            yield* orDie(
              sql`UPDATE board_sheet SET cost_code_id = ${patch.costCodeId} WHERE id = ${id} AND user_id = ${userId}`,
            )
          }
        }),

      deleteLink: (userId, id) =>
        orDie(
          sql`DELETE FROM board_sheet WHERE id = ${id} AND user_id = ${userId}`,
        ),

      addStub: (id, draft) =>
        orDie(
          sql`INSERT INTO stub (id, board_sheet_id, status_id, status_name, status_condition, message_id)
              VALUES (${crypto.randomUUID()}, ${id}, ${draft.statusId}, ${draft.statusName},
                      ${StubDomain.statusConditionCodes[draft.condition]}, ${draft.messageId})`,
        ),

      deleteStub: (id, stubId) =>
        orDie(
          sql`DELETE FROM stub WHERE id = ${stubId} AND board_sheet_id = ${id}`,
        ),

      sheetToken: (userId) =>
        Effect.gen(function* () {
          const rows = yield* orDie(
            Schema.decodeUnknownEffect(Schema.Array(TokenRow))(
              yield* orDie(
                sql`SELECT auth_token FROM sheet_auth_token WHERE user_id = ${userId}`,
              ),
            ),
          )
          return Option.fromNullishOr(rows[0]?.auth_token ?? undefined)
        }),

      saveSheetToken: (userId, token) =>
        orDie(
          sql`INSERT INTO sheet_auth_token (id, user_id, auth_token)
              VALUES (${crypto.randomUUID()}, ${userId}, ${token})
              ON CONFLICT (user_id) DO UPDATE SET auth_token = ${token}`,
        ),

      deleteSheetToken: (userId) =>
        orDie(sql`DELETE FROM sheet_auth_token WHERE user_id = ${userId}`),

      jiraAccountId: (userId) =>
        Effect.gen(function* () {
          const rows = yield* orDie(
            Schema.decodeUnknownEffect(Schema.Array(AccountRow))(
              yield* orDie(
                sql`SELECT account_id FROM account
                    WHERE user_id = ${userId} AND provider_id = 'atlassian' LIMIT 1`,
              ),
            ),
          )
          return Option.fromNullishOr(rows[0]?.account_id)
        }),

      postsOn: (userId, entryDate) =>
        Effect.gen(function* () {
          const rows = yield* orDie(
            decodePosts(
              yield* orDie(
                sql`SELECT board_sheet_id, entry_date, status, entry_id, message, hours, error
                    FROM daily_board_sheet_post
                    WHERE user_id = ${userId} AND entry_date = ${entryDate}`,
              ),
            ),
          )
          return rows.map((row) => ({
            boardSheetId: row.board_sheet_id,
            entryDate: row.entry_date,
            status: toPostStatus(row.status),
            ...(row.entry_id !== null ? { entryId: row.entry_id } : {}),
            ...(row.message !== null ? { message: row.message } : {}),
            ...(row.hours !== null ? { hours: row.hours } : {}),
            ...(row.error !== null ? { error: row.error } : {}),
          }))
        }),

      history: (userId, limit) =>
        Effect.gen(function* () {
          const rows = yield* orDie(
            Schema.decodeUnknownEffect(
              Schema.Array(
                Schema.Struct({
                  board_sheet_id: BoardSheetDomain.BoardSheetId,
                  entry_date: TodayDomain.EntryDate,
                  sheet_name: Schema.String,
                  board_key: Schema.String,
                  status: Schema.String,
                  entry_id: Schema.NullOr(Schema.Number),
                  message: Schema.NullOr(Schema.String),
                  hours: Schema.NullOr(Schema.Number),
                  error: Schema.NullOr(Schema.String),
                }),
              ),
            )(
              yield* orDie(
                sql`SELECT p.board_sheet_id, p.entry_date, p.status, p.entry_id, p.message, p.hours, p.error,
                           bs.sheet_name, bs.board_key
                    FROM daily_board_sheet_post p
                    JOIN board_sheet bs ON bs.id = p.board_sheet_id
                    WHERE p.user_id = ${userId}
                    ORDER BY p.entry_date DESC, bs.sheet_name
                    LIMIT ${limit}`,
              ),
            ),
          )
          return rows.map((row) => ({
            boardSheetId: row.board_sheet_id,
            entryDate: row.entry_date,
            sheetName: row.sheet_name,
            boardKey: row.board_key,
            hours: row.hours ?? 0,
            status: toPostStatus(row.status),
            ...(row.message !== null ? { message: row.message } : {}),
            ...(row.entry_id !== null ? { entryId: row.entry_id } : {}),
            ...(row.error !== null ? { error: row.error } : {}),
          }))
        }),

      claimDay: (userId, boardSheetId, entryDate, status) =>
        Effect.gen(function* () {
          const rows = yield* orDie(
            Schema.decodeUnknownEffect(Schema.Array(IdRow))(
              yield* orDie(
                sql`INSERT INTO daily_board_sheet_post
                      (id, board_sheet_id, user_id, entry_date, status, updated_at)
                    VALUES (${crypto.randomUUID()}, ${boardSheetId}, ${userId}, ${entryDate}, ${status}, ${Date.now()})
                    ON CONFLICT (board_sheet_id, entry_date) DO NOTHING
                    RETURNING id`,
              ),
            ),
          )
          return rows.length > 0
        }),

      postFor: (userId, boardSheetId, entryDate) =>
        Effect.gen(function* () {
          const rows = yield* orDie(
            decodePosts(
              yield* orDie(
                sql`SELECT board_sheet_id, entry_date, status, entry_id, message, hours, error
                    FROM daily_board_sheet_post
                    WHERE user_id = ${userId} AND board_sheet_id = ${boardSheetId}
                      AND entry_date = ${entryDate}`,
              ),
            ),
          )
          const row = rows[0]
          return row
            ? Option.some<StoredPost>({
                boardSheetId: row.board_sheet_id,
                entryDate: row.entry_date,
                status: toPostStatus(row.status),
                ...(row.entry_id !== null ? { entryId: row.entry_id } : {}),
                ...(row.message !== null ? { message: row.message } : {}),
                ...(row.hours !== null ? { hours: row.hours } : {}),
                ...(row.error !== null ? { error: row.error } : {}),
              })
            : Option.none()
        }),

      setStatus: (userId, boardSheetId, entryDate, status) =>
        orDie(
          sql`INSERT INTO daily_board_sheet_post
                (id, board_sheet_id, user_id, entry_date, status, updated_at)
              VALUES (${crypto.randomUUID()}, ${boardSheetId}, ${userId}, ${entryDate}, ${status}, ${Date.now()})
              ON CONFLICT (board_sheet_id, entry_date)
                DO UPDATE SET status = ${status}, error = NULL, updated_at = ${Date.now()}`,
        ),

      markPosted: (boardSheetId, entryDate, result) =>
        orDie(
          sql`UPDATE daily_board_sheet_post
              SET status = 'posted', entry_id = ${result.entryId}, message = ${result.message},
                  hours = ${result.hours}, error = NULL, updated_at = ${Date.now()}
              WHERE board_sheet_id = ${boardSheetId} AND entry_date = ${entryDate}`,
        ),

      markFailed: (boardSheetId, entryDate, error) =>
        orDie(
          sql`UPDATE daily_board_sheet_post
              SET status = 'failed', error = ${error}, updated_at = ${Date.now()}
              WHERE board_sheet_id = ${boardSheetId} AND entry_date = ${entryDate}`,
        ),

      releaseDay: (boardSheetId, entryDate) =>
        orDie(
          sql`DELETE FROM daily_board_sheet_post
              WHERE board_sheet_id = ${boardSheetId} AND entry_date = ${entryDate}
                AND status IN ('queued', 'processing', 'failed')`,
        ),
    }
  }),
)
