import { render, screen } from '@testing-library/react'
import { AsyncResult } from 'effect/unstable/reactivity'
import { describe, expect, it, vi } from 'vitest'
import { Rule } from './rule'

describe('Rule.Row', () => {
  it('reads as a sentence about movement into a status', () => {
    render(
      <Rule.Row
        boardKey=""
        statusId={'10001' as never}
        statusName="In Progress"
        condition="entered"
        messageId={0}
        onRemove={vi.fn()}
        removing={false}
      />,
    )

    expect(
      screen.getByText('When a ticket moved into In Progress'),
    ).toBeTruthy()
    expect(screen.getByText(/Today I began working on/)).toBeTruthy()
  })

  it('describes tickets that sat still', () => {
    render(
      <Rule.Row
        boardKey=""
        statusId={'10002' as never}
        statusName="In Review"
        condition="stationary"
        messageId={1}
        onRemove={vi.fn()}
        removing={false}
      />,
    )

    expect(screen.getByText('When a ticket sat in In Review')).toBeTruthy()
  })

  it('describes tickets that left a status', () => {
    render(
      <Rule.Row
        boardKey=""
        statusId={'10003' as never}
        statusName="Done"
        condition="left"
        messageId={3}
        onRemove={vi.fn()}
        removing={false}
      />,
    )

    expect(screen.getByText('When a ticket moved out of Done')).toBeTruthy()
    expect(screen.getByText(/Today I completed/)).toBeTruthy()
  })
})

describe('Rule.Preview', () => {
  it('stands in for the status before one is chosen', () => {
    render(
      <Rule.Preview statusName={undefined} condition="entered" messageId={0} />,
    )

    expect(
      screen.getByText('When a ticket moved into that status'),
    ).toBeTruthy()
  })

  it('shows nothing extra while idle, with no preview passed', () => {
    render(
      <Rule.Preview statusName="In Progress" condition="entered" messageId={0} />,
    )

    expect(screen.queryByText(/Checking today/)).toBeNull()
    expect(screen.queryByText(/Nothing matches today/)).toBeNull()
  })

  it('shows a spinner while loading', () => {
    render(
      <Rule.Preview
        statusName="In Progress"
        condition="entered"
        messageId={0}
        preview={AsyncResult.initial(true)}
      />,
    )

    expect(screen.getByText(/Checking today's tickets/)).toBeTruthy()
  })

  it('explains that zero matches is a quiet rule, not a broken one', () => {
    render(
      <Rule.Preview
        statusName="In Progress"
        condition="entered"
        messageId={0}
        preview={AsyncResult.success({ issues: [], message: '' })}
      />,
    )

    expect(screen.getByText(/Nothing matches today/)).toBeTruthy()
  })

  it('lists the matching tickets and the sentence they would write', () => {
    render(
      <Rule.Preview
        statusName="In Progress"
        condition="entered"
        messageId={0}
        preview={AsyncResult.success({
          issues: [{ id: '1', key: 'AB-1', summary: 'Fix login' }],
          message: 'Today I began working on AB-1 (Fix login).',
        })}
      />,
    )

    expect(screen.getByText('AB-1')).toBeTruthy()
    expect(screen.getByText('Fix login')).toBeTruthy()
    expect(
      screen.getByText('“Today I began working on AB-1 (Fix login).”'),
    ).toBeTruthy()
  })

  it('gives a clear message when Jira cannot be reached', () => {
    render(
      <Rule.Preview
        statusName="In Progress"
        condition="entered"
        messageId={0}
        preview={AsyncResult.fail({ _tag: 'BoardNotConnected' })}
      />,
    )

    expect(screen.getByText('Connect Jira in Settings first.')).toBeTruthy()
  })
})
