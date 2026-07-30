import { Stub } from '@tk/domain'
import { AsyncResult } from 'effect/unstable/reactivity'
import { AlertTriangle, ListChecks, Trash2 } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Spinner } from '#/components/ui/spinner'
import { describe } from '#/lib/errors'
import type {
  RuleConditionFieldProps,
  RuleEmptyProps,
  RuleMessageFieldProps,
  RulePreviewProps,
  RuleRootProps,
  RuleRowProps,
  RuleStatusFieldProps,
} from './rule.types.ts'
import { useRulePreview } from './use-rule-preview.ts'

/** Rules read as a sentence so their three parts explain themselves without a
 * legend: when a ticket <condition> <status>, write "<message>". */
const sentence = (
  condition: Stub.StatusCondition,
  statusName: string,
  messageId: Stub.StubMessageId,
) => ({
  when: `When a ticket ${Stub.statusConditionLabels[condition].label} ${statusName}`,
  then: `“${Stub.stubMessageText(messageId)} …”`,
})

const RuleRoot = (props: RuleRootProps) => (
  <ul className="divide-y">{props.children}</ul>
)

const RuleRow = (props: RuleRowProps) => {
  const text = sentence(props.condition, props.statusName, props.messageId)
  const preview = useRulePreview(
    props.boardKey,
    { id: props.statusId, name: props.statusName },
    props.condition,
    props.messageId,
  )
  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{text.when}</p>
          <p className="text-muted-foreground mt-0.5 text-sm">{text.then}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={props.onRemove}
          disabled={props.removing}
          aria-label="Remove rule"
          className="text-muted-foreground hover:text-destructive shrink-0"
        >
          {props.removing ? <Spinner /> : <Trash2 className="size-4" />}
        </Button>
      </div>
      <PreviewTickets preview={preview} />
    </li>
  )
}

const RuleEmpty = (props: RuleEmptyProps) => (
  <div className="border-muted rounded-lg border border-dashed px-4 py-6 text-center">
    <ListChecks className="text-muted-foreground mx-auto size-5" />
    <p className="mt-2 text-sm font-medium">No rules yet</p>
    <p className="text-muted-foreground mx-auto mt-1 max-w-xs text-sm">
      Rules decide what Timekeeper writes. Without one, this link has nothing to
      say.
    </p>
    {props.children}
  </div>
)

const RuleStatusField = (props: RuleStatusFieldProps) => {
  const all = props.categories.flatMap((category) => category.statuses)
  return (
    <div className="space-y-1.5">
      <Label htmlFor="rule-status">Status</Label>
      <Select
        value={props.value}
        onValueChange={(value) => {
          const status = all.find((candidate) => candidate.id === value)
          if (status) props.onChange(status)
        }}
      >
        <SelectTrigger id="rule-status" className="w-full">
          <SelectValue placeholder="Pick a Jira status" />
        </SelectTrigger>
        <SelectContent>
          {props.categories.map((category) => (
            <SelectGroup key={category.name}>
              <SelectLabel>{category.name}</SelectLabel>
              {category.statuses.map((status) => (
                <SelectItem key={status.id} value={status.id}>
                  {status.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

const RuleConditionField = (props: RuleConditionFieldProps) => (
  <div className="space-y-1.5">
    <Label htmlFor="rule-condition">Movement</Label>
    <Select
      value={props.value}
      onValueChange={(value) => props.onChange(value as Stub.StatusCondition)}
    >
      <SelectTrigger id="rule-condition" className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(['entered', 'stationary', 'left'] as const).map((condition) => (
          <SelectItem key={condition} value={condition}>
            <span className="flex flex-col items-start">
              <span>{Stub.statusConditionLabels[condition].label}</span>
              <span className="text-muted-foreground text-xs">
                {Stub.statusConditionLabels[condition].hint}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

const RuleMessageField = (props: RuleMessageFieldProps) => (
  <div className="space-y-1.5">
    <Label htmlFor="rule-message">Wording</Label>
    <Select
      value={String(props.value)}
      onValueChange={(value) =>
        props.onChange(Number(value) as Stub.StubMessageId)
      }
    >
      <SelectTrigger id="rule-message" className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Stub.stubMessages.map((message) => (
          <SelectItem key={message.id} value={String(message.id)}>
            {message.text} …
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

/** The five states a live preview can be in: idle (no `preview` passed, so a
 * draft has no status yet), loading, zero matches, matches, and unreachable. */
const PreviewTickets = (props: {
  preview: RulePreviewProps['preview']
}) => {
  if (!props.preview) return null

  return AsyncResult.builder(props.preview)
    .onInitialOrWaiting(() => (
      <div className="mt-3 flex items-center gap-2 border-t pt-3">
        <Spinner className="size-3.5" />
        <p className="text-muted-foreground text-sm">
          Checking today's tickets…
        </p>
      </div>
    ))
    .onError((_error, result) => (
      <div className="mt-3 flex items-start gap-2 border-t pt-3">
        <AlertTriangle className="text-destructive mt-0.5 size-3.5 shrink-0" />
        <p className="text-muted-foreground text-sm">
          {describe(result.cause, 'Jira could not be reached for this board.')}
        </p>
      </div>
    ))
    .onSuccess((value) =>
      value.issues.length === 0 ? (
        <div className="mt-3 border-t pt-3">
          <p className="text-muted-foreground text-sm">
            Nothing matches today. The rule is fine, it is just quiet — this
            condition is checked against today only.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-2 border-t pt-3">
          <ul className="space-y-1">
            {value.issues.map((issue) => (
              <li key={issue.id} className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="shrink-0 font-mono text-[0.6875rem]">
                  {issue.key}
                </Badge>
                <span className="truncate">{issue.summary}</span>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground text-sm italic">
            “{value.message}”
          </p>
        </div>
      ),
    )
    .render()
}

const RulePreview = (props: RulePreviewProps) => {
  const text = sentence(
    props.condition,
    props.statusName ?? 'that status',
    props.messageId,
  )
  return (
    <div className="bg-muted/60 rounded-lg px-4 py-3">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        This rule says
      </p>
      <p className="mt-1 text-sm font-medium">{text.when}</p>
      <p className="text-muted-foreground mt-0.5 text-sm">{text.then}</p>
      <PreviewTickets preview={props.preview} />
    </div>
  )
}

export const Rule = {
  Root: RuleRoot,
  Row: RuleRow,
  Empty: RuleEmpty,
  StatusField: RuleStatusField,
  ConditionField: RuleConditionField,
  MessageField: RuleMessageField,
  Preview: RulePreview,
}
