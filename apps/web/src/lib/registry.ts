import { scheduleTask } from '@effect/atom-react'
import { AtomRegistry } from 'effect/unstable/reactivity'

/** Shared with `RegistryContext.Provider` in `__root.tsx`, so router loaders
 * can prime atoms (`registry.get(atom)`) before the tree that reads them
 * mounts, using the exact same nodes the components then subscribe to. */
export const registry = AtomRegistry.make({ scheduleTask, defaultIdleTTL: 400 })
