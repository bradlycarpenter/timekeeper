import {
  BoardSheet as BoardSheetDomain,
  Errors,
  Today as TodayDomain,
} from '@tk/domain'
import { Context, DateTime, Effect, Layer, Option } from 'effect'
import { timeZone } from './Bindings.ts'
import { Jira } from './Jira.ts'
import { composeMessage, jqlForStub, partFor } from './Message.ts'
import { Repo, type StoredPost } from './Repo.ts'
import { Warp } from './Warp.ts'

/** When the scheduled run fires, in the working timezone. Shown so the user
 * knows how long they have to edit. */
const POSTS_AT = '17:00'

export class Timesheet extends Context.Service<
  Timesheet,
  {
    readonly today: (userId: string) => Effect.Effect<TodayDomain.Today>
    readonly post: (
      userId: string,
      link: BoardSheetDomain.BoardSheet,
      entryDate: TodayDomain.EntryDate,
      messageOverride?: string,
    ) => Effect.Effect<
      TodayDomain.TodayEntry,
      | Errors.AlreadyPosted
      | Errors.NoWorkToday
      | Errors.SheetNotConnected
      | Errors.BoardNotConnected
      | Errors.UpstreamFailed
    >
    readonly skip: (
      userId: string,
      link: BoardSheetDomain.BoardSheet,
      entryDate: TodayDomain.EntryDate,
    ) => Effect.Effect<TodayDomain.TodayEntry, Errors.AlreadyPosted>
    readonly entryDate: Effect.Effect<TodayDomain.EntryDate>
  }
>()('tk/Timesheet') {}

