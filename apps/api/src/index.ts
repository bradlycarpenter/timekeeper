import type {
  BoardSheet as BoardSheetDomain,
  Today as TodayDomain,
} from '@tk/domain'
import { DateTime, Effect, Layer } from 'effect'
import { Auth } from './Auth.ts'
import {
  Bindings,
  type DailyPostJob,
  type Env,
  timeZone,
} from './Bindings.ts'
import { Repo } from './Repo.ts'
import { servicesLayer, webHandler } from './Runtime.ts'
import { Timesheet } from './Timesheet.ts'

const runWithServices = <A, E>(
  env: Env,
  effect: Effect.Effect<A, E, Bindings | Auth | Repo | Timesheet>,
) => Effect.runPromise(Effect.provide(effect, servicesLayer(env)) as Effect.Effect<A, E>)

/** The scheduled run only enqueues: it claims each link's slot for the day and
 * hands the work to the queue, so a slow Jira or Warp cannot hold up the cron. */
const enqueueToday = Effect.gen(function* () {
  const env = yield* Bindings
  const repo = yield* Repo
  const zone = yield* timeZone
  const now = yield* DateTime.now
  const entryDate = DateTime.formatIsoDate(
    DateTime.setZone(now, zone),
  ) as TodayDomain.EntryDate

  const candidates = yield* repo.linksToPost()

  const claimed = yield* Effect.forEach(
    candidates,
    ({ userId, link }) =>
      Effect.map(
        repo.claimDay(userId, link.id, entryDate, 'queued'),
        (won): DailyPostJob | undefined =>
          won ? { boardSheetId: link.id, entryDate } : undefined,
      ),
    { concurrency: 5 },
  )

  const jobs = claimed.filter((job) => job !== undefined)

  yield* Effect.logInfo('scheduled run', {
    entryDate,
    candidates: candidates.length,
    enqueued: jobs.length,
  })

  if (jobs.length === 0) return

  /* Queue sends cap at 100 messages per batch. */
  for (let index = 0; index < jobs.length; index += 100) {
    const batch = jobs.slice(index, index + 100)
    yield* Effect.tryPromise(() =>
      env.DAILY_POST_QUEUE.sendBatch(batch.map((body) => ({ body }))),
    ).pipe(
      Effect.catchCause((cause) =>
        Effect.logError('failed to enqueue daily posts', cause).pipe(
          Effect.andThen(
            /* Nothing is queued, so the claim is dropped and the next run — or
             * the user — can try again. */
            Effect.forEach(batch, (job) =>
              repo.releaseDay(
                job.boardSheetId as BoardSheetDomain.BoardSheetId,
                job.entryDate as TodayDomain.EntryDate,
              ),
            ),
          ),
        ),
      ),
    )
  }
})

const runJob = (job: DailyPostJob) =>
  Effect.gen(function* () {
    const repo = yield* Repo
    const timesheet = yield* Timesheet
    const entryDate = job.entryDate as TodayDomain.EntryDate

    const found = yield* repo.linkById(
      job.boardSheetId as BoardSheetDomain.BoardSheetId,
    )

    if (found._tag === 'None') {
      yield* Effect.logInfo('link vanished before posting', job)
      return
    }

    const { userId, link } = found.value

    /* The scheduled run already claimed the day, so posting has to go ahead
     * even though a row exists; `post` only refuses when it is already posted. */
    yield* timesheet.post(userId, link, entryDate).pipe(
      Effect.tap(() => Effect.logInfo('posted daily entry', job)),
      Effect.catchTags({
        AlreadyPosted: () => Effect.logInfo('already posted, skipping', job),
        NoWorkToday: () =>
          Effect.logInfo('nothing matched today, skipping', job).pipe(
            Effect.andThen(
              repo.setStatus(userId, link.id, entryDate, 'skipped'),
            ),
          ),
      }),
      Effect.catchCause((cause) =>
        Effect.logError('daily post failed', cause).pipe(
          Effect.andThen(
            repo.markFailed(
              link.id,
              entryDate,
              'Timekeeper could not post this entry.',
            ),
          ),
        ),
      ),
    )
  })

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    /* better-auth owns its own routes and speaks plain fetch, so it is mounted
     * ahead of the Effect API rather than wrapped by it. */
    if (url.pathname.startsWith('/api/auth/')) {
      return Effect.runPromise(
        Effect.provide(
          Effect.flatMap(Auth, (auth) => auth.handler(request)),
          servicesLayer(env),
        ),
      )
    }

    if (url.pathname === '/api/health') {
      return Promise.resolve(Response.json({ status: 'healthy' }))
    }

    return webHandler(env)(request)
  },

  scheduled(
    _controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    return runWithServices(env, enqueueToday).then(() => undefined)
  },

  queue(batch: MessageBatch<DailyPostJob>, env: Env): Promise<void> {
    return runWithServices(
      env,
      Effect.forEach(
        batch.messages,
        (message) =>
          runJob(message.body).pipe(
            /* Every outcome is recorded on the row, so retrying would only
             * repeat work that has already been accounted for. */
            Effect.ensuring(Effect.sync(() => message.ack())),
          ),
        { concurrency: 3, discard: true },
      ),
    ).then(() => undefined)
  },
}
