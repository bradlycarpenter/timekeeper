import { serve } from '@hono/node-server'
import { warpProjectSchema } from '@tk/types'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { z } from 'zod'

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
  return c.text('Healthy')
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

    // const entryId = await fetch(
    //   `https://${process.env.WARP_TEST_DOMAIN}/api/entry/create`,
    //   {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       Authorization: `Bearer ${authToken}`,
    //     },
    //     body: JSON.stringify({
    //       TaskId: '4769',
    //       PersonId: '1322',
    //       CostCodeId: '2',
    //       DepartmentId: '1',
    //       Overtime: '0',
    //       Time: '8',
    //       EntryDate: '2026-06-17T15:00:00',
    //       Comments: message,
    //       WorkLogId: '0',
    //       Audited: '0',
    //     }),
    //   },
    // ).then(async (res) => {
    //   if (!res.ok) {
    //     const body = await res.text()
    //     throw new Error(`Error creating entry, res: ${body}`)
    //   }
    //   const json = await res.json()
    //   try {
    //     return z
    //       .object({
    //         EntryId: z.number(),
    //       })
    //       .parse(json).EntryId
    //   } catch (e) {
    //     throw new Error(
    //       `Error parsing entry response, res: ${JSON.stringify(json)}`,
    //     )
    //   }
    // })

    return c.json({ message })
  } catch (e) {
    console.error(e)
    return c.json({ error: 'Error' }, 500)
  }
})

app.post('/sheets/auth', async (c) => {
  const queryParseResult = z
    .object({
      email: z.email(),
      password: z.string(),
    })
    .safeParse(await c.req.json())

  if (!queryParseResult.success) {
    console.error(queryParseResult.error)
    return c.json({ reason: 'Invalid query' }, 400)
  }

  try {
    const authToken = await fetch(
      `https://${process.env.WARP_TEST_DOMAIN}/api/account/authorise`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Email: queryParseResult.data.email,
          Password: queryParseResult.data.password,
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
          .parse(json)
      } catch (e) {
        console.error(e)
        throw new Error(`Error parsing auth token, e: ${e}`)
      }
    })

    return c.json(authToken)
  } catch (e) {
    console.error(e)
    return c.json({ reason: 'We had trouble processing your request' }, 500)
  }
})

app.get('/sheets/projects/:page', async (c) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Issue validating token')
    return c.json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const projects = await fetch(
      `https://${process.env.WARP_TEST_DOMAIN}/api/Project?per_page=500&page=${c.req.param().page}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    ).then(async (res) => {
      if (!res.ok) {
        const body = await res.text()
        throw new Error(
          `Error getting projects: ${res.status} ${res.statusText} for ${res.url}, body: ${body || '<empty>'}`,
        )
      }
      const json = await res.json()
      try {
        return warpProjectSchema.array().parse(json)
      } catch (e) {
        console.error(e)
        throw new Error(`Error parsing projects, e: ${e}`)
      }
    })
    return c.json(projects)
  } catch (e) {
    console.error(e)
    return c.json({ Reason: 'We had trouble fetching projects' }, 502)
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
