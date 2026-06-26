import {
  jiraProjectSchema,
  StatusCondition,
  warpProjectSchema,
} from '@tk/types'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { z } from 'zod'
import { auth } from './auth.js'
import { responseParseOrThrow } from '@tk/utils'
import { db } from './db.init.js'
import { boardSheet, stub } from './db.schema.js'

/** Can throw
 * Fetches all resources and returns the cloud ID from the first one
 * Can they have multiple resources?
 * What happens if they do?*/
const cloudIdGet = async (accessToken: string) =>
  await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })
    .then(async (res) =>
      responseParseOrThrow({
        res,
        schema: z
          .object({
            id: z.string(),
            url: z.string(),
            name: z.string(),
          })
          .array(),
        name: 'Accessible Resources',
      }),
    )
    .then((res) => res[0]?.id)

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()

app.use('*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!session) {
    c.set('user', null)
    c.set('session', null)
    await next()
    return
  }

  c.set('user', session.user)
  c.set('session', session.session)
  await next()
})
app.use(logger())

app.get('/', (c) => {
  return c.text('Healthy')
})

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw)
})

app.post('/sheets/auth', async (c) => {
  const bodyParseResult = z
    .object({
      email: z.email(),
      password: z.string(),
    })
    .safeParse(await c.req.json())

  if (!bodyParseResult.success) {
    console.error(bodyParseResult.error)
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
          Email: bodyParseResult.data.email,
          Password: bodyParseResult.data.password,
        }),
      },
    ).then(async (res) =>
      responseParseOrThrow({
        res,
        schema: z.object({
          token: z.string(),
        }),
        name: 'Auth Token',
      }),
    )

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
    ).then(async (res) =>
      responseParseOrThrow({
        res,
        schema: warpProjectSchema.array(),
        name: 'Projects',
      }),
    )
    return c.json(projects)
  } catch (e) {
    console.error(e)
    return c.json({ Reason: 'We had trouble fetching projects' }, 502)
  }
})

app.get('/work/atlassian/projects', async (c) => {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // TODO: Test what happens if atlassian not linked
  const { accessToken } = await auth.api.getAccessToken({
    body: {
      providerId: 'atlassian',
      userId: user.id,
    },
    headers: c.req.raw.headers,
  })

  try {
    // Brad: We have to first get the stupid cloud ID because when using OAuth
    // we need to hit the EX endpoint for whatever reason.

    const cloudId = await cloudIdGet(accessToken)

    if (!cloudId) {
      return c.json({ reason: 'No accessible reasources' }, 400)
    }

    // Brad: We can't just look up what projects the user has access to because
    // at Warp the user has access to every project under the sun so one way we
    // can see what projects they are working on is by looking through all of
    // their completed issues and then adding the projects related to those
    // issues to a set so they are automatically deduped.

    const jql = 'assignee = currentUser() AND statusCategory != Done'

    const projectsById = new Map<
      string,
      { id: string; key: string; name: string }
    >()

    let nextPageToken: string | undefined

    do {
      const params = new URLSearchParams({
        jql,
        fields: 'project',
        maxResults: '100',
      })
      if (nextPageToken) params.set('nextPageToken', nextPageToken)

      const page = await fetch(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search/jql?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        },
      ).then(async (res) =>
        responseParseOrThrow({
          res,
          schema: z.object({
            issues: z
              .object({
                fields: z.object({
                  project: jiraProjectSchema,
                }),
              })
              .array(),
            nextPageToken: z.string().optional(),
          }),
          name: 'Issue Search',
        }),
      )

      for (const issue of page.issues) {
        projectsById.set(issue.fields.project.id, issue.fields.project)
      }

      nextPageToken = page.nextPageToken
    } while (nextPageToken)

    return c.json([...projectsById.values()])
  } catch (e) {
    console.error(e)
    return c.json({ error: 'We had trouble fetching projects' }, 502)
  }
})