export const TimesheetLive = Layer.effect(
  Timesheet,
  Effect.gen(function* () {
    const repo = yield* Repo
    const jira = yield* Jira
    const warp = yield* Warp
    /* Resolved once here so the service's own methods carry no requirements and
     * stay callable from a handler, the queue or a test alike. */
    const zone = yield* timeZone

    const entryDate = Effect.map(
      DateTime.now,
      (now) =>
        DateTime.formatIsoDate(
          DateTime.setZone(now, zone),
        ) as TodayDomain.EntryDate,
    )

    /** Asks Jira what matched each rule today. */
    const partsFor = (userId: string, link: BoardSheetDomain.BoardSheet) =>
      Effect.forEach(
        link.stubs,
        (stub) =>
          Effect.map(
            jira.search(userId, jqlForStub(link.boardKey, stub)),
            (issues) => partFor(stub, issues),
          ),
        { concurrency: 4 },
      ).pipe(Effect.map((parts) => parts.filter((part) => part.issues.length > 0)))

    const entryFrom = (
      link: BoardSheetDomain.BoardSheet,
      status: TodayDomain.PostStatus,
      message: string,
      parts: ReadonlyArray<TodayDomain.MessagePart>,
      extra?: { entryId?: number; error?: string },
    ): TodayDomain.TodayEntry => ({
      boardSheetId: link.id,
      sheetName: link.sheetName,
      sheetClientName: link.sheetClientName,
      boardKey: link.boardKey,
      hours: link.hours,
      status,
      message,
      parts,
      hasRules: link.stubs.length > 0,
      ruleMessageIds: link.stubs.map((stub) => stub.messageId),
      ...(extra?.entryId !== undefined ? { entryId: extra.entryId } : {}),
      ...(extra?.error !== undefined ? { error: extra.error } : {}),
    })

    const sheetToken = (userId: string) =>
      Effect.flatMap(repo.sheetToken(userId), (token) =>
        Option.match(token, {
          onNone: () => Effect.fail(new Errors.SheetNotConnected()),
          onSome: Effect.succeed,
        }),
      )

    const previewFor = (
      userId: string,
      link: BoardSheetDomain.BoardSheet,
      stored: StoredPost | undefined,
    ) =>
      Effect.gen(function* () {
        /* Once posted or skipped the day is settled, so the stored text is
         * shown rather than asking Jira again and risking a different answer. */
        if (stored?.status === 'posted' || stored?.status === 'skipped') {
          return entryFrom(
            link,
            stored.status,
            stored.message ?? '',
            [],
            stored.entryId !== undefined ? { entryId: stored.entryId } : {},
          )
        }

        if (link.stubs.length === 0) {
          return entryFrom(link, stored?.status ?? 'pending', '', [], {
            error: 'No rules yet, so there is nothing to write.',
          })
        }

        /* A board that will not answer should not take the whole day's view
         * down with it, so the failure is reported against the one entry.
         * BoardNotConnected and UpstreamFailed are kept distinct here (rather
         * than both collapsing to "could not be reached") because they call
         * for different user action: reconnect vs. try again later. */
        const outcome = yield* partsFor(userId, link).pipe(
          Effect.map(
            (parts) => ({ _tag: 'ok' as const, parts }),
          ),
          Effect.catchTag('BoardNotConnected', () =>
            Effect.succeed({ _tag: 'boardNotConnected' as const }),
          ),
          Effect.catchTag('UpstreamFailed', (failure) =>
            Effect.succeed({
              _tag: 'upstreamFailed' as const,
              detail: failure.detail,
            }),
          ),
        )

        if (outcome._tag === 'boardNotConnected') {
          return entryFrom(link, stored?.status ?? 'pending', '', [], {
            error: 'Jira is not connected. Reconnect your Atlassian account to preview this board.',
            ...(stored?.entryId !== undefined ? { entryId: stored.entryId } : {}),
          })
        }

        if (outcome._tag === 'upstreamFailed') {
          return entryFrom(link, stored?.status ?? 'pending', '', [], {
            error: `Jira could not be reached for this board: ${outcome.detail}`,
            ...(stored?.entryId !== undefined ? { entryId: stored.entryId } : {}),
          })
        }

        return entryFrom(
          link,
          stored?.status ?? 'pending',
          composeMessage(outcome.parts),
          outcome.parts,
          stored?.error !== undefined ? { error: stored.error } : {},
        )
      })

    return {
      entryDate,

      today: (userId) =>
        Effect.gen(function* () {
          const date = yield* entryDate
          const links = yield* repo.links(userId)
          const stored = yield* repo.postsOn(userId, date)

          const entries = yield* Effect.forEach(
            links,
            (link) =>
              previewFor(
                userId,
                link,
                stored.find((post) => post.boardSheetId === link.id),
              ),
            { concurrency: 3 },
          )

          return {
            date,
            postsAt: POSTS_AT,
            entries,
            totalHours: entries
              .filter((entry) => entry.status !== 'skipped')
              .reduce((total, entry) => total + entry.hours, 0),
          }
        }),

      post: (userId, link, date, messageOverride) =>
        Effect.gen(function* () {
          const existing = yield* repo.postFor(userId, link.id, date)
          if (
            Option.isSome(existing) &&
            existing.value.status === 'posted'
          ) {
            return yield* Effect.fail(
              new Errors.AlreadyPosted(
                existing.value.entryId !== undefined
                  ? { entryId: existing.value.entryId }
                  : {},
              ),
            )
          }

          const token = yield* sheetToken(userId)

          const parts =
            messageOverride === undefined ? yield* partsFor(userId, link) : []
          const message = messageOverride ?? composeMessage(parts)

          if (message.trim().length === 0) {
            return yield* Effect.fail(new Errors.NoWorkToday())
          }

          /* Claim the day before calling Warp so a scheduled run starting in
           * parallel finds the slot taken. */
          yield* repo.setStatus(userId, link.id, date, 'queued')

          const person = yield* warp.me(token)

          const entryId = yield* warp
            .createEntry(token, {
              taskId: link.sheetTaskId,
              personId: person.PersonId,
              costCodeId: link.costCodeId,
              hours: link.hours,
              entryDate: date,
              comments: message,
            })
            .pipe(
              Effect.tapError((error) =>
                repo.markFailed(link.id, date, error.detail),
              ),
            )

          yield* repo.markPosted(link.id, date, {
            entryId,
            message,
            hours: link.hours,
          })

          return entryFrom(link, 'posted', message, parts, { entryId })
        }),

      skip: (userId, link, date) =>
        Effect.gen(function* () {
          const existing = yield* repo.postFor(userId, link.id, date)
          if (Option.isSome(existing) && existing.value.status === 'posted') {
            return yield* Effect.fail(
              new Errors.AlreadyPosted(
                existing.value.entryId !== undefined
                  ? { entryId: existing.value.entryId }
                  : {},
              ),
            )
          }

          yield* repo.setStatus(userId, link.id, date, 'skipped')
          return entryFrom(link, 'skipped', '', [])
        }),
    }
  }),
)

export { POSTS_AT }
