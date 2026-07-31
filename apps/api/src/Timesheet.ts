import {
  BoardSheet as BoardSheetDomain,
  Errors,
  Today as TodayDomain,
} from '@tk/domain'
import { Context, DateTime, Effect, Layer, Option } from 'effect'
import { timeZone } from './Bindings.ts'
import { Jira } from './Jira.ts'
import {
  composeMessage,
  excludeIssues,
  jqlForStub,
  partFor,
} from './Message.ts'
import { Repo, type StoredOvertime, type StoredPost } from './Repo.ts'
import { Warp } from './Warp.ts'

/** When the scheduled run fires, in the working timezone. Shown so the user
 * knows how long they have to edit. */
const POSTS_AT = '17:00'

export class Timesheet extends Context.Service<
  Timesheet,
  {
    readonly today: (userId: string) => Effect.Effect<TodayDomain.Today>
    /** One link's card, recomputed after a change that only affects it. */
    readonly entryFor: (
      userId: string,
      link: BoardSheetDomain.BoardSheet,
      entryDate: TodayDomain.EntryDate,
    ) => Effect.Effect<TodayDomain.TodayEntry>
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

    const toOvertime = (
      stored: StoredOvertime,
    ): TodayDomain.OvertimeEntry => ({
      issueKey: stored.issueKey,
      issueSummary: stored.issueSummary,
      hours: stored.hours,
      status: stored.status,
      ...(stored.entryId !== undefined ? { entryId: stored.entryId } : {}),
      ...(stored.error !== undefined ? { error: stored.error } : {}),
    })

    const entryFrom = (
      link: BoardSheetDomain.BoardSheet,
      status: TodayDomain.PostStatus,
      message: string,
      parts: ReadonlyArray<TodayDomain.MessagePart>,
      overtime: ReadonlyArray<StoredOvertime>,
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
      overtime: overtime.map(toOvertime),
      ...(extra?.entryId !== undefined ? { entryId: extra.entryId } : {}),
      ...(extra?.error !== undefined ? { error: extra.error } : {}),
    })

    const withoutOvertime = (
      parts: ReadonlyArray<TodayDomain.MessagePart>,
      overtime: ReadonlyArray<StoredOvertime>,
    ) =>
      excludeIssues(
        parts,
        overtime.map((mark) => mark.issueKey),
      )

    /** The ticket's own sentence, reusing the opener from the rule that surfaced
     * it. Falls back when the message was overridden by hand or the ticket has
     * stopped matching, in which case there is no part to borrow from. */
    const overtimeMessage = (
      parts: ReadonlyArray<TodayDomain.MessagePart>,
      mark: StoredOvertime,
    ) => {
      const source = parts.find((part) =>
        part.issues.some((issue) => issue.key === mark.issueKey),
      )
      const described = `${mark.issueKey} (${mark.issueSummary})`
      return source === undefined
        ? `Overtime on ${described}.`
        : `${source.prefix} ${described}.`
    }

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
      overtime: ReadonlyArray<StoredOvertime>,
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
            overtime,
            stored.entryId !== undefined ? { entryId: stored.entryId } : {},
          )
        }

        if (link.stubs.length === 0) {
          return entryFrom(link, stored?.status ?? 'pending', '', [], overtime, {
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
          return entryFrom(link, stored?.status ?? 'pending', '', [], overtime, {
            error: 'Jira is not connected. Reconnect your Atlassian account to preview this board.',
            ...(stored?.entryId !== undefined ? { entryId: stored.entryId } : {}),
          })
        }

        if (outcome._tag === 'upstreamFailed') {
          return entryFrom(link, stored?.status ?? 'pending', '', [], overtime, {
            error: `Jira could not be reached for this board: ${outcome.detail}`,
            ...(stored?.entryId !== undefined ? { entryId: stored.entryId } : {}),
          })
        }

        /* The preview shows the normal entry, so overtime tickets are held back
         * exactly as they will be when the day is posted. */
        const normal = withoutOvertime(outcome.parts, overtime)

        return entryFrom(
          link,
          stored?.status ?? 'pending',
          composeMessage(normal),
          normal,
          overtime,
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
          const overtime = yield* repo.overtimeOn(userId, date)
          const standardHours = yield* repo.standardHours(userId)

          const entries = yield* Effect.forEach(
            links,
            (link) =>
              previewFor(
                userId,
                link,
                stored.find((post) => post.boardSheetId === link.id),
                overtime.filter((mark) => mark.boardSheetId === link.id),
              ),
            { concurrency: 3 },
          )

          return {
            date,
            postsAt: POSTS_AT,
            entries,
            /* Normal hours only: overtime is billed on top of the day rather
             * than counting towards filling it, so mixing them would make a
             * finished day read as overfull. */
            totalHours: entries
              .filter((entry) => entry.status !== 'skipped')
              .reduce((total, entry) => total + entry.hours, 0),
            overtimeHours: overtime.reduce(
              (total, mark) => total + mark.hours,
              0,
            ),
            standardHours,
          }
        }),

      entryFor: (userId, link, date) =>
        Effect.gen(function* () {
          const stored = yield* repo.postFor(userId, link.id, date)
          const overtime = yield* repo.overtimeFor(link.id, date)
          return yield* previewFor(
            userId,
            link,
            Option.getOrUndefined(stored),
            overtime,
          )
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

          const allParts =
            messageOverride === undefined ? yield* partsFor(userId, link) : []

          /* Anything already posted is left out: its Warp entry exists, and
           * posting it again would bill the ticket twice. */
          const pendingOvertime = (
            yield* repo.overtimeFor(link.id, date)
          ).filter((mark) => mark.status !== 'posted')

          const parts = withoutOvertime(allParts, pendingOvertime)
          const message = messageOverride ?? composeMessage(parts)
          const hasNormal = message.trim().length > 0

          if (!hasNormal && pendingOvertime.length === 0) {
            return yield* Effect.fail(new Errors.NoWorkToday())
          }

          /* Claim the day before calling Warp so a scheduled run starting in
           * parallel finds the slot taken. */
          yield* repo.setStatus(userId, link.id, date, 'queued')

          const person = yield* warp.me(token)

          const entryId = hasNormal
            ? yield* warp
                .createEntry(token, {
                  taskId: link.sheetTaskId,
                  personId: person.PersonId,
                  costCodeId: link.costCodeId,
                  hours: link.hours,
                  entryDate: date,
                  comments: message,
                  overtime: false,
                })
                .pipe(
                  Effect.tapError((error) =>
                    repo.markFailed(link.id, date, error.detail),
                  ),
                )
            : undefined

          if (entryId === undefined) {
            /* Every ticket went to overtime, so there is no normal entry to
             * file. The day is settled rather than left pending, otherwise the
             * next scheduled run would try it again. */
            yield* repo.setStatus(userId, link.id, date, 'skipped')
          } else {
            yield* repo.markPosted(link.id, date, {
              entryId,
              message,
              hours: link.hours,
            })
          }

          /* Sequential, not concurrent: each is a separate billed entry and a
           * partial failure must leave the rest recorded accurately. */
          yield* Effect.forEach(
            pendingOvertime,
            (mark) =>
              Effect.gen(function* () {
                const text = overtimeMessage(allParts, mark)
                const created = yield* warp
                  .createEntry(token, {
                    taskId: link.sheetTaskId,
                    personId: person.PersonId,
                    costCodeId: link.costCodeId,
                    hours: mark.hours,
                    entryDate: date,
                    comments: text,
                    overtime: true,
                  })
                  .pipe(
                    Effect.tapError((error) =>
                      repo.markOvertimeFailed(mark.id, error.detail),
                    ),
                    Effect.catchTag('UpstreamFailed', () =>
                      Effect.succeed(undefined),
                    ),
                  )

                if (created !== undefined) {
                  yield* repo.markOvertimePosted(mark.id, {
                    entryId: created,
                    message: text,
                  })
                }
              }),
            { discard: true },
          )

          const settled = yield* repo.overtimeFor(link.id, date)

          return entryFrom(
            link,
            entryId === undefined ? 'skipped' : 'posted',
            message,
            parts,
            settled,
            entryId !== undefined ? { entryId } : {},
          )
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
          const overtime = yield* repo.overtimeFor(link.id, date)
          return entryFrom(link, 'skipped', '', [], overtime)
        }),
    }
  }),
)

export { POSTS_AT }
