import type { BoardSheet, Jira } from '@tk/domain'
import { AsyncResult, Atom } from 'effect/unstable/reactivity'
import { ApiClient, keys } from './api.ts'

/** Query atoms are declared once and shared, so two screens showing the same
 * data read one request and refresh together.
 *
 * Without `timeToLive`, the registry tears an atom's value down ~400ms after
 * its last subscriber unmounts (the registry's `defaultIdleTTL`), so every
 * route change was refetching from zero. Each TTL below is picked from how
 * stale the data is allowed to get, not from what feels "safe" — anything
 * with `reactivityKeys` is invalidated explicitly on mutation regardless of
 * TTL, so a long TTL never risks showing stale data after a write, only
 * between navigations that don't touch it. */
export const todayAtom = ApiClient.query('today', 'get', {
  reactivityKeys: keys.today,
  serializationKey: 'today',
  timeToLive: '5 minutes',
})

export const historyAtom = ApiClient.query('today', 'history', {
  query: { limit: 30 },
  reactivityKeys: keys.history,
  serializationKey: 'history',
  timeToLive: '5 minutes',
})

export const linksAtom = ApiClient.query('links', 'list', {
  reactivityKeys: keys.links,
  serializationKey: 'links',
  timeToLive: '30 minutes',
})

export const connectionsAtom = ApiClient.query('connections', 'get', {
  reactivityKeys: keys.connections,
  serializationKey: 'connections',
  timeToLive: '30 minutes',
})

/** The signed-in user practically never changes mid-session, so this is kept
 * alive for the life of the tab rather than on a TTL. */
export const viewerAtom = ApiClient.query('viewer', 'me', {
  serializationKey: 'viewer',
  timeToLive: 'Infinity',
})

/** Only fetched once the wizard reaches the step that needs it. */
export const sheetProjectsAtom = ApiClient.query('sheet', 'projects', {
  reactivityKeys: keys.connections,
  serializationKey: 'sheet-projects',
  timeToLive: '10 minutes',
})

export const boardProjectsAtom = ApiClient.query('board', 'projects', {
  reactivityKeys: keys.connections,
  serializationKey: 'board-projects',
  timeToLive: '10 minutes',
})

type StatusesResult = AsyncResult.AsyncResult<
  ReadonlyArray<Jira.JiraStatusCategory>,
  unknown
>

/** Statuses belong to a board, so before one is chosen there is nothing to ask
 * for and the atom stays idle rather than firing a request that cannot succeed. */
const noStatuses: Atom.Atom<StatusesResult> = Atom.make(
  AsyncResult.initial<ReadonlyArray<Jira.JiraStatusCategory>, never>(true),
)

export const boardStatusesAtom = (
  projectKey: string,
): Atom.Atom<StatusesResult> =>
  projectKey === ''
    ? noStatuses
    : (ApiClient.query('board', 'statuses', {
        params: { projectKey },
        serializationKey: `board-statuses:${projectKey}`,
        timeToLive: '10 minutes',
      }) as Atom.Atom<StatusesResult>)

export const linkAtom = (id: BoardSheet.BoardSheetId) =>
  ApiClient.query('links', 'get', {
    params: { id },
    reactivityKeys: keys.links,
    serializationKey: `link:${id}`,
    timeToLive: '30 minutes',
  })

export const connectSheetAtom = ApiClient.mutation('connections', 'connectSheet')
export const disconnectSheetAtom = ApiClient.mutation(
  'connections',
  'disconnectSheet',
)
export const createLinkAtom = ApiClient.mutation('links', 'create')
export const updateLinkAtom = ApiClient.mutation('links', 'update')
export const removeLinkAtom = ApiClient.mutation('links', 'remove')
export const addStubAtom = ApiClient.mutation('links', 'addStub')
export const removeStubAtom = ApiClient.mutation('links', 'removeStub')
export const postEntryAtom = ApiClient.mutation('today', 'post')
export const skipEntryAtom = ApiClient.mutation('today', 'skip')
