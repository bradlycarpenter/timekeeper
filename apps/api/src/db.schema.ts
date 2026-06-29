import type { StubMessageID, StatusCondition } from '@tk/types'
import { relations, sql } from 'drizzle-orm'
import {
  index,
  integer,
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

export const boardSheet = sqliteTable('board_sheet', {
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
})

export const stub = sqliteTable('stub', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  boardSheetId: text('board_sheet_id')
    .notNull()
    .references(() => boardSheet.id, { onDelete: 'cascade' }),
  statusId: text('status_id').notNull(),
  statusCondition: integer('status_condition')
    .notNull()
    .$type<StatusCondition>(),
  messageId: integer('message_id').notNull().$type<StubMessageID>(),
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
