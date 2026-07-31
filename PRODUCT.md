# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Warp Development staff who bill their time against work tracked on Jira boards.

They are internal employees, not customers. Each one already has a Microsoft
account for sign-in, a Jira account with issues assigned to them, and a Warp
timesheet they are expected to keep current. The job is an obligation, not a
goal: at the end of a working day they owe an accurate timesheet entry, and
reconstructing what they did from memory is the part they get wrong or skip.

Timekeeper is not distributed publicly. Registering it as an Atlassian app
exists to make the Jira OAuth connection legitimate, not to reach an audience
beyond the company.

## Product Purpose

Timekeeper writes a person's daily Warp timesheet entry for them, derived from
what actually moved on their Jira board.

A user connects Jira and Warp once, then defines board links that map a Warp
task, client, cost code and default hours onto a Jira project plus a set of
status rules. At the end of each working day an automated run reads the board,
composes an entry describing the qualifying activity, and files it to Warp.

Success is that the entry is already filed, and correct, without the user
opening Timekeeper on an ordinary day. The app is what they visit to set up a
link, check what was filed, or fix a broken connection — not a place they are
expected to spend time.

## Positioning

Timekeeper derives the timesheet from the board state a user has already
maintained, rather than asking them to describe their day a second time. The
work of recording the day was done when they moved the ticket.

Because it targets Warp Development's own in-house timesheet system and its own
staff, it can rely on internal specifics — the real cost codes, clients and
tasks — that a general-purpose time tracker could not assume.

## Operating Context

- **Warp** is Warp Development's own internal timesheet system, not a
  third-party product. Timekeeper is a client of it.
- **Jira** is the source of truth for what was worked on. Timekeeper reads it
  and never writes to it.
- The working day is measured in `Africa/Johannesburg`; the scheduled run fires
  at 17:00 local (15:00 UTC) on weekdays, which is the end of the day the
  entries are billed to.
- The run must work for a user who is not signed in and not present, which is
  why Timekeeper holds a stored Warp credential per user rather than acting
  only during a live session.
- Users set up a link rarely and check history occasionally. Setup is a guided
  wizard; the daily path is passive.
- Public routes (`/privacy`, `/terms`, `/support`) exist to satisfy the
  Atlassian app registration and are read by reviewers as much as by staff.

## Capabilities and Constraints

Confirmed capabilities:

- Microsoft sign-in; Jira connected as a linked Atlassian account with
  read-only scopes; Warp connected by signing in once with email and password.
- Board links mapping a Warp task/client/cost code/hours to a Jira project and
  a set of status rules, each rule pairing a status and condition with a
  message template.
- A live preview of the entry a draft rule would produce, before saving.
- A daily entry history recording the date, outcome, hours and the exact text
  posted, with outcomes of queued, processing, posted, skipped or failed.
- Self-service disconnect for both Jira and Warp from Settings.

Technical constraints:

- Effect throughout, in both apps. `libraries/effect` is the reference for how
  to write it, including its tests.
- Cloudflare Worker serving both the API and the built SPA, with D1, KV, Queues
  and a cron trigger. Secrets come from Doppler in development and from Worker
  secrets in production.
- Frontend is a Vite React SPA: TanStack Router file routes, `@effect/atom-react`
  for state, shadcn components written as compound components, Tailwind v4.
- One corner radius for the entire app, enforced by an eslint rule. See
  `CLAUDE.md`.
- The scheduled run only enqueues work; posting happens on a queue consumer, so
  a slow Jira or Warp cannot stall the cron.

Known gaps, recorded so future work does not assume otherwise:

- The stored Warp credential is not encrypted at rest.
- No CI/CD; deploys are run by hand with wrangler.
- The client bundle is a single ~796 kB chunk, not code-split.
- Account and data deletion is a manual operator action, not self-service.
- The app is served from a `workers.dev` subdomain, with no custom domain.

## Brand Commitments

- The name is **Timekeeper**. The wordmark is set as "Time" plus "keeper", with
  "keeper" carrying the accent colour.
- The mark in use is lucide's timer glyph, not a bespoke logo.
- Real assets on hand: `apps/web/src/assets/jira-logo-light.svg` and
  `warp-logo-light-3.svg`. Jira is Atlassian's mark and is subject to their
  brand rules.
- The operating entity is Warp Development, based in South Africa. Contact is
  `bradly@warpdevelopment.co.za`.
- The established voice is plain and direct, and states real limitations rather
  than reassuring around them. The existing product copy does not hedge, does
  not use exclamation marks, and describes what the system does in the user's
  terms ("Your timesheet, written for you").

## Evidence on Hand

- Real, working product: the routes, the scheduled run, and a deployed Worker.
- Real internal data to design against — actual Warp tasks, clients, cost codes
  and Jira projects — reachable through the API rather than invented.
- A sample-entry preview already exists for the case where a user has no real
  history yet (`today-entry.sample.ts`).

Absences that must not be fabricated: there are no testimonials, customers,
case studies, press, adoption numbers, uptime figures, time-saved metrics, or
pricing. There is no marketing surface at all — `/` redirects to `/today` or
`/login` — and none is currently called for, since the audience is internal.

## Product Principles

1. **The entry files itself.** The default path involves no user. Anything that
   requires a daily visit to work has failed the premise.
2. **The user remains accountable.** Timekeeper drafts what goes on a timesheet
   a person is answerable for, so what it will file must be inspectable before
   it files, and what it did file must be legible afterward.
3. **Read from Jira, never write.** The board is someone else's record of
   truth. Timekeeper observes it.
4. **Survive the absent user.** Connections, scheduling and error handling are
   designed for 17:00 with nobody signed in, not for the happy path with a live
   session.
5. **State real limitations.** The audience is colleagues who will hit the
   gaps. Naming a gap is better than designing around it silently.

## Accessibility & Inclusion

No formal standard is committed to. The floor is sensible defaults: keyboard
reachability, readable contrast, and real semantics rather than styled `div`s.
Revisit if the audience ever extends beyond internal staff.
