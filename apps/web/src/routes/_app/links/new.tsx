import { useAtomSet, useAtomValue } from '@effect/atom-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BoardSheet, type Jira, type Stub } from '@tk/domain'
import { AsyncResult } from 'effect/unstable/reactivity'
import { useState } from 'react'
import { toast } from 'sonner'
import { ProjectPicker } from '#/components/project-picker/project-picker'
import { Rule } from '#/components/rule/rule'
import { ScreenState } from '#/components/screen-state/screen-state'
import { TermsFields } from '#/components/terms-fields/terms-fields'
import { Wizard } from '#/components/wizard/wizard'
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import { keys } from '#/lib/api'
import {
  addStubAtom,
  boardProjectsAtom,
  boardStatusesAtom,
  connectionsAtom,
  createLinkAtom,
  linksAtom,
  sheetProjectsAtom,
} from '#/lib/atoms'
import { describe } from '#/lib/errors'

export const Route = createFileRoute('/_app/links/new')({
  component: NewLinkScreen,
})

const steps = ['Timesheet', 'Board', 'Hours', 'First rule'] as const

function NewLinkScreen() {
  const navigate = useNavigate()
  const connections = useAtomValue(connectionsAtom)
  const sheetProjects = useAtomValue(sheetProjectsAtom)
  const boardProjects = useAtomValue(boardProjectsAtom)
  const links = useAtomValue(linksAtom)

  const createLink = useAtomSet(createLinkAtom, { mode: 'promiseExit' })
  const addStub = useAtomSet(addStubAtom, { mode: 'promiseExit' })

  const [step, setStep] = useState(0)
  const [sheetTaskId, setSheetTaskId] = useState<string>()
  const [boardId, setBoardId] = useState<string>()
  const [hours, setHours] = useState(BoardSheet.DEFAULT_HOURS)
  const [costCodeId, setCostCodeId] = useState(BoardSheet.DEFAULT_COST_CODE_ID)
  const [status, setStatus] = useState<Jira.JiraStatus>()
  const [condition, setCondition] = useState<Stub.StatusCondition>('entered')
  const [messageId, setMessageId] = useState<Stub.StubMessageId>(0)
  const [saving, setSaving] = useState(false)

  const sheet = AsyncResult.getOrElse(sheetProjects, () => [])
    .find((project) => String(project.taskId) === sheetTaskId)
  const board = AsyncResult.getOrElse(boardProjects, () => [])
    .find((project) => project.id === boardId)

  /* Hours already committed elsewhere, so the suggestion for this link is what
   * is left of the day rather than a blind eight hours. */
  const committed = AsyncResult.getOrElse(links, () => []).reduce(
    (total, link) => total + link.hours,
    0,
  )

  const statuses = useAtomValue(boardStatusesAtom(board?.key ?? ''))

  const finish = async () => {
    if (!sheet || !board) return
    setSaving(true)

    const created = await createLink({
      payload: {
        sheet: {
          taskId: sheet.taskId,
          name: sheet.name,
          clientName: sheet.clientName,
        },
        board,
        hours: hours as typeof BoardSheet.Hours.Type,
        costCodeId: costCodeId as BoardSheet.CostCodeId,
      },
      reactivityKeys: [...keys.links, ...keys.today],
    })

    if (created._tag === 'Failure') {
      setSaving(false)
      toast.error(describe(created.cause, 'That link could not be created.'))
      return
    }

    if (status) {
      const stubbed = await addStub({
        params: { id: created.value.id },
        payload: {
          statusId: status.id,
          statusName: status.name,
          condition,
          messageId,
        },
        reactivityKeys: [...keys.links, ...keys.today],
      })

      if (stubbed._tag === 'Failure') {
        setSaving(false)
        /* The link exists, so the user is sent to it rather than losing the work
         * they already did. */
        toast.error('The link was created but the rule was not saved.')
        void navigate({
          to: '/links/$linkId',
          params: { linkId: created.value.id },
        })
        return
      }
    }

    setSaving(false)
    toast.success('Link ready')
    void navigate({ to: '/today' })
  }

  const missing = AsyncResult.builder(connections)
    .onSuccess((state) =>
      state.sheet.status !== 'connected' || state.board.status !== 'connected'
        ? state
        : undefined,
    )
    .orElse(() => undefined)

  if (missing) {
    return (
      <Alert>
        <AlertTitle>Connect your accounts first</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            Timekeeper needs your Warp timesheet
            {missing.board.status !== 'connected' ? ' and Jira' : ''} before it
            can create a link.
          </p>
          <Button asChild size="sm">
            <a href="/settings">Go to Settings</a>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Wizard.Root>
      <Wizard.Steps titles={steps} current={step} />

      {step === 0 ? (
        <Wizard.Step
          title="Which timesheet project?"
          description="This is the project your day will be billed to on Warp."
        >
          {AsyncResult.builder(sheetProjects)
            .onInitialOrWaiting(() => <ScreenState.Loading cards={1} />)
            .onError(() => (
              <ScreenState.Failed
                title="Projects could not be loaded"
                detail="Warp did not return your projects. Check the connection in Settings."
              />
            ))
            .onSuccess((projects) => (
              <ProjectPicker.Root
                label="Timesheet project"
                placeholder="Search by client or project"
                emptyText="No project matches that search."
                value={sheetTaskId}
                onSelect={setSheetTaskId}
                options={projects.map((project) => ({
                  id: String(project.taskId),
                  title: project.name,
                  subtitle: project.clientName,
                }))}
              />
            ))
            .render()}
        </Wizard.Step>
      ) : null}

      {step === 1 ? (
        <Wizard.Step
          title="Which Jira board?"
          description="Timekeeper reads your tickets on this board to write the entry."
        >
          {AsyncResult.builder(boardProjects)
            .onInitialOrWaiting(() => <ScreenState.Loading cards={1} />)
            .onError(() => (
              <ScreenState.Failed
                title="Boards could not be loaded"
                detail="Jira did not return your projects."
              />
            ))
            .onSuccess((projects) => (
              <ProjectPicker.Root
                label="Jira project"
                placeholder="Search boards"
                emptyText="No board matches that search. Only boards you have open tickets on appear here."
                value={boardId}
                onSelect={setBoardId}
                options={projects.map((project) => ({
                  id: project.id,
                  title: project.name,
                  badge: project.key,
                }))}
              />
            ))
            .render()}
        </Wizard.Step>
      ) : null}

      {step === 2 ? (
        <Wizard.Step
          title="How much of your day?"
          description="Warp needs hours and a cost code for every entry."
        >
          <div className="space-y-4">
            <TermsFields.Hours
              value={hours}
              onChange={setHours}
              hint={
                committed > 0
                  ? `Your other links already account for ${committed}h a day.`
                  : undefined
              }
            />
            <TermsFields.CostCode value={costCodeId} onChange={setCostCodeId} />
          </div>
        </Wizard.Step>
      ) : null}

      {step === 3 ? (
        <Wizard.Step
          title="Add your first rule"
          description="Rules decide what gets written. You can add more later."
        >
          <div className="space-y-4">
            {AsyncResult.builder(statuses)
              .onInitialOrWaiting(() => <ScreenState.Loading cards={1} />)
              .onError(() => (
                <ScreenState.Failed
                  title="Statuses could not be loaded"
                  detail="Jira did not return the statuses for this board. You can add rules later."
                />
              ))
              .onSuccess((categories) => (
                <Rule.StatusField
                  categories={categories}
                  value={status?.id}
                  onChange={setStatus}
                />
              ))
              .render()}
            <Rule.ConditionField value={condition} onChange={setCondition} />
            <Rule.MessageField value={messageId} onChange={setMessageId} />
            <Rule.Preview
              statusName={status?.name}
              condition={condition}
              messageId={messageId}
            />
          </div>
        </Wizard.Step>
      ) : null}

      <Wizard.Actions>
        {step > 0 ? (
          <Wizard.Back onClick={() => setStep(step - 1)} disabled={saving} />
        ) : null}
        {step < steps.length - 1 ? (
          <Wizard.Next
            label="Continue"
            onClick={() => setStep(step + 1)}
            disabled={
              (step === 0 && !sheet) || (step === 1 && !board)
            }
          />
        ) : (
          <Wizard.Next
            label={status ? 'Create link' : 'Create without a rule'}
            busy={saving}
            onClick={() => {
              void finish()
            }}
          />
        )}
      </Wizard.Actions>
    </Wizard.Root>
  )
}
