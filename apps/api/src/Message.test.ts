import type { Jira, Stub } from '@tk/domain'
import { describe, expect, it } from 'vitest'
import {
  composeMessage,
  excludeIssues,
  jqlForStub,
  partFor,
} from './Message.ts'

const issue = (key: string, summary: string): Jira.JiraIssue =>
  ({ id: key, key, summary }) as Jira.JiraIssue

const stub = (
  condition: Stub.StatusCondition,
  messageId: Stub.StubMessageId,
): Stub.Stub =>
  ({
    id: 'stub-1',
    statusId: '10001',
    statusName: 'In Progress',
    condition,
    messageId,
  }) as Stub.Stub

describe('composeMessage', () => {
  it('reads as a sentence for one issue', () => {
    const message = composeMessage([
      { prefix: 'Today I completed', issues: [issue('AB-1', 'Fix login')] },
    ])

    expect(message).toBe('Today I completed AB-1 (Fix login).')
  })

  it('joins two issues with and', () => {
    const message = composeMessage([
      {
        prefix: 'Today I completed',
        issues: [issue('AB-1', 'One'), issue('AB-2', 'Two')],
      },
    ])

    expect(message).toBe('Today I completed AB-1 (One) and AB-2 (Two).')
  })

  it('comma separates all but the last of three or more', () => {
    const message = composeMessage([
      {
        prefix: 'Today I continue work on',
        issues: [issue('AB-1', 'One'), issue('AB-2', 'Two'), issue('AB-3', 'Three')],
      },
    ])

    expect(message).toBe(
      'Today I continue work on AB-1 (One), AB-2 (Two) and AB-3 (Three).',
    )
  })

  it('separates each rule into its own sentence', () => {
    const message = composeMessage([
      { prefix: 'Today I began working on', issues: [issue('AB-9', 'New')] },
      { prefix: 'Today I completed', issues: [issue('AB-1', 'Done')] },
    ])

    expect(message).toBe(
      'Today I began working on AB-9 (New). Today I completed AB-1 (Done).',
    )
  })

  it('drops rules that matched nothing', () => {
    const message = composeMessage([
      { prefix: 'Today I began working on', issues: [] },
      { prefix: 'Today I completed', issues: [issue('AB-1', 'Done')] },
    ])

    expect(message).toBe('Today I completed AB-1 (Done).')
  })

  it('is empty when no rule matched, which is what stops an empty post', () => {
    expect(composeMessage([])).toBe('')
    expect(
      composeMessage([{ prefix: 'Today I completed', issues: [] }]),
    ).toBe('')
  })
})

describe('jqlForStub', () => {
  it('asks for tickets that reached the status today', () => {
    const jql = jqlForStub('WEB', stub('entered', 0))

    expect(jql).toContain('project = "WEB"')
    expect(jql).toContain('assignee = currentUser()')
    expect(jql).toContain('status CHANGED TO "10001" AFTER startOfDay()')
    expect(jql).toContain('status = "10001"')
  })

  it('excludes today arrivals when asking what sat in a status', () => {
    const jql = jqlForStub('WEB', stub('stationary', 1))

    expect(jql).toContain('status WAS "10001" DURING (startOfDay(-1d), endOfDay(-1d))')
    expect(jql).toContain('NOT status CHANGED TO "10001" AFTER startOfDay()')
  })

  it('asks for tickets that left the status today', () => {
    const jql = jqlForStub('WEB', stub('left', 3))

    expect(jql).toContain('status CHANGED FROM "10001" AFTER startOfDay()')
    expect(jql).toContain('status != "10001"')
  })

  it('quotes the board key so keys with spaces cannot break the query', () => {
    expect(jqlForStub('MY BOARD', stub('entered', 0))).toContain(
      'project = "MY BOARD"',
    )
  })
})

describe('partFor', () => {
  it('labels the issues with the rule\'s sentence opener', () => {
    const part = partFor(stub('entered', 3), [issue('AB-1', 'Done')])

    expect(part.prefix).toBe('Today I completed')
    expect(part.issues).toHaveLength(1)
  })
})

const draft = (
  condition: Stub.StatusCondition,
  messageId: Stub.StubMessageId,
): Stub.StubDraft => ({
  statusId: '10001' as Stub.StubDraft['statusId'],
  statusName: 'In Progress',
  condition,
  messageId,
})

describe('previewing a draft rule', () => {
  it('builds the same JQL from a draft as from a saved stub, id or not', () => {
    expect(jqlForStub('WEB', draft('entered', 0))).toBe(
      jqlForStub('WEB', stub('entered', 0)),
    )
  })

  it('composes the sentence a draft would write, before it has a StubId', () => {
    const issues = [issue('AB-1', 'Fix login')]
    const part = partFor(draft('entered', 0), issues)

    expect(composeMessage([part])).toBe(
      'Today I began working on AB-1 (Fix login).',
    )
  })
})

describe('excludeIssues', () => {
  it('returns the parts untouched when nothing is excluded', () => {
    const parts = [
      { prefix: 'Today I completed', issues: [issue('AB-1', 'One')] },
    ]

    expect(excludeIssues(parts, [])).toBe(parts)
  })

  it('drops only the named ticket, keeping its siblings', () => {
    const parts = excludeIssues(
      [
        {
          prefix: 'Today I completed',
          issues: [issue('AB-1', 'One'), issue('AB-2', 'Two')],
        },
      ],
      ['AB-1'],
    )

    expect(composeMessage(parts)).toBe('Today I completed AB-2 (Two).')
  })

  /* An overtime ticket that was the only match for its rule must take the whole
   * sentence with it, not leave "Today I completed ." behind. */
  it('drops a sentence left empty by the exclusion', () => {
    const parts = excludeIssues(
      [
        { prefix: 'Today I began working on', issues: [issue('AB-1', 'One')] },
        { prefix: 'Today I completed', issues: [issue('AB-2', 'Two')] },
      ],
      ['AB-1'],
    )

    expect(parts).toHaveLength(1)
    expect(composeMessage(parts)).toBe('Today I completed AB-2 (Two).')
  })

  it('leaves nothing when every ticket goes to overtime', () => {
    const parts = excludeIssues(
      [
        {
          prefix: 'Today I completed',
          issues: [issue('AB-1', 'One'), issue('AB-2', 'Two')],
        },
      ],
      ['AB-1', 'AB-2'],
    )

    expect(parts).toHaveLength(0)
    expect(composeMessage(parts)).toBe('')
  })
})
