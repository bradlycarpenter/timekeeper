import { z } from 'zod'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'

const app = new Hono()

app.use(logger())
app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/work/commit', async (c) => {
  try {
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
    ).then(async (res) => {
      const json = await res.json()
      if (!res.ok) {
        throw new Error(
          `Error fetching tickets with began status, response: ${JSON.stringify(json)}`,
        )
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
        throw new Error(
          `Error parsing tickets with began status query, res: ${JSON.stringify(json)}, e: ${e}`,
        )
      }
    })

    if (beganTickets.issues.length < 1) {
      return c.json({ message: 'No issues to submit' })
    }

    let message: string = 'Today I began working on '

    message +=
      beganTickets.issues[0].key +
      ' (' +
      beganTickets.issues[0].fields.summary +
      ')'

    if (beganTickets.issues.length > 1) {
      for (let i = 1; i < beganTickets.issues.length; i++) {
        if (i === beganTickets.issues.length - 1) {
          message += ` and ${beganTickets.issues[i].key} (${beganTickets.issues[i].fields.summary})`
          break;
        }
        message += `, ${beganTickets.issues[i].key} (${beganTickets.issues[i].fields.summary})`
      }
    }

    message += '.'

    console.log(message)

    return c.json({ tickets: beganTickets })
  } catch (e) {
    console.error(e)
    return c.json({ error: 'Error' }, 500)
  }
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
