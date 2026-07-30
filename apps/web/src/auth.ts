import { createAuthClient } from 'better-auth/react'
import { Effect } from 'effect'
import { AsyncResult, Atom, AtomRegistry } from 'effect/unstable/reactivity'
import { registry } from '#/lib/registry.ts'

export const authClient = createAuthClient()

const SESSION_STALE_MS = 60_000

/** better-auth has no `session.cookieCache` configured server-side, so every
 * `getSession()` call is a real request. `beforeLoad` needs an answer on
 * every navigation, so this is kept alive for the app's lifetime instead of
 * torn down between routes like a normal query atom. */
const sessionAtom = Atom.keepAlive(
  Atom.make(
    Effect.tryPromise(() => authClient.getSession()).pipe(
      Effect.map((result) => result.data?.user ?? null),
      Effect.orElseSucceed(() => null),
    ),
  ),
)

/** Resolves the signed-in user for a route guard without blocking every
 * navigation on a network round trip.
 *
 * The first call after app load has nothing cached, so it genuinely awaits
 * the fetch. Every call after that reads the last known value straight from
 * the registry; once it is older than `SESSION_STALE_MS` a background
 * refresh is kicked off (not awaited) so a session that expired mid-visit is
 * caught on the *next* navigation rather than trusted forever. */
export const readSession = () => {
  const cached = registry.get(sessionAtom)

  if (AsyncResult.isInitial(cached)) {
    return Effect.runPromise(
      AtomRegistry.getResult(sessionAtom, { suspendOnWaiting: true })(registry),
    )
  }

  if (AsyncResult.isSuccess(cached) && Date.now() - cached.timestamp >= SESSION_STALE_MS) {
    registry.refresh(sessionAtom)
  }

  return Promise.resolve(AsyncResult.getOrElse(cached, () => null))
}
