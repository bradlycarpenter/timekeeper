import { useAtomRefresh, useAtomValue } from '@effect/atom-react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { AsyncResult } from 'effect/unstable/reactivity'
import { Link2, Plus, Settings2 } from 'lucide-react'
import { LinkCard } from '#/components/link-card/link-card'
import { PageHeader } from '#/components/page-header/page-header'
import { ScreenState } from '#/components/screen-state/screen-state'
import { Button } from '#/components/ui/button'
import { linksAtom } from '#/lib/atoms'
import { registry } from '#/lib/registry'

export const Route = createFileRoute('/_app/links/')({
  loader: () => {
    registry.get(linksAtom)
  },
  component: LinksScreen,
})

function LinksScreen() {
  const links = useAtomValue(linksAtom)
  const refresh = useAtomRefresh(linksAtom)

  return (
    <>
      <PageHeader.Root>
        <PageHeader.Title
          heading="Links"
          description="Each link turns one Jira board into one timesheet entry a day."
        />
        <PageHeader.Action>
          <Button asChild className="h-11 md:h-8">
            <Link to="/links/new">
              <Plus className="size-4" />
              New
            </Link>
          </Button>
        </PageHeader.Action>
      </PageHeader.Root>

      {AsyncResult.builder(links)
        .onInitialOrWaiting(() => <ScreenState.Loading cards={2} />)
        .onError(() => (
          <ScreenState.Failed
            title="Links could not be loaded"
            detail="Something went wrong reading your links."
            onRetry={refresh}
          />
        ))
        .onSuccess((all) =>
          all.length === 0 ? (
            <ScreenState.Empty
              icon={<Link2 className="size-8" />}
              title="No links yet"
              detail="A link pairs a Jira board with the timesheet project it should be billed to."
            >
              <Button asChild>
                <Link to="/links/new">
                  <Plus className="size-4" />
                  Create a link
                </Link>
              </Button>
            </ScreenState.Empty>
          ) : (
            /* Matches Today: 24px between records, 12px inside one. */
            <div className="space-y-6">
              {all.map((link) => (
                <LinkCard.Root key={link.id}>
                  <LinkCard.Heading
                    clientName={link.sheetClientName}
                    projectName={link.sheetName}
                    boardName={link.boardName}
                    boardKey={link.boardKey}
                  />
                  <LinkCard.Terms
                    hours={link.hours}
                    costCodeId={link.costCodeId}
                  />
                  <LinkCard.RuleCount count={link.stubs.length} />
                  <LinkCard.Actions>
                    <Button asChild variant="outline" className="h-11 flex-1 md:h-8">
                      <Link to="/links/$linkId" params={{ linkId: link.id }}>
                        <Settings2 className="size-4" />
                        {link.stubs.length === 0 ? 'Add rules' : 'Manage'}
                      </Link>
                    </Button>
                  </LinkCard.Actions>
                </LinkCard.Root>
              ))}
            </div>
          ),
        )
        .render()}
    </>
  )
}
