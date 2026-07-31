export type DaySummaryTallyProps = {
  filed: number
  skipped: number
  total: number
  hours: number
  expected: number
  /** Additional to `hours`, never part of it. */
  overtimeHours: number
  postsAt: string
}
