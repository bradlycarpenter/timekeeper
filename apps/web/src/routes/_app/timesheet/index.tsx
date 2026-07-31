import { useAtomValue } from '@effect/atom-react'
import { createFileRoute } from '@tanstack/react-router'
import { AsyncResult } from 'effect/unstable/reactivity'
import { CalendarRange } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EntryList } from '#/components/entry-list/entry-list'
import { PageHeader } from '#/components/page-header/page-header'
import { ScreenState } from '#/components/screen-state/screen-state'
import { timesheetEntriesAtom } from '#/lib/atoms'
import {
  addMonths,
  eachDayBetween,
  formatDayNumeric,
  formatMonth,
  formatWeekday,
  isWeekend,
  monthBounds,
} from '#/lib/dates'

export const Route = createFileRoute('/_app/timesheet/')({
  component: TimesheetScreen,
})

function TimesheetScreen() {
  const now = new Date()
  const [cursor, setCursor] = useState({
    year: now.getUTCFullYear(),
    month: now.getUTCMonth(),
  })

  const { from, to } = useMemo(
    () => monthBounds(cursor.year, cursor.month),
    [cursor],
  )

  const entries = useAtomValue(timesheetEntriesAtom(from, to))

  const isCurrentMonth =
    cursor.year === now.getUTCFullYear() && cursor.month === now.getUTCMonth()

  /* The window can run past today in the current month, and a day that has not
   * happened yet is not a day with nothing logged. */
  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <PageHeader.Root>
        <PageHeader.Title
          heading="Timesheet"
          description="Everything on your Warp timesheet, including entries you made in Warp yourself."
        />
      </PageHeader.Root>

      <EntryList.Month
        label={formatMonth(from)}
        onPrevious={() => setCursor(addMonths(cursor.year, cursor.month, -1))}
        onNext={() => setCursor(addMonths(cursor.year, cursor.month, 1))}
        nextDisabled={isCurrentMonth}
        totalHours={AsyncResult.getOrElse(entries, () => undefined)?.totalHours ?? 0}
        overtimeHours={
          AsyncResult.getOrElse(entries, () => undefined)?.overtimeHours ?? 0
        }
        days={
          new Set(
            AsyncResult.getOrElse(entries, () => undefined)?.entries.map(
              (entry) => entry.date,
            ) ?? [],
          ).size
        }
      />

      {AsyncResult.builder(entries)
        .onInitialOrWaiting(() => <ScreenState.Loading cards={3} />)
        .onError(() => (
          <ScreenState.Failed
            title="Your timesheet could not be read"
            detail="Warp did not return your entries. Check the connection in Settings."
          />
        ))
        .onSuccess((range) => {
          const byDay = new Map<string, typeof range.entries>()
          for (const entry of range.entries) {
            byDay.set(entry.date, [
              ...(byDay.get(entry.date) ?? []),
              entry,
            ])
          }

          const days = eachDayBetween(range.from, range.to)
            .filter((day) => day <= today)
            .filter((day) => !isWeekend(day) || byDay.has(day))
            .reverse()

          if (days.length === 0) {
            return (
              <ScreenState.Empty
                icon={<CalendarRange className="size-8" />}
                title="Nothing this month"
                detail="No timesheet entries were found for this month."
              />
            )
          }

          return (
            <>
              <EntryList.Root>
                {days.map((day) => (
                  <EntryList.Day
                    key={day}
                    label={formatDayNumeric(day)}
                    weekday={formatWeekday(day)}
                    entries={byDay.get(day) ?? []}
                    empty={!byDay.has(day)}
                  />
                ))}
              </EntryList.Root>
              {range.complete ? null : (
                <EntryList.Truncated coveredThrough={range.coveredThrough} />
              )}
            </>
          )
        })
        .render()}
    </>
  )
}
