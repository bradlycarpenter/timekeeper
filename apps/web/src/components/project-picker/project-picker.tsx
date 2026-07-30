import { flexRender } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, Check, Search } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { cn } from '#/lib/utils'
import type {
  ProjectPickerListProps,
  ProjectPickerRootProps,
  ProjectPickerSearchProps,
  ProjectPickerTableProps,
} from './project-picker.types.ts'
import { useProjectPickerTable } from './use-project-picker-table.ts'

/* Fixed height rather than a max-height, so the box does not resize as
 * search narrows the results — the caller's layout below it stays put. */
const LIST_HEIGHT = 'h-72'

const ProjectPickerSearch = (props: ProjectPickerSearchProps) => (
  <div className="relative">
    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
    <Input
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
      placeholder={props.placeholder}
      className="pl-8"
    />
  </div>
)

/* Warp lists hundreds of projects, so search is the primary way in rather
 * than scrolling. This stays visible below `sm:` instead of behind a popover
 * because on a phone the list is the whole step; the table below `sm:` takes
 * over once there is room for columns worth sorting. */
const ProjectPickerList = (props: ProjectPickerListProps) => {
  const rows = props.table.getRowModel().rows

  return (
    <ul
      role="listbox"
      aria-label="Results"
      className={cn(
        LIST_HEIGHT,
        'space-y-1 overflow-y-auto rounded-lg border p-1 sm:hidden',
      )}
    >
      {rows.length === 0 ? (
        <li className="flex h-full items-center justify-center px-4 text-center">
          <span className="text-muted-foreground text-sm">
            {props.emptyText}
          </span>
        </li>
      ) : (
        rows.map((row) => {
          const option = row.original
          const selected = option.id === props.value
          return (
            <li key={option.id}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => props.onSelect(option.id)}
                className={cn(
                  'flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors',
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent hover:bg-muted',
                )}
              >
                <Check
                  className={cn(
                    'size-4 shrink-0',
                    selected ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {option.title}
                  </span>
                  {option.subtitle ? (
                    <span className="text-muted-foreground block truncate text-xs">
                      {option.subtitle}
                    </span>
                  ) : null}
                </span>
                {option.badge ? (
                  <Badge
                    variant="outline"
                    className="shrink-0 font-mono text-[0.6875rem]"
                  >
                    {option.badge}
                  </Badge>
                ) : null}
              </button>
            </li>
          )
        })
      )}
    </ul>
  )
}

const sortIcon = {
  asc: <ArrowUp className="size-3" />,
  desc: <ArrowDown className="size-3" />,
} as const

/* A few hundred rows renders without jank in a plain table, so this skips
 * virtualisation; revisit if a board or client list ever grows into the
 * thousands. */
const ProjectPickerTable = (props: ProjectPickerTableProps) => {
  const rows = props.table.getRowModel().rows
  const columnCount = props.table.getAllColumns().length + 1

  return (
    <div className={cn('hidden rounded-lg border sm:block')}>
      <div className={cn(LIST_HEIGHT, 'overflow-y-auto')}>
        <Table>
          <TableHeader className="bg-background sticky top-0 z-10">
            {props.table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className="flex items-center gap-1"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {sorted ? sortIcon[sorted] : null}
                        </button>
                      )}
                    </TableHead>
                  )
                })}
                <TableHead className="w-10" />
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="text-muted-foreground h-24 text-center"
                >
                  {props.emptyText}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const selected = row.original.id === props.value
                return (
                  <TableRow
                    key={row.id}
                    role="option"
                    aria-selected={selected}
                    tabIndex={0}
                    data-state={selected ? 'selected' : undefined}
                    className="cursor-pointer"
                    onClick={() => props.onSelect(row.original.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        props.onSelect(row.original.id)
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Check
                        className={cn(
                          'size-4',
                          selected ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

/** Composes the search input, mobile list, and desktop table over one shared
 * table instance. The wizard only has a single call site for this today (see
 * `project-picker.tsx` history), so this stays as the one component the route
 * calls; `Search`/`List`/`Table` are exported alongside it for a future route
 * that wants to compose them itself. */
const ProjectPickerRoot = (props: ProjectPickerRootProps) => {
  const { table, globalFilter, setGlobalFilter } = useProjectPickerTable(
    props.options,
  )

  return (
    <div className="space-y-1.5">
      <Label>{props.label}</Label>
      <ProjectPickerSearch
        value={globalFilter}
        onChange={setGlobalFilter}
        placeholder={props.placeholder}
      />
      <ProjectPickerList
        table={table}
        value={props.value}
        onSelect={props.onSelect}
        emptyText={props.emptyText}
      />
      <ProjectPickerTable
        table={table}
        value={props.value}
        onSelect={props.onSelect}
        emptyText={props.emptyText}
      />
    </div>
  )
}

export const ProjectPicker = {
  Root: ProjectPickerRoot,
  Search: ProjectPickerSearch,
  List: ProjectPickerList,
  Table: ProjectPickerTable,
}
