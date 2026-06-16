import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { data, isPending } = useQuery({
    queryKey: ['data'],
    queryFn: async () =>
      await fetch('/api/').then(async (result) => await result.text()),
    staleTime: 1_000 * 5,
  })

  return (
    <div className="flex flex-1 h-screen flex-col items-center justify-center">
      <h2>Fetch Result</h2>
      {isPending ? <p>Fetching results..</p> : <p>{data}</p>}
    </div>
  )
}
