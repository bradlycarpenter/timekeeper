import { Schema } from 'effect'
import { WarpPersonId } from './Warp.ts'

/** `stale` means a token is stored but Warp has stopped accepting it, which the
 * user fixes by signing in again rather than by connecting from scratch. */
export const SheetConnection = Schema.Union([
  Schema.Struct({
    status: Schema.Literal('connected'),
    personId: WarpPersonId,
    email: Schema.String,
  }),
  Schema.Struct({ status: Schema.Literal('disconnected') }),
  Schema.Struct({ status: Schema.Literal('stale') }),
])
export type SheetConnection = typeof SheetConnection.Type

export const BoardConnection = Schema.Union([
  Schema.Struct({
    status: Schema.Literal('connected'),
    accountId: Schema.String,
  }),
  Schema.Struct({ status: Schema.Literal('disconnected') }),
])
export type BoardConnection = typeof BoardConnection.Type

export const Connections = Schema.Struct({
  sheet: SheetConnection,
  board: BoardConnection,
})
export type Connections = typeof Connections.Type

export const SheetCredentials = Schema.Struct({
  email: Schema.String.check(Schema.isMinLength(3)),
  password: Schema.String.check(Schema.isMinLength(1)),
})
export type SheetCredentials = typeof SheetCredentials.Type

export const Viewer = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
  image: Schema.optional(Schema.String),
})
export type Viewer = typeof Viewer.Type
