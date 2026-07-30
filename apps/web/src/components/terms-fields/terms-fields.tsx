import { CostCodes } from '@tk/domain'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import type {
  TermsFieldsCostCodeProps,
  TermsFieldsHoursProps,
} from './terms-fields.types.ts'

/** Whole and half days cover almost every real split, so they are one tap; the
 * select carries the rest without making the common case fiddly. */
const presets = [8, 6, 4, 2] as const

const TermsFieldsHours = (props: TermsFieldsHoursProps) => (
  <div className="space-y-1.5">
    <Label htmlFor="hours">Hours a day</Label>
    <div className="flex flex-wrap gap-1.5">
      {presets.map((preset) => (
        <Button
          key={preset}
          type="button"
          variant={props.value === preset ? 'default' : 'outline'}
          size="sm"
          onClick={() => props.onChange(preset)}
          className="tabular-nums"
        >
          {preset}h
        </Button>
      ))}
      <Select
        value={presets.some((preset) => preset === props.value) ? '' : String(props.value)}
        onValueChange={(value) => props.onChange(Number(value))}
      >
        <SelectTrigger
          id="hours"
          size="sm"
          className={cn(
            'w-28',
            !presets.some((preset) => preset === props.value) &&
              'border-primary',
          )}
        >
          <SelectValue placeholder="Other" />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 32 }, (_, index) => (index + 1) * 0.25).map(
            (hours) => (
              <SelectItem key={hours} value={String(hours)}>
                {hours}h
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>
    </div>
    {props.hint ? (
      <p className="text-muted-foreground text-xs">{props.hint}</p>
    ) : null}
  </div>
)

const TermsFieldsCostCode = (props: TermsFieldsCostCodeProps) => (
  <div className="space-y-1.5">
    <Label htmlFor="cost-code">Cost code</Label>
    <Select
      value={String(props.value)}
      onValueChange={(value) => props.onChange(Number(value))}
    >
      <SelectTrigger id="cost-code" className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CostCodes.costCodes.map((code) => (
          <SelectItem key={code.id} value={String(code.id)}>
            {code.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

export const TermsFields = {
  Hours: TermsFieldsHours,
  CostCode: TermsFieldsCostCode,
}
