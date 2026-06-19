import { z } from 'zod'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'

const fetchJiraTickets = async (jql: string) =>
  await fetch(
    `https://${process.env.TEST_JIRA_DOMAIN}/rest/api/3/search/jql?` +
      `jql=${encodeURI(jql)}` +
      '&fields=summary',
    {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(`${process.env.TEST_JIRA_EMAIL}:${process.env.TEST_JIRA_API_KEY}`)}`,
      },
    },
  ).then(async (res) => {
    if (!res.ok) {
      const body = await res.text()
      throw new Error(
        `Error fetching tickets with began status, response: ${body}`,
      )
    }
    const json = await res.json()
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

const createMessage = (
  issueDescriptors: {
    issues: {
      expand: string
      id: string
      self: string
      key: string
      fields: {
        summary: string
      }
    }[]
    prefix: string
  }[],
) => {
  let message = ''
  for (const issueDescriptor of issueDescriptors) {
    if (message.length !== 0) {
      message += ' '
    }
    for (let i = 0; i < issueDescriptor.issues.length; i++) {
      if (i === 0) {
        message +=
          issueDescriptor.prefix +
          ' ' +
          issueDescriptor.issues[0].key +
          ' (' +
          issueDescriptor.issues[0].fields.summary +
          ')'
        continue
      }
      if (i === issueDescriptor.issues.length - 1) {
        message += ` and ${issueDescriptor.issues[i].key} (${issueDescriptor.issues[i].fields.summary})`
        continue
      }
      message += `, ${issueDescriptor.issues[i].key} (${issueDescriptor.issues[i].fields.summary})`
    }
    message += '.'
  }
  return message
}

const app = new Hono()

app.use(logger())
app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/work/commit', async (c) => {
  try {
    const beganTickets = await fetchJiraTickets(
      'assignee = currentUser() AND status changed TO "In Progress" AFTER startOfDay() AND status = "In Progress"',
    )

    const progressTickets = await fetchJiraTickets(
      'assignee = currentUser() AND status = "In Progress" AND sprint in openSprints()',
    )

    const pullRequestTickets = await fetchJiraTickets(
      'assignee = currentUser() AND status changed TO "pr" AFTER startOfDay() AND status = "pr"',
    )

    const doneTickets = await fetchJiraTickets(
      'assignee = currentUser() AND status changed TO "Done" AFTER startOfDay() AND status = "Done"',
    )

    if (
      beganTickets.issues.length < 1 &&
      progressTickets.issues.length < 1 &&
      pullRequestTickets.issues.length < 1 &&
      doneTickets.issues.length < 1
    ) {
      return c.json({ message: 'No issues to submit' })
    }

    const message = createMessage([
      { issues: beganTickets.issues, prefix: 'I began working on' },
      { issues: progressTickets.issues, prefix: 'I continued work on' },
      { issues: pullRequestTickets.issues, prefix: 'I created a PR for' },
      { issues: doneTickets.issues, prefix: 'I completed work on' },
    ])

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
          Comments: message,
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

    return c.json({ message })
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
