import type { Atom } from 'effect/unstable/reactivity'
import {
  connectionsAtom,
  historyAtom,
  linksAtom,
  settingsAtom,
  todayAtom,
} from './atoms.ts'
import { registry } from './registry.ts'

/** `reactivityKeys` on a mutation only reaches a query atom whose node is still
 * alive with its reactivity listener registered. That registration is created
 * inside the atom's read and torn down with the node, so anything the user has
 * navigated away from — or that a router loader primed with `registry.get`
 * rather than a mounted subscriber — can keep serving its cached value. That is
 * why connecting Warp still needed a manual refresh after the API stopped being
 * cacheable: the request was never made at all.
 *
 * `registry.refresh` is the same primitive the reactivity layer calls when it
 * does fire, so this is not a second mechanism fighting the first — it is the
 * same one, invoked where we can be certain it happens. */
const affected: Record<string, ReadonlyArray<Atom.Atom<unknown>>> = {
  connections: [connectionsAtom, linksAtom, todayAtom],
  links: [linksAtom, todayAtom, historyAtom],
  today: [todayAtom, historyAtom],
  history: [historyAtom],
  settings: [settingsAtom, todayAtom],
}

export const invalidate = (keys: ReadonlyArray<string>) => {
  const seen = new Set<Atom.Atom<unknown>>()

  for (const key of keys) {
    for (const atom of affected[key] ?? []) {
      if (seen.has(atom)) continue
      seen.add(atom)
      registry.refresh(atom)
    }
  }
}
