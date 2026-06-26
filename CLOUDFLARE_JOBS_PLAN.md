# Cloudflare Scheduled Timesheet Jobs Plan

## Goal

Create timesheet entries at 5pm every day for every user, every configured board sheet, and every stub on that board sheet.

The production deployment target is Cloudflare serverless, using:

- Cloudflare Workers for the API/runtime.
- Cloudflare D1 for SQLite-compatible persistent data.
- Cloudflare Cron Triggers for scheduled dispatch.
- Cloudflare Queues for asynchronous job execution.

Local development can continue using `better-sqlite3` as long as the production data access path remains D1-compatible.

## Recommended Architecture

Use Cron only to discover and enqueue due work. Do not create all timesheet entries directly inside the cron handler.

```txt
Cron Trigger
  -> query D1 for users due at 5pm
  -> join board_sheet + stub
  -> create one idempotent job row per user/boardSheet/stub/date
  -> enqueue job id

Queue Consumer
  -> load job from D1
  -> create timesheet entry in external service
  -> mark job succeeded or failed
```

This keeps the scheduled handler short and lets Cloudflare Queues handle retries, batching, backpressure, and dead-letter handling.

## Scheduling Options

### Single Timezone

If all users should run at the same 5pm timezone, configure one UTC cron.

For example, if 5pm means `Africa/Johannesburg`, the UTC time is 15:00:

```jsonc
{
  "triggers": {
    "crons": ["0 15 * * *"]
  }
}
```

Cloudflare Cron Triggers run on UTC.

### Per-User Timezones

If users may have different local timezones, store a timezone on the user or a user settings table.

Run the cron every 5-15 minutes and select users whose local time is currently inside the 5pm dispatch window. The query should also exclude users whose jobs have already been created for that local date.

This is safer for multiple regions and daylight saving time.

## Job Idempotency

Cloudflare Queues provide at-least-once delivery. A message can be delivered more than once, so timesheet entry creation must be idempotent.

Use a stable unique key for each planned entry:

```txt
timesheet:{targetLocalDate}:{userId}:{boardSheetId}:{stubId}
```

Create a unique constraint on this key in D1. The cron handler should insert the job row first, then enqueue only newly inserted jobs. If the insert conflicts, skip enqueueing because the job already exists.

The queue consumer should also check job status before doing external work.

## Suggested D1 Table

```sql
create table timesheet_job (
  id text primary key,
  idempotency_key text not null unique,
  user_id text not null,
  board_sheet_id text not null,
  stub_id text not null,
  target_date text not null,
  status text not null default 'queued',
  attempts integer not null default 0,
  last_error text,
  created_at integer not null,
  updated_at integer not null
);
```

Useful indexes:

```sql
create index timesheet_job_status_idx on timesheet_job(status);
create index timesheet_job_user_date_idx on timesheet_job(user_id, target_date);
```

Possible statuses:

- `queued`
- `processing`
- `succeeded`
- `failed`
- `dead`

## Queue Message Shape

Keep the queue message small. Send the job ID, not the full job payload.

```ts
type TimesheetJobMessage = {
  jobId: string
}
```

The consumer should reload the current job state from D1 before processing.

## Worker Handlers

The Worker should expose both a scheduled handler and a queue handler.

```ts
export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(dispatchTimesheetJobs(env))
  },

  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      await processTimesheetJob(env, message.body.jobId)
      message.ack()
    }
  },
}
```

In real code, handle each message independently so one failed job does not unnecessarily retry the full batch. For failures, either throw to let the queue retry or call `message.retry()` with a delay.

## Wrangler Configuration Sketch

```jsonc
{
  "triggers": {
    "crons": ["0 15 * * *"]
  },
  "queues": {
    "producers": [
      {
        "queue": "timesheet-jobs",
        "binding": "TIMESHEET_QUEUE"
      }
    ],
    "consumers": [
      {
        "queue": "timesheet-jobs",
        "max_batch_size": 10,
        "max_batch_timeout": 5,
        "max_retries": 3
      }
    ]
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "timekeeper",
      "database_id": "<cloudflare-d1-database-id>"
    }
  ]
}
```

## Failure Handling

Recommended behavior:

- Mark the job `processing` before calling the external timesheet API.
- Increment `attempts` on each processing attempt.
- Mark `succeeded` only after the external API confirms the entry was created.
- Store `last_error` when processing fails.
- Use a dead-letter queue for jobs that exceed retry limits.
- Make the external API call idempotent too if it supports an idempotency key.

If the external service does not support idempotency keys, store enough response data to detect whether a job already created an entry before retrying.

## Current Repo Notes

The current schema already has the core configuration entities:

- `user`
- `board_sheet`
- `stub`

The scheduled dispatch query will likely join `board_sheet` to `stub`, grouped by `board_sheet.user_id`.

Before production deployment, the API package needs to be Worker-compatible. The current local setup uses Node-oriented pieces such as `better-sqlite3` and `process.env`; production should use Cloudflare bindings such as `env.DB`, queue bindings, and Worker-compatible environment variables/secrets.

## Cloudflare References

- Cron Triggers: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- Queues getting started: https://developers.cloudflare.com/queues/get-started/
- Queue delivery guarantees: https://developers.cloudflare.com/queues/reference/delivery-guarantees/
- Queue batching, retries, and delays: https://developers.cloudflare.com/queues/configuration/batching-retries/
