import { z } from 'zod'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/work/commit', async (c) => {
  let fetchErrors: string[] = []

  const beganTickets = await fetch(
    `https://${process.env.TEST_JIRA_DOMAIN}/rest/api/3/search/jql?` +
      `jql=${encodeURI('assignee = currentUser() AND status changed TO "In Progress" AFTER startOfDay() AND status = "In Progress"')}` +
      '&fields=summary',
    {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(`${process.env.TEST_JIRA_EMAIL}:${process.env.TEST_JIRA_API_KEY}`)}`,
      },
    },
  )
    .then(async (res) => {
      const json = await res.json()
      if (!res.ok) {
        console.log(
          'Error fetching tickets with began status, response: ',
          json,
        )
        fetchErrors.push('Error fetching tickets with began status.')
        return undefined
      }
      try {
        return z
          .object({
            issues: z
              .object({
                expand: z.string(),
                id: z.string(),
                self: z.string(),
                key: z.string(),
                fields: z.object({
                  summary: z.string(),
                }),
              })
              .array(),
            isLast: z.boolean(),
          })
          .parse(json)
      } catch (e) {
        console.error(
          `Error parsing tickets with began status query, res: ${JSON.stringify(json)}, e: ${e}`,
        )
        fetchErrors.push('Error parsing tickets with began status query.')
        return undefined
      }
    })
    .catch((e) => {
      console.error(e)
      fetchErrors.push('Error fetching tickets with began status')
      return undefined
    })

  if (fetchErrors.length > 0) return c.json({ error: 'Error' }, 500)

  return c.json({ tickets: beganTickets })
})

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  },
)
