import { Cause, Option } from 'effect'

/** Every message a declared API failure can produce. Anything not listed is a
 * fault rather than something the user can act on, so it gets the fallback. */
const messages: Record<string, string> = {
  SheetNotConnected: 'Connect your Warp timesheet in Settings first.',
  BoardNotConnected: 'Connect Jira in Settings first.',
  SheetAuthFailed: 'Warp did not accept that email and password.',
  AlreadyPosted: 'That day is already on your timesheet.',
  NoWorkToday: 'There is nothing to post yet today.',
  NotFound: 'That link no longer exists.',
  Unauthorized: 'Your session expired. Sign in again.',
}

const upstream: Record<string, string> = {
  warp: 'Warp is not responding. Try again shortly.',
  jira: 'Jira is not responding. Try again shortly.',
}

/** Reads the tagged failure out of a cause and returns wording for it. */
export const describe = (cause: Cause.Cause<unknown>, fallback: string) => {
  const error = Cause.findErrorOption(cause)

  if (Option.isNone(error)) return fallback

  const failure = error.value
  if (typeof failure !== 'object' || failure === null || !('_tag' in failure)) {
    return fallback
  }

  const tag = String(failure._tag)

  if (tag === 'UpstreamFailed' && 'service' in failure) {
    return upstream[String(failure.service)] ?? fallback
  }

  return messages[tag] ?? fallback
}
