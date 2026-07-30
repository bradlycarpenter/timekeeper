import type { ReactNode } from 'react'

export type WizardRootProps = {
  children: ReactNode
}

export type WizardStepsProps = {
  titles: ReadonlyArray<string>
  current: number
}

export type WizardStepProps = {
  title: string
  description: string
  children: ReactNode
}

export type WizardActionsProps = {
  children: ReactNode
}

export type WizardBackProps = {
  onClick: () => void
  disabled?: boolean
}

export type WizardNextProps = {
  label: string
  onClick: () => void
  disabled?: boolean
  busy?: boolean
}
