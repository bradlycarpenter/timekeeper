import type { Stub } from '@tk/domain'
import { relations, sql } from 'drizzle-orm'
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
import { uuidv7 } from 'uuidv7'

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .default(false)
    .notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const sheetAuthToken = sqliteTable('sheet_auth_token', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: text('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  authToken: text('auth_token'),
})

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
)

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
)

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

export const boardSheet = sqliteTable(
  'board_sheet',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    sheetTaskId: integer('sheet_task_id').notNull(),
    sheetName: text('sheet_name').notNull(),
    sheetClientName: text('sheet_client_name').notNull(),
    boardId: text('board_id').notNull(),
    boardName: text('board_name').notNull(),
    boardKey: text('board_key').notNull(),
    hours: real('hours').notNull().default(8),
    costCodeId: integer('cost_code_id').notNull().default(2),
  },
  /** One board maps to one sheet, and every rule for that pair hangs off the
   * single link. A second row for the same pair is not a second configuration,
   * it is a second full day of hours posted to the same task. */
  (table) => [
    uniqueIndex('board_sheet_user_board_sheet_idx').on(
      table.userId,
      table.boardId,
      table.sheetTaskId,
    ),
  ],
)

export const userSettings = sqliteTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  /** The day the user is expected to fill. Drives the Today total and the point
   * past which extra hours read as overtime rather than a miscount. */
  standardHours: real('standard_hours').notNull().default(8),
})

/** A ticket the user pulled out of the normal day and billed as overtime. Warp
 * models overtime as a per-entry flag, so each of these becomes its own Warp
 * entry rather than inflating the link's normal one.
 *
 * This is both the intent and the record: marking a ticket writes a `pending`
 * row in the morning, and the scheduled run turns that same row into `posted`.
 * Keeping them in one place is what lets a mark survive until 17:00. */
export const overtimeEntry = sqliteTable(
  'overtime_entry',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    boardSheetId: text('board_sheet_id')
      .notNull()
      .references(() => boardSheet.id, { onDelete: 'cascade' }),
    entryDate: text('entry_date').notNull(),
    issueKey: text('issue_key').notNull(),
    /** Denormalised so a posted overtime entry still reads correctly after the
     * ticket is renamed or stops matching the link's rules. */
    issueSummary: text('issue_summary').notNull().default(''),
    hours: real('hours').notNull(),
    status: text('status', {
      enum: ['pending', 'queued', 'posted', 'failed'],
    })
      .notNull()
      .default('pending'),
    entryId: integer('entry_id'),
    message: text('message'),
    error: text('error'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('overtime_entry_link_date_issue_idx').on(
      table.boardSheetId,
      table.entryDate,
      table.issueKey,
    ),
    index('overtime_entry_user_date_idx').on(table.userId, table.entryDate),
  ],
)

export const stub = sqliteTable('stub', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  boardSheetId: text('board_sheet_id')
    .notNull()
    .references(() => boardSheet.id, { onDelete: 'cascade' }),
  statusId: text('status_id').notNull(),
  /** Denormalised so rules render without a Jira round trip. */
  statusName: text('status_name').notNull().default(''),
  /** Stored as the integer the first migration used; the domain maps it to a
   * named condition. */
  statusCondition: integer('status_condition').notNull(),
  messageId: integer('message_id').notNull().$type<Stub.StubMessageId>(),
})

export const dailyBoardSheetPost = sqliteTable(
  'daily_board_sheet_post',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    boardSheetId: text('board_sheet_id')
      .notNull()
      .references(() => boardSheet.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    entryDate: text('entry_date').notNull(),
    status: text('status', {
      enum: ['queued', 'processing', 'posted', 'skipped', 'failed'],
    }).notNull(),
    entryId: integer('entry_id'),
    /** What was actually sent to Warp, so history shows the posted text rather
     * than recomputing it from Jira's current state. */
    message: text('message'),
    hours: real('hours'),
    error: text('error'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('daily_board_sheet_post_board_sheet_id_idx').on(table.boardSheetId),
    index('daily_board_sheet_post_user_id_idx').on(table.userId),
    uniqueIndex('daily_board_sheet_post_board_sheet_date_idx').on(
      table.boardSheetId,
      table.entryDate,
    ),
  ],
)

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  boardSheets: many(boardSheet),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const boardSheetRelations = relations(boardSheet, ({ one, many }) => ({
  user: one(user, {
    fields: [boardSheet.userId],
    references: [user.id],
  }),
  stubs: many(stub),
}))

export const stubRelations = relations(stub, ({ one }) => ({
  boardSheet: one(boardSheet, {
    fields: [stub.boardSheetId],
    references: [boardSheet.id],
  }),
}))