app.get('/work/status/:projectKey', async (c) => {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const key = c.req.param('projectKey')

  const { accessToken } = await auth.api.getAccessToken({
    body: {
      providerId: 'atlassian',
      userId: user.id,
    },
    headers: c.req.raw.headers,
  })

  try {
    const cloudId = await cloudIdGet(accessToken)

    if (!cloudId) {
      return c.json({ reason: 'User has no access to resources' }, 400)
    }

    const ticketTypes = await fetch(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project/${key}/statuses`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      },
    ).then(async (res) =>
      responseParseOrThrow({
        res,
        schema: z
          .object({
            self: z.url(),
            id: z.string(),
            name: z.string(),
            subtask: z.boolean(),
            statuses: z
              .object({
                self: z.url(),
                description: z.string(),
                iconUrl: z.url(),
                name: z.string(),
                untranslatedName: z.string(),
                id: z.string(),
                statusCategory: z.object({
                  self: z.url(),
                  id: z.number(),
                  key: z.string(),
                  colorName: z.string(),
                  name: z.string(),
                }),
              })
              .array(),
          })
          .array(),
        name: 'Statuses',
      }),
    )

    const statusCategories = new Map<
      string,
      {
        self: string
        id: number
        key: string
        colorName: string
        name: string
        statuses: { self: string; name: string; id: string }[]
      }
    >()

    // Brad: Reformat the list as the map above.
    // Loop over each ticket type, then each status inside the ticket type
    // status array. Then separate the status category from the fields.
    // Make a category variable, check if the map already has that category.
    // If it doesn't, assign the category variable with the category from
    // the current status in the iteration and an empty array of statuses,
    // then store that category back into the map.
    // Then, we'll have a category with fields and a status array so we check
    // if the statuses array inside the category already has the status we're
    // currently on (matched by id) and if it doesn't, we push it into that
    // array or move on.

    for (const ticketType of ticketTypes) {
      for (const status of ticketType.statuses) {
        const { statusCategory, ...statusFields } = status

        let category = statusCategories.get(statusCategory.name)
        if (!category) {
          category = { ...statusCategory, statuses: [] }
          statusCategories.set(statusCategory.name, category)
        }

        if (!category.statuses.some((s) => s.id === statusFields.id)) {
          category.statuses.push({
            self: statusFields.self,
            name: statusFields.name,
            id: statusFields.id,
          })
        }
      }
    }

    return c.json([...statusCategories.values()])
  } catch (e) {
    console.error(e)
    return c.json({ reason: 'We had trouble fetching statuses' }, 500)
  }
})

app.get('/boardsheet', async (c) => {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const boardsheets = await db.query.boardSheet.findMany({
      where: (bs, { eq }) => eq(bs.userId, user.id),
    })
    return c.json(boardsheets)
  } catch (e) {
    console.error(e)
    return c.json({ reason: 'Error loading boardsheets' }, 500)
  }
})

app.post('/boardsheet', async (c) => {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const bodyParseResult = z
    .object({
      warpProject: warpProjectSchema,
      jiraProject: jiraProjectSchema,
    })
    .safeParse(await c.req.json())

  if (!bodyParseResult.success) {
    console.error(bodyParseResult.error)
    return c.json({ reason: 'Invalid post body' }, 400)
  }

  const { warpProject, jiraProject } = bodyParseResult.data

  try {
    await db.insert(boardSheet).values({
      userId: user.id,
      sheetTaskId: warpProject.TaskId,
      sheetName: warpProject.Name,
      sheetClientName: warpProject.Client.Name,
      boardId: jiraProject.id,
      boardName: jiraProject.name,
      boardKey: jiraProject.key,
    })
    return c.json({ success: true }, 201)
  } catch (e) {
    console.error(e)
    return c.json({ reason: 'Failed to save project link' }, 500)
  }
})

app.post('/stub', async (c) => {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const bodyParseResult = z
    .object({
      boardSheetId: z.string(),
      jiraStatusId: z.string(),
      statusConditionId: z.enum(StatusCondition),
      // TODO: Figure this shit out
      stubMessageId: z.union([
        z.literal(0),
        z.literal(1),
        z.literal(2),
        z.literal(3),
      ]),
    })
    .safeParse(await c.req.json())

  if (!bodyParseResult.success) {
    console.error(bodyParseResult.error)
    return c.json({ reason: 'Invalid post body' }, 400)
  }

  const { boardSheetId, jiraStatusId, statusConditionId, stubMessageId } =
    bodyParseResult.data

  try {
    await db.insert(stub).values({
      boardSheetId: boardSheetId,
      messageId: stubMessageId,
      statusCondition: statusConditionId,
      statusId: jiraStatusId,
    })
    return c.json({ success: true })
  } catch (e) {
    console.error(e)
    return c.json({ reason: 'Failed to save stub' }, 500)
  }
})

export default app

// app.get('/work/commit', async (c) => {
//   try {
//     const beganTickets = await fetchJiraTickets(
//       'assignee = currentUser() AND status changed TO "In Progress" AFTER startOfDay() AND status = "In Progress"',
//     )

//     const progressTickets = await fetchJiraTickets(
//       'assignee = currentUser() AND status = "In Progress" AND sprint in openSprints()',
//     )

//     const pullRequestTickets = await fetchJiraTickets(
//       'assignee = currentUser() AND status changed TO "pr" AFTER startOfDay() AND status = "pr"',
//     )

//     const doneTickets = await fetchJiraTickets(
//       'assignee = currentUser() AND status changed TO "Done" AFTER startOfDay() AND status = "Done"',
//     )

//     if (
//       beganTickets.issues.length < 1 &&
//       progressTickets.issues.length < 1 &&
//       pullRequestTickets.issues.length < 1 &&
//       doneTickets.issues.length < 1
//     ) {
//       return c.json({ message: 'No issues to submit' })
//     }

//     const message = createMessage([
//       { issues: beganTickets.issues, prefix: 'I began working on' },
//       { issues: progressTickets.issues, prefix: 'I continued work on' },
//       { issues: pullRequestTickets.issues, prefix: 'I created a PR for' },
//       { issues: doneTickets.issues, prefix: 'I completed work on' },
//     ])

//     const entryId = await fetch(
//       `https://${process.env.WARP_TEST_DOMAIN}/api/entry/create`,
//       {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${authToken}`,
//         },
//         body: JSON.stringify({
//           TaskId: '4769',
//           PersonId: '1322',
//           CostCodeId: '2',
//           DepartmentId: '1',
//           Overtime: '0',
//           Time: '8',
//           EntryDate: '2026-06-17T15:00:00',
//           Comments: message,
//           WorkLogId: '0',
//           Audited: '0',
//         }),
//       },
//     ).then(async (res) => {
//       if (!res.ok) {
//         const body = await res.text()
//         throw new Error(`Error creating entry, res: ${body}`)
//       }
//       const json = await res.json()
//       try {
//         return z
//           .object({
//             EntryId: z.number(),
//           })
//           .parse(json).EntryId
//       } catch (e) {
//         throw new Error(
//           `Error parsing entry response, res: ${JSON.stringify(json)}`,
//         )
//       }
//     })

//     return c.json({ message })
//   } catch (e) {
//     console.error(e)
//     return c.json({ error: 'Error' }, 500)
//   }
// })

// const fetchJiraTickets = async (jql: string) =>
//   await fetch(
//     `https://${process.env.TEST_JIRA_DOMAIN}/rest/api/3/search/jql?` +
//       `jql=${encodeURI(jql)}` +
//       '&fields=summary',
//     {
//       method: 'GET',
//       headers: {
//         Authorization: `Basic ${btoa(`${process.env.TEST_JIRA_EMAIL}:${process.env.TEST_JIRA_API_KEY}`)}`,
//       },
//     },
//   ).then(async (res) => {
//     if (!res.ok) {
//       const body = await res.text()
//       throw new Error(
//         `Error fetching tickets with began status, response: ${body}`,
//       )
//     }
//     const json = await res.json()
//     try {
//       return z
//         .object({
//           issues: z
//             .object({
//               expand: z.string(),
//               id: z.string(),
//               self: z.string(),
//               key: z.string(),
//               fields: z.object({
//                 summary: z.string(),
//               }),
//             })
//             .array(),
//           isLast: z.boolean(),
//         })
//         .parse(json)
//     } catch (e) {
//       throw new Error(
//         `Error parsing tickets with began status query, res: ${JSON.stringify(json)}, e: ${e}`,
//       )
//     }
//   })

// const createMessage = (
//   issueDescriptors: {
//     issues: {
//       expand: string
//       id: string
//       self: string
//       key: string
//       fields: {
//         summary: string
//       }
//     }[]
//     prefix: string
//   }[],
// ) => {
//   let message = ''
//   for (const issueDescriptor of issueDescriptors) {
//     if (message.length !== 0) {
//       message += ' '
//     }
//     for (let i = 0; i < issueDescriptor.issues.length; i++) {
//       if (i === 0) {
//         message +=
//           issueDescriptor.prefix +
//           ' ' +
//           issueDescriptor.issues[0].key +
//           ' (' +
//           issueDescriptor.issues[0].fields.summary +
//           ')'
//         continue
//       }
//       if (i === issueDescriptor.issues.length - 1) {
//         message += ` and ${issueDescriptor.issues[i].key} (${issueDescriptor.issues[i].fields.summary})`
//         continue
//       }
//       message += `, ${issueDescriptor.issues[i].key} (${issueDescriptor.issues[i].fields.summary})`
//     }
//     message += '.'
//   }
//   return message
// }
