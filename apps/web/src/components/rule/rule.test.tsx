import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Rule } from './rule'

describe('Rule.Row', () => {
  it('reads as a sentence about movement into a status', () => {
    render(
      <Rule.Row
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
})
