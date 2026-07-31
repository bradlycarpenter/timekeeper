import { useAtomRefresh, useAtomSet, useAtomValue } from '@effect/atom-react'
import { Link, createFileRoute } from '@tanstack/react-router'
import type { BoardSheet } from '@tk/domain'
import { AsyncResult } from 'effect/unstable/reactivity'
import { CalendarCheck, Check, Pencil, Plus, SkipForward } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DaySummary } from '#/components/day-summary/day-summary'
import { HistoryList } from '#/components/history-list/history-list'
import { PageHeader } from '#/components/page-header/page-header'
import { ScreenState } from '#/components/screen-state/screen-state'
import { TodayEntry } from '#/components/today-entry/today-entry'
import { demoEntry, sampleEntryFor } from '#/components/today-entry/today-entry.sample.ts'
import { Button } from '#/components/ui/button'
import { keys } from '#/lib/api'
import { describe } from '#/lib/errors'
import {
  historyAtom,
  postEntryAtom,
  skipEntryAtom,
  todayAtom,
} from '#/lib/atoms'
import { formatDayLong, formatDayShort } from '#/lib/dates'
import { registry } from '#/lib/registry'

export const Route = createFileRoute('/_app/today/')({
  loader: () => {
    registry.get(todayAtom)
    registry.get(historyAtom)
  },
  component: TodayScreen,
})

const EXPECTED_HOURS = 8

