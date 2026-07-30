import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'
import type { ProjectOption } from './project-picker.types.ts'

const columnHelper = createColumnHelper<ProjectOption>()

const columns = [
  columnHelper.accessor('title', { header: 'Name' }),
  columnHelper.accessor('subtitle', { header: 'Client' }),
  columnHelper.accessor('badge', { header: 'Key' }),
]

/** One `@tanstack/react-table` instance backs both the mobile list and the
 * desktop table, so search, sort, and selection state cannot drift between
 * the two layouts shown at different breakpoints. */
export function useProjectPickerTable(options: ReadonlyArray<ProjectOption>) {
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data: options as Array<ProjectOption>,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const haystack =
        `${row.original.title} ${row.original.subtitle ?? ''} ${row.original.badge ?? ''}`.toLowerCase()
      return haystack.includes(String(filterValue).toLowerCase())
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return { table, globalFilter, setGlobalFilter }
}
