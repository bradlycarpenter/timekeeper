import { describe, expect, it } from 'vitest'
import { demoEntry, samplePartFor, sampleEntryFor } from './today-entry.sample.ts'

describe('samplePartFor', () => {
  it('reuses the real sentence opener for the message id', () => {
    const part = samplePartFor('WEB', { messageId: 0 })
    expect(part.prefix).toBe('Today I began working on')
  })

  it('fabricates an issue key under the given board', () => {
    const part = samplePartFor('WEB', { messageId: 3 })
    for (const issue of part.issues) {
      expect(issue.key.startsWith('WEB-')).toBe(true)
    }
  })
})

describe('sampleEntryFor', () => {
  it('composes a message from the link\'s own rules', () => {
    const entry = sampleEntryFor({
      sheetClientName: 'Acme',
      sheetName: 'Support',
      boardKey: 'SUP',
      hours: 4,
      ruleMessageIds: [0],
    })

    expect(entry.sheetClientName).toBe('Acme')
    expect(entry.boardKey).toBe('SUP')
    expect(entry.message.startsWith('Today I began working on SUP-')).toBe(true)
  })

  it('produces one sentence per rule, matching composeMessage\'s shape', () => {
    const entry = sampleEntryFor({
      sheetClientName: 'Acme',
      sheetName: 'Support',
      boardKey: 'SUP',
      hours: 4,
      ruleMessageIds: [0, 3],
    })

    expect(entry.parts).toHaveLength(2)
    expect(entry.message).toContain('. ')
  })

  it('is empty when the link has no rules', () => {
    const entry = sampleEntryFor({
      sheetClientName: 'Acme',
      sheetName: 'Support',
      boardKey: 'SUP',
      hours: 4,
      ruleMessageIds: [],
    })

    expect(entry.message).toBe('')
  })
})

describe('demoEntry', () => {
  it('is a fully fabricated, non-empty preview', () => {
    expect(demoEntry.message.length).toBeGreaterThan(0)
    expect(demoEntry.boardKey).toBeTruthy()
    expect(demoEntry.parts.length).toBeGreaterThan(0)
  })
})
