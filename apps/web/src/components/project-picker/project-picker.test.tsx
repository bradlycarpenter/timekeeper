import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProjectPicker } from './project-picker'

const options = [
  { id: '1', title: 'Timekeeper', subtitle: 'Warp', badge: 'TK' },
  { id: '2', title: 'Herdr', subtitle: 'Warp', badge: 'HR' },
  { id: '3', title: 'Impeccable', subtitle: 'Studio', badge: 'IM' },
]

describe('ProjectPicker.Root', () => {
  it('shows every option in both the mobile list and the desktop table', () => {
    render(
      <ProjectPicker.Root
        label="Project"
        placeholder="Search"
        emptyText="No matches"
        value={undefined}
        onSelect={vi.fn()}
        options={options}
      />,
    )

    const list = within(screen.getByRole('listbox'))
    expect(list.getByText('Timekeeper')).toBeTruthy()

    const table = within(screen.getByRole('table'))
    expect(table.getByText('Timekeeper')).toBeTruthy()
    expect(table.getByText('Herdr')).toBeTruthy()
  })

  it('filters by title, subtitle, and badge as the user types', () => {
    render(
      <ProjectPicker.Root
        label="Project"
        placeholder="Search"
        emptyText="No matches"
        value={undefined}
        onSelect={vi.fn()}
        options={options}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Search'), {
      target: { value: 'studio' },
    })

    const list = within(screen.getByRole('listbox'))
    expect(list.getByText('Impeccable')).toBeTruthy()
    expect(list.queryByText('Timekeeper')).toBeNull()

    const table = within(screen.getByRole('table'))
    expect(table.getByText('Impeccable')).toBeTruthy()
    expect(table.queryByText('Timekeeper')).toBeNull()
  })

  it('shows the empty state once nothing matches, in both layouts', () => {
    render(
      <ProjectPicker.Root
        label="Project"
        placeholder="Search"
        emptyText="No project matches that search."
        value={undefined}
        onSelect={vi.fn()}
        options={options}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Search'), {
      target: { value: 'nothing matches this' },
    })

    expect(screen.getAllByText('No project matches that search.')).toHaveLength(2)
  })

  it('marks the current selection in both layouts', () => {
    render(
      <ProjectPicker.Root
        label="Project"
        placeholder="Search"
        emptyText="No matches"
        value="2"
        onSelect={vi.fn()}
        options={options}
      />,
    )

    const [listOption] = screen.getAllByRole('option', { name: /Herdr/ })
    expect(listOption.getAttribute('aria-selected')).toBe('true')
  })

  it('calls onSelect with the chosen id from the mobile list', () => {
    const onSelect = vi.fn()
    render(
      <ProjectPicker.Root
        label="Project"
        placeholder="Search"
        emptyText="No matches"
        value={undefined}
        onSelect={onSelect}
        options={options}
      />,
    )

    fireEvent.click(within(screen.getByRole('listbox')).getByText('Herdr'))

    expect(onSelect).toHaveBeenCalledWith('2')
  })
})
