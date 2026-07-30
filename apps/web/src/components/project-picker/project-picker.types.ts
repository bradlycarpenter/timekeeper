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
