import { Schema } from 'effect'

/** The working day a person is expected to fill. Warp bills on a quarter-hour
 * grid, and a day longer than the clock is a typo rather than a long shift —
 * hours beyond the standard day belong on an overtime entry, not in here. */
export const StandardHours = Schema.Number.check(
  Schema.isGreaterThan(0),
  Schema.isLessThanOrEqualTo(24),
  Schema.isMultipleOf(0.25),
)

export const UserSettings = Schema.Struct({
  standardHours: StandardHours,
})
export type UserSettings = typeof UserSettings.Type

export const UserSettingsPatch = Schema.Struct({
  standardHours: Schema.optional(StandardHours),
})
export type UserSettingsPatch = typeof UserSettingsPatch.Type
