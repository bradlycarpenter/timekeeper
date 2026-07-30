import { Check } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '#/components/ui/command'
import { Badge } from '#/components/ui/badge'
import { Label } from '#/components/ui/label'
import { cn } from '#/lib/utils'
import type { ProjectPickerRootProps } from './project-picker.types.ts'

/** Warp lists hundreds of projects, so search is the primary way in rather than
 * scrolling. Kept always-open instead of behind a popover because on a phone the
 * list is the whole step. */
const ProjectPickerRoot = (props: ProjectPickerRootProps) => (
  <div className="space-y-1.5">
    <Label>{props.label}</Label>
    <Command className="rounded-lg border" shouldFilter>
      <CommandInput placeholder={props.placeholder} />
      <CommandList className="max-h-64">
        <CommandEmpty>{props.emptyText}</CommandEmpty>
        {props.options.map((option) => (
          <CommandItem
            key={option.id}
            value={`${option.title} ${option.subtitle ?? ''} ${option.badge ?? ''}`}
            onSelect={() => props.onSelect(option.id)}
            className="gap-2"
          >
            <Check
              className={cn(
                'size-4 shrink-0',
                props.value === option.id ? 'opacity-100' : 'opacity-0',
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
              <Badge variant="outline" className="shrink-0 font-mono text-[0.6875rem]">
                {option.badge}
              </Badge>
            ) : null}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  </div>
)

export const ProjectPicker = {
  Root: ProjectPickerRoot,
}