function TodayScreen() {
  const today = useAtomValue(todayAtom)
  const history = useAtomValue(historyAtom)
  const refreshToday = useAtomRefresh(todayAtom)
  const post = useAtomSet(postEntryAtom, { mode: 'promiseExit' })
  const skip = useAtomSet(skipEntryAtom, { mode: 'promiseExit' })

  const [editing, setEditing] = useState<BoardSheet.BoardSheetId>()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState<BoardSheet.BoardSheetId>()

  const postEntry = async (
    id: BoardSheet.BoardSheetId,
    message?: string,
  ) => {
    setBusy(id)
    const exit = await post({
      params: { id },
      payload: message === undefined ? {} : { message },
      reactivityKeys: [...keys.today, ...keys.history],
    })
    setBusy(undefined)
    setEditing(undefined)

    if (exit._tag === 'Success') {
      toast.success('Filed on your timesheet')
      return
    }

    toast.error(describe(exit.cause, 'That entry could not be posted.'))
  }

  const skipEntry = async (id: BoardSheet.BoardSheetId) => {
    setBusy(id)
    const exit = await skip({
      params: { id },
      reactivityKeys: [...keys.today, ...keys.history],
    })
    setBusy(undefined)

    if (exit._tag === 'Success') {
      toast.success('Skipped for today')
      return
    }
    toast.error(describe(exit.cause, 'That entry could not be skipped.'))
  }

  return (
    <>
      {AsyncResult.builder(today)
        .onInitialOrWaiting(() => <ScreenState.Loading cards={2} />)
        .onError(() => (
          <ScreenState.Failed
            title="Today could not be loaded"
            detail="Something went wrong reading your day. Your scheduled post is unaffected."
            onRetry={refreshToday}
          />
        ))
        .onSuccess((day) => (
          <>
            <PageHeader.Root>
              <PageHeader.Title heading={formatDayLong(day.date)} />
            </PageHeader.Root>

            {day.entries.length > 0 ? (
              <DaySummary.Tally
                filed={
                  day.entries.filter((entry) => entry.status === 'posted').length
                }
                skipped={
                  day.entries.filter((entry) => entry.status === 'skipped').length
                }
                total={day.entries.length}
                hours={day.totalHours}
                expected={EXPECTED_HOURS}
                postsAt={day.postsAt}
              />
            ) : null}

            {day.entries.length === 0 ? (
              <div className="space-y-6">
                <ScreenState.Empty
                  icon={<CalendarCheck className="size-8" />}
                  title="Nothing to post yet"
                  detail="Link a Jira board to a timesheet project and Timekeeper will start writing your day."
                >
                  <Button asChild>
                    <Link to="/links/new">
                      <Plus className="size-4" />
                      Set up your first link
                    </Link>
                  </Button>
                </ScreenState.Empty>

                <TodayEntry.Root status="pending">
                  <TodayEntry.Heading
                    sample
                    clientName={demoEntry.sheetClientName}
                    projectName={demoEntry.sheetName}
                    boardKey={demoEntry.boardKey}
                    hours={demoEntry.hours}
                  />
                  <TodayEntry.Preview
                    label="Example only — this board and these tickets are made up."
                    message={demoEntry.message}
                  />
                </TodayEntry.Root>
              </div>
            ) : (
              /* 24px between records against 12px inside one, so an entry reads
               * as a single group without leaning on its ring to do it. */
              <div className="space-y-6">
                {day.entries.map((entry) => (
                  <TodayEntry.Root key={entry.boardSheetId} status={entry.status}>
                    <TodayEntry.Heading
                      clientName={entry.sheetClientName}
                      projectName={entry.sheetName}
                      boardKey={entry.boardKey}
                      hours={entry.hours}
                    />

                    {editing === entry.boardSheetId ? (
                      <TodayEntry.Editor
                        value={draft}
                        onChange={setDraft}
                        saving={busy === entry.boardSheetId}
                        onCancel={() => setEditing(undefined)}
                        onSave={() => {
                          void postEntry(entry.boardSheetId, draft)
                        }}
                      />
                    ) : (
                      <>
                        <TodayEntry.Message message={entry.message} />
                        <TodayEntry.Breakdown parts={entry.parts} />

                        {entry.hasRules &&
                        entry.message.length === 0 &&
                        !entry.error ? (
                          <TodayEntry.Preview
                            label="Example — nothing matched yet, so these ticket numbers are invented."
                            message={sampleEntryFor(entry).message}
                          />
                        ) : null}

                        {entry.error ? (
                          <TodayEntry.Problem
                            message={entry.error}
                            action={
                              !entry.hasRules ? (
                                <Button asChild variant="outline" className="h-11 md:h-8">
                                  <Link
                                    to="/links/$linkId"
                                    params={{ linkId: entry.boardSheetId }}
                                  >
                                    Add a rule
                                  </Link>
                                </Button>
                              ) : undefined
                            }
                          />
                        ) : null}

                        {entry.status === 'posted' ||
                        entry.status === 'skipped' ? (
                          <TodayEntry.Actions>
                            <TodayEntry.Status status={entry.status} />
                          </TodayEntry.Actions>
                        ) : (
                          <TodayEntry.Actions>
                            <TodayEntry.Action
                              label="Post now"
                              icon={<Check className="size-4" />}
                              busy={busy === entry.boardSheetId}
                              disabled={entry.message.length === 0}
                              onClick={() => {
                                void postEntry(entry.boardSheetId)
                              }}
                            />
                            <TodayEntry.Action
                              label="Edit"
                              variant="outline"
                              icon={<Pencil className="size-4" />}
                              disabled={busy === entry.boardSheetId}
                              onClick={() => {
                                setDraft(entry.message)
                                setEditing(entry.boardSheetId)
                              }}
                            />
                            <TodayEntry.Action
                              label="Skip"
                              variant="ghost"
                              icon={<SkipForward className="size-4" />}
                              disabled={busy === entry.boardSheetId}
                              onClick={() => {
                                void skipEntry(entry.boardSheetId)
                              }}
                            />
                          </TodayEntry.Actions>
                        )}
                      </>
                    )}
                  </TodayEntry.Root>
                ))}
              </div>
            )}
          </>
        ))
        .render()}

      {AsyncResult.builder(history)
        .onSuccess((entries) =>
          entries.length === 0 ? null : (
            <ScreenState.Section title="Recent">
              <HistoryList.Root>
                {entries.map((entry) => (
                  <HistoryList.Row
                    key={`${entry.boardSheetId}-${entry.entryDate}`}
                    date={formatDayShort(entry.entryDate)}
                    boardKey={entry.boardKey}
                    sheetName={entry.sheetName}
                    message={entry.message}
                    hours={entry.hours}
                    status={entry.status}
                  />
                ))}
              </HistoryList.Root>
            </ScreenState.Section>
          ),
        )
        .orNull()}
    </>
  )
}

