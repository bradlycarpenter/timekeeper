import { useAtomSet, useAtomValue } from '@effect/atom-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { BoardSheet, Jira, Stub } from '@tk/domain'
import { AsyncResult } from 'effect/unstable/reactivity'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Rule } from '#/components/rule/rule'
import { useRulePreview } from '#/components/rule/use-rule-preview'
import { ScreenState } from '#/components/screen-state/screen-state'
import { TermsFields } from '#/components/terms-fields/terms-fields'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Spinner } from '#/components/ui/spinner'
import { keys } from '#/lib/api'
import {
  addStubAtom,
  boardStatusesAtom,
  linkAtom,
  removeLinkAtom,
  removeStubAtom,
  updateLinkAtom,
} from '#/lib/atoms'
import { describe } from '#/lib/errors'

export const Route = createFileRoute('/_app/links/$linkId')({
  component: LinkScreen,
})

function LinkScreen() {
  const { linkId } = Route.useParams()
  const navigate = useNavigate()
  const id = linkId as BoardSheet.BoardSheetId
  const link = useAtomValue(linkAtom(id))

  const update = useAtomSet(updateLinkAtom, { mode: 'promiseExit' })
  const remove = useAtomSet(removeLinkAtom, { mode: 'promiseExit' })
  const addStub = useAtomSet(addStubAtom, { mode: 'promiseExit' })
  const removeStub = useAtomSet(removeStubAtom, { mode: 'promiseExit' })

  const [status, setStatus] = useState<Jira.JiraStatus>()
  const [condition, setCondition] = useState<Stub.StatusCondition>('entered')
  const [messageId, setMessageId] = useState<Stub.StubMessageId>(0)
  const [ruleOpen, setRuleOpen] = useState(false)
  const [savingRule, setSavingRule] = useState(false)
  const [removingStub, setRemovingStub] = useState<Stub.StubId>()
  const [deleting, setDeleting] = useState(false)

  const boardKey = AsyncResult.builder(link)
    .onSuccess((value) => value.boardKey)
    .orElse(() => '')
  const statuses = useAtomValue(boardStatusesAtom(boardKey))
  const draftPreview = useRulePreview(boardKey, status, condition, messageId)

  const saveTerms = async (patch: BoardSheet.BoardSheetPatch) => {
    const exit = await update({
      params: { id },
      payload: patch,
      reactivityKeys: [...keys.links, ...keys.today],
    })
    if (exit._tag === 'Failure') {
      toast.error(describe(exit.cause, 'That change could not be saved.'))
    }
  }

  return AsyncResult.builder(link)
    .onInitialOrWaiting(() => <ScreenState.Loading cards={2} />)
    .onError(() => (
      <ScreenState.Failed
        title="Link could not be loaded"
        detail="It may have been deleted."
      />
    ))
    .onSuccess((value) => (
      <>
        <div className="mb-5">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {value.boardKey} → {value.sheetClientName}
          </p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
            {value.sheetName}
          </h1>
          <p className="text-muted-foreground text-sm">{value.boardName}</p>
        </div>

        <Card className="py-4">
          <CardContent className="space-y-4 px-4">
            <TermsFields.Hours
              value={value.hours}
              onChange={(hours) => {
                void saveTerms({ hours: hours as typeof value.hours })
              }}
            />
            <TermsFields.CostCode
              value={value.costCodeId}
              onChange={(costCodeId) => {
                void saveTerms({
                  costCodeId: costCodeId as BoardSheet.CostCodeId,
                })
              }}
            />
          </CardContent>
        </Card>

        <ScreenState.Section
          title="Rules"
          description="Each rule adds a sentence to the entry when it matches."
          action={
            <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="size-4" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a rule</DialogTitle>
                  <DialogDescription>
                    Pick a status, how a ticket relates to it today, and the
                    wording to use.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {AsyncResult.builder(statuses)
                    .onInitialOrWaiting(() => <ScreenState.Loading cards={1} />)
                    .onError(() => (
                      <ScreenState.Failed
                        title="Statuses could not be loaded"
                        detail="Jira did not return the statuses for this board."
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
                  <Rule.ConditionField
                    value={condition}
                    onChange={setCondition}
                  />
                  <Rule.MessageField value={messageId} onChange={setMessageId} />
                  <Rule.Preview
                    statusName={status?.name}
                    condition={condition}
                    messageId={messageId}
                    preview={draftPreview}
                  />
                </div>
                <DialogFooter>
                  <Button
                    disabled={!status || savingRule}
                    onClick={() => {
                      if (!status) return
                      setSavingRule(true)
                      void addStub({
                        params: { id },
                        payload: {
                          statusId: status.id,
                          statusName: status.name,
                          condition,
                          messageId,
                        },
                        reactivityKeys: [...keys.links, ...keys.today],
                      }).then((exit) => {
                        setSavingRule(false)
                        if (exit._tag === 'Failure') {
                          toast.error(
                            describe(exit.cause, 'That rule could not be added.'),
                          )
                          return
                        }
                        setStatus(undefined)
                        setRuleOpen(false)
                        toast.success('Rule added')
                      })
                    }}
                  >
                    {savingRule ? <Spinner /> : null}
                    Add rule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        >
          {value.stubs.length === 0 ? (
            <Rule.Empty />
          ) : (
            <Rule.Root>
              {value.stubs.map((stub) => (
                <Rule.Row
                  key={stub.id}
                  boardKey={value.boardKey}
                  statusId={stub.statusId}
                  statusName={stub.statusName || 'that status'}
                  condition={stub.condition}
                  messageId={stub.messageId}
                  removing={removingStub === stub.id}
                  onRemove={() => {
                    setRemovingStub(stub.id)
                    void removeStub({
                      params: { id, stubId: stub.id },
                      reactivityKeys: [...keys.links, ...keys.today],
                    }).then((exit) => {
                      setRemovingStub(undefined)
                      if (exit._tag === 'Failure') {
                        toast.error(
                          describe(exit.cause, 'That rule could not be removed.'),
                        )
                      }
                    })
                  }}
                />
              ))}
            </Rule.Root>
          )}
        </ScreenState.Section>

        <ScreenState.Section
          title="Remove this link"
          description="Timekeeper will stop posting for this board. Entries already on your timesheet stay."
        >
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/5"
            disabled={deleting}
            onClick={() => {
              setDeleting(true)
              void remove({
                params: { id },
                reactivityKeys: [...keys.links, ...keys.today],
              }).then((exit) => {
                setDeleting(false)
                if (exit._tag === 'Failure') {
                  toast.error(
                    describe(exit.cause, 'That link could not be removed.'),
                  )
                  return
                }
                toast.success('Link removed')
                void navigate({ to: '/links' })
              })
            }}
          >
            {deleting ? <Spinner /> : <Trash2 className="size-4" />}
            Remove link
          </Button>
        </ScreenState.Section>
      </>
    ))
    .render()
}
