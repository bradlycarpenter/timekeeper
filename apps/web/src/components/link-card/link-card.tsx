import { CostCodes } from '@tk/domain'
import { ArrowRight, Clock, ListChecks, Tag } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardFooter } from '#/components/ui/card'
import type {
  LinkCardActionsProps,
  LinkCardHeadingProps,
  LinkCardRootProps,
  LinkCardRuleCountProps,
  LinkCardTermsProps,
} from './link-card.types.ts'

const LinkCardRoot = (props: LinkCardRootProps) => (
  <Card className="gap-3 py-4">{props.children}</Card>
)

/** Reads sheet on the left, board on the right, matching the direction work
 * flows: Jira is the source, the timesheet is the destination. */
const LinkCardHeading = (props: LinkCardHeadingProps) => (
  <CardContent className="px-4">
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{props.clientName}</p>
        <p className="text-muted-foreground truncate text-sm">
          {props.projectName}
        </p>
      </div>
      <ArrowRight className="text-muted-foreground size-4 shrink-0" />
      <div className="min-w-0 flex-1 text-right">
        <p className="truncate text-sm font-semibold">{props.boardKey}</p>
        <p className="text-muted-foreground truncate text-sm">
          {props.boardName}
        </p>
      </div>
    </div>
  </CardContent>
)

const LinkCardTerms = (props: LinkCardTermsProps) => (
  <CardContent className="flex flex-wrap gap-1.5 px-4">
    <Badge variant="secondary" className="gap-1 tabular-nums">
      <Clock className="size-3.5" />
      {props.hours}h a day
    </Badge>
    <Badge variant="outline" className="gap-1">
      <Tag className="size-3.5" />
      {CostCodes.costCodeName(props.costCodeId)}
    </Badge>
  </CardContent>
)

const LinkCardRuleCount = (props: LinkCardRuleCountProps) => (
  <CardContent className="px-4">
    {props.count === 0 ? (
      <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <ListChecks className="size-4" />
        No rules yet, so nothing will be written
      </p>
    ) : (
      <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <ListChecks className="size-4" />
        {props.count} {props.count === 1 ? 'rule' : 'rules'}
      </p>
    )}
  </CardContent>
)

const LinkCardActions = (props: LinkCardActionsProps) => (
  <CardFooter className="gap-2 px-4">{props.children}</CardFooter>
)

export const LinkCard = {
  Root: LinkCardRoot,
  Heading: LinkCardHeading,
  Terms: LinkCardTerms,
  RuleCount: LinkCardRuleCount,
  Actions: LinkCardActions,
}
