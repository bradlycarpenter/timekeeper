import { Input } from '#/components/ui/input'
import { Item, ItemContent } from '#/components/ui/item'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/dashboard/boards/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [projectIsSelected, projectIsSelectedSet] = useState(false)

  return (
    <div className="p-2 space-y-2">
      <div className="flex gap-1">
        <Link to="/dashboard">
          <h2 className="text-xl text-muted-foreground">Dashboard</h2>
        </Link>
        <h2 className="text-xl text-accent">/</h2>
        <Link to="/dashboard/connections">
          <h2 className="text-xl font-semibold">Boards</h2>
        </Link>
      </div>
      <h2 className="text-lg">First, select your Warp project.</h2>
      <Item className="bg-card">
        <ItemContent>
          <div
            data-selected={!projectIsSelected || undefined}
            className="data-selected:hidden flex justify-between items-center w-full"
          >
            <h3 className="font-semibold">Project Selected</h3>
            <Check className="text-green-500" />
          </div>
          <div>
            <Input className="w-full" placeholder="Search" />
          </div>
        </ItemContent>
      </Item>
    </div>
  )
}
