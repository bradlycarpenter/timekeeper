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
    // const beganTickets = await fetch(
    //   `https://${process.env.TEST_JIRA_DOMAIN}/rest/api/3/search/jql?` +
    //     `jql=${encodeURI('assignee = currentUser() AND status changed TO "In Progress" AFTER startOfDay() AND status = "In Progress"')}` +
    //     '&fields=summary',
    //   {
    //     method: 'GET',
    //     headers: {
    //       Authorization: `Basic ${btoa(`${process.env.TEST_JIRA_EMAIL}:${process.env.TEST_JIRA_API_KEY}`)}`,
    //     },
    //   },
    // ).then(async (res) => {
    //   if (!res.ok) {
    //     const body = await res.text()
    //     throw new Error(
    //       `Error fetching tickets with began status, response: ${body}`,
    //     )
    //   }
    //   const json = await res.json()
    //   try {
    //     return z
    //       .object({
    //         issues: z
    //           .object({
    //             expand: z.string(),
    //             id: z.string(),
    //             self: z.string(),
    //             key: z.string(),
    //             fields: z.object({
    //               summary: z.string(),
    //             }),
    //           })
    //           .array(),
    //         isLast: z.boolean(),
    //       })
    //       .parse(json)
    //   } catch (e) {
    //     throw new Error(
    //       `Error parsing tickets with began status query, res: ${JSON.stringify(json)}, e: ${e}`,
    //     )
    //   }
    // })
    const beganTickets = {
      issues: [
        {
          expand: '',
          id: '1',
          self: '',
          key: 'TK-1',
          fields: { summary: 'Fix login bug' },
        },
        {
          expand: '',
          id: '2',
          self: '',
          key: 'TK-2',
          fields: { summary: 'Add dashboard charts' },
        },
        {
          expand: '',
          id: '3',
          self: '',
          key: 'TK-3',
          fields: { summary: 'Refactor auth middleware' },
        },
      ],
      isLast: true,
    }

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
          break
        }
        message += `, ${beganTickets.issues[i].key} (${beganTickets.issues[i].fields.summary})`
      }
    }

    message += '.'

    const authToken = await fetch(
      `https://${process.env.WARP_TEST_DOMAIN}/api/account/authorise`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Email: process.env.WARP_TEST_USERNAME,
          Password: process.env.WARP_TEST_PASSWORD,
        }),
      },
    ).then(async (res) => {
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Error getting auth token, response: ${body}`)
      }
      const json = await res.json()
      try {
        return z
          .object({
            token: z.string(),
          })
          .parse(json).token
      } catch (e) {
        throw new Error(`Error parsing auth token, e: ${e}`)
      }
    })

    const entryId = await fetch(
      `https://${process.env.WARP_TEST_DOMAIN}/api/entry/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          TaskId: '4769',
          PersonId: '1322',
          CostCodeId: '2',
          DepartmentId: '1',
          Overtime: '0',
          Time: '8',
          EntryDate: '2026-06-17T15:00:00',
          Comments: 'Test Description',
          WorkLogId: '0',
          Audited: '0',
        }),
      },
    ).then(async (res) => {
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Error creating entry, res: ${body}`)
      }
      const json = await res.json()
      try {
        return z
          .object({
            EntryId: z.number(),
          })
          .parse(json).EntryId
      } catch (e) {
        throw new Error(
          `Error parsing entry response, res: ${JSON.stringify(json)}`,
        )
      }
    })
    return c.json({ entry_id: entryId })
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
