import { useAtomValue } from '@effect/atom-react'
import type { Jira, Stub } from '@tk/domain'
import { useMemo } from 'react'
import { boardPreviewAtom } from '#/lib/atoms'
import { useDebouncedValue } from './use-debounced-value.ts'

const DEBOUNCE_MS = 400

/** Reads the live preview for a rule being authored or already saved. The
 * draft is settled before it reaches the atom so rapid select-changes cannot
 * fire one request each. */
export function useRulePreview(
  boardKey: string,
  status: Pick<Jira.JiraStatus, 'id' | 'name'> | undefined,
  condition: Stub.StatusCondition,
  messageId: Stub.StubMessageId,
) {
  const draft = useMemo<Stub.StubDraft | undefined>(
    () =>
      status
        ? { statusId: status.id, statusName: status.name, condition, messageId }
        : undefined,
    [status?.id, status?.name, condition, messageId],
  )

  const settled = useDebouncedValue(draft, DEBOUNCE_MS)

  return useAtomValue(boardPreviewAtom(boardKey, settled))
}
