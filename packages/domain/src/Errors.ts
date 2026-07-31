import { Schema } from 'effect'
import { BoardSheetId } from './BoardSheet.ts'

/** Warp rejected the email and password, as opposed to Warp being unreachable. */
export class SheetAuthFailed extends Schema.ErrorClass<SheetAuthFailed>(
  'SheetAuthFailed',
)(
  {
    _tag: Schema.tag('SheetAuthFailed'),
  },
  { httpApiStatus: 422 },
) {}

/** The user has no usable Warp token, so they must connect before continuing. */
export class SheetNotConnected extends Schema.ErrorClass<SheetNotConnected>(
  'SheetNotConnected',
)(
  {
    _tag: Schema.tag('SheetNotConnected'),
  },
  { httpApiStatus: 409 },
) {}

export class BoardNotConnected extends Schema.ErrorClass<BoardNotConnected>(
  'BoardNotConnected',
)(
  {
    _tag: Schema.tag('BoardNotConnected'),
  },
  { httpApiStatus: 409 },
) {}

/** Warp or Jira answered, but not in a way we can act on. Carries a service name
 * so the UI can say which integration is misbehaving. */
export class UpstreamFailed extends Schema.ErrorClass<UpstreamFailed>(
  'UpstreamFailed',
)(
  {
    _tag: Schema.tag('UpstreamFailed'),
    service: Schema.Literals(['warp', 'jira']),
    detail: Schema.String,
  },
  { httpApiStatus: 502 },
) {}

export class AlreadyPosted extends Schema.ErrorClass<AlreadyPosted>(
  'AlreadyPosted',
)(
  {
    _tag: Schema.tag('AlreadyPosted'),
    entryId: Schema.optional(Schema.Number),
  },
  { httpApiStatus: 409 },
) {}

/** This board is already linked to this timesheet project. A second link would
 * post its own full entry for the same day against the same task, so the hours
 * would double rather than the rules combining. Carries the existing link so the
 * caller can send the user to its rules instead. */
export class LinkAlreadyExists extends Schema.ErrorClass<LinkAlreadyExists>(
  'LinkAlreadyExists',
)(
  {
    _tag: Schema.tag('LinkAlreadyExists'),
    linkId: BoardSheetId,
  },
  { httpApiStatus: 409 },
) {}

export class NoWorkToday extends Schema.ErrorClass<NoWorkToday>('NoWorkToday')(
  {
    _tag: Schema.tag('NoWorkToday'),
  },
  { httpApiStatus: 409 },
) {}
