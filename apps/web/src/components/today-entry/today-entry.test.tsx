import type { Jira } from '@tk/domain'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TodayEntry } from './today-entry'

const issue = (key: string, summary: string) =>
  ({ id: key, key, summary }) as Jira.JiraIssue

describe('TodayEntry.Message', () => {
  it('shows the text exactly as it will be posted', () => {
    render(
      <TodayEntry.Message message="Today I completed WEB-1 (Fix login)." />,
    )

    expect(screen.getByText('Today I completed WEB-1 (Fix login).')).toBeTruthy()
  })

  it('explains itself when no rule has matched yet', () => {
    render(<TodayEntry.Message message="" />)

    expect(
      screen.getByText('Nothing matched your rules yet today.'),
    ).toBeTruthy()
  })
})

describe('TodayEntry.Breakdown', () => {
  it('attributes each sentence to the tickets behind it', () => {
    render(
      <TodayEntry.Breakdown
        parts={[
          {
            prefix: 'Today I completed',
            issues: [issue('WEB-1', 'Fix login'), issue('WEB-2', 'Add search')],
          },
        ]}
      />,
    )

    expect(screen.getByText('Today I completed')).toBeTruthy()
    expect(screen.getByText('WEB-1')).toBeTruthy()
    expect(screen.getByText('Add search')).toBeTruthy()
  })

  it('renders nothing when there is no breakdown to show', () => {
    const { container } = render(<TodayEntry.Breakdown parts={[]} />)

    expect(container.firstChild).toBeNull()
  })
})

describe('TodayEntry.Status', () => {
  it('names each state in words the user recognises', () => {
    const { rerender } = render(<TodayEntry.Status status="posted" />)
    expect(screen.getByText('Posted')).toBeTruthy()

    rerender(<TodayEntry.Status status="pending" />)
    expect(screen.getByText('Scheduled')).toBeTruthy()

    rerender(<TodayEntry.Status status="failed" />)
    expect(screen.getByText('Failed')).toBeTruthy()
  })
})

describe('TodayEntry.Heading', () => {
  it('marks a sample entry so it never reads as real', () => {
    render(
      <TodayEntry.Heading
        sample
        clientName="Lumix"
        projectName="Development"
        boardKey="LUM"
        hours={8}
      />,
    )

    expect(screen.getByText('Example')).toBeTruthy()
  })

  it('shows no example badge for a real entry', () => {
    render(
      <TodayEntry.Heading
        clientName="Lumix"
        projectName="Development"
        boardKey="LUM"
        hours={8}
      />,
    )

    expect(screen.queryByText('Example')).toBeNull()
  })
})

describe('TodayEntry.Problem', () => {
  it('can carry an action pointing the user at a fix', () => {
    render(
      <TodayEntry.Problem
        message="No rules yet, so there is nothing to write."
        action={<button type="button">Add a rule</button>}
      />,
    )

    expect(
      screen.getByText('No rules yet, so there is nothing to write.'),
    ).toBeTruthy()
    expect(screen.getByText('Add a rule')).toBeTruthy()
  })
})

describe('TodayEntry.Preview', () => {
  it('labels the fabricated message as invented', () => {
    render(
      <TodayEntry.Preview
        label="Example — these ticket numbers are invented."
        message="Today I began working on LUM-214 (Add CSV export to invoices)."
      />,
    )
    expect(
      screen.getByText('Example — these ticket numbers are invented.'),
    ).toBeTruthy()
  })

  it('renders the sample message subordinate to a real one', () => {
    const { container } = render(
      <TodayEntry.Preview label="Example" message="Today I began working." />,
    )
    const message = screen.getByText('Today I began working.')
    expect(message.className).toContain('text-muted-foreground')
    expect(container.querySelector('.border-dashed')).toBeTruthy()
  })
})
