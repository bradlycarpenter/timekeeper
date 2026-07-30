import type { Table } from '@tanstack/react-table'

export type ProjectOption = {
  id: string
  title: string
  subtitle?: string | undefined
  badge?: string | undefined
}

export type ProjectPickerRootProps = {
  label: string
  placeholder: string
  options: ReadonlyArray<ProjectOption>
  value: string | undefined
  onSelect: (id: string) => void
  emptyText: string
}

export type ProjectPickerSearchProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

export type ProjectPickerListProps = {
  table: Table<ProjectOption>
  value: string | undefined
  onSelect: (id: string) => void
  emptyText: string
}

export type ProjectPickerTableProps = ProjectPickerListProps
