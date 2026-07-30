import { Check } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Spinner } from '#/components/ui/spinner'
import { cn } from '#/lib/utils'
import type {
  WizardActionsProps,
  WizardBackProps,
  WizardNextProps,
  WizardRootProps,
  WizardStepProps,
  WizardStepsProps,
} from './wizard.types.ts'

const WizardRoot = (props: WizardRootProps) => (
  <div className="space-y-5">{props.children}</div>
)

/** A plain dot rail: on a phone there is no room for step titles, and the count
 * is what the user actually wants to know. */
const WizardSteps = (props: WizardStepsProps) => (
  <div className="flex items-center gap-2">
    {props.titles.map((title, index) => (
      <div key={title} className="flex flex-1 items-center gap-2">
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
            index < props.current && 'bg-primary text-primary-foreground',
            index === props.current && 'bg-primary text-primary-foreground',
            index > props.current && 'bg-muted text-muted-foreground',
          )}
        >
          {index < props.current ? <Check className="size-3.5" /> : index + 1}
        </span>
        {index < props.titles.length - 1 ? (
          <span
            className={cn(
              'h-0.5 flex-1 rounded-full',
              index < props.current ? 'bg-primary' : 'bg-muted',
            )}
          />
        ) : null}
      </div>
    ))}
  </div>
)

const WizardStep = (props: WizardStepProps) => (
  <div className="space-y-4">
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{props.title}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{props.description}</p>
    </div>
    {props.children}
  </div>
)

const WizardActions = (props: WizardActionsProps) => (
  <div className="flex gap-2 pt-2">{props.children}</div>
)

const WizardBack = (props: WizardBackProps) => (
  <Button variant="ghost" onClick={props.onClick} disabled={props.disabled}>
    Back
  </Button>
)

const WizardNext = (props: WizardNextProps) => (
  <Button
    onClick={props.onClick}
    disabled={props.disabled || props.busy}
    className="flex-1"
  >
    {props.busy ? <Spinner /> : null}
    {props.label}
  </Button>
)

export const Wizard = {
  Root: WizardRoot,
  Steps: WizardSteps,
  Step: WizardStep,
  Actions: WizardActions,
  Back: WizardBack,
  Next: WizardNext,
}
