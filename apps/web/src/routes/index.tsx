import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['data'],
    queryFn: async () =>
      await fetch('/api/work/commit').then(async (res) => {
        if (!res.ok) throw new Error('Error fetching work')
        return await res.json()
      }),
    staleTime: 1_000 * 5,
    retry: 1,
  })

  return (
    <div className="flex flex-1 h-screen flex-col items-center justify-center">
      <h2>Fetch Result</h2>
      {isPending ? (
        <p>Fetching results..</p>
      ) : isError ? (
        <p>Error fetching results</p>
      ) : (
        <p>{JSON.stringify(data)}</p>
      )}
    </div>
  )
}
