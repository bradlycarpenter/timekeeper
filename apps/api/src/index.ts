import type { JiraIssue } from '@tk/types'
import {
  jiraIssuesResponseSchema,
  jiraProjectSchema,
  StatusCondition,
  stubMessages,
  toAPIWarpAuthStatus,
  WarpAuthStatus,
  warpProjectSchema,
  warpPersonIdSchema,
} from '@tk/types'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { z } from 'zod'
import { createAuth } from './auth.js'
import { responseParse } from '@tk/utils'
import { createDb } from './db.init.js'
import {
  boardSheet,
  dailyBoardSheetPost,
  sheetAuthToken,
  stub,
} from './db.schema.js'
import { and, eq } from 'drizzle-orm'

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
      responseParse({
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

/**Can throw*/
const issuesGet = async (env: Bindings, jql: string) => {
  let issues: JiraIssue[] = []
  let isLast = true
  let nextPageToken: string | undefined
  do {
    const params = new URLSearchParams({
      jql,
      fields: 'summary',
      ...(nextPageToken ? { nextPageToken } : {}),
    })

    const issueResponse = await fetch(
      `https://${env.TEST_JIRA_DOMAIN}/rest/api/3/search/jql?${params}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${btoa(`${env.TEST_JIRA_EMAIL}:${env.TEST_JIRA_API_KEY}`)}`,
        },
      },
    ).then((res) =>
      responseParse({
        res,
        schema: jiraIssuesResponseSchema,
        name: 'Issues',
      }),
    )
    issues.push(...issueResponse.issues)
    isLast = issueResponse.isLast
    nextPageToken = issueResponse.nextPageToken
    // Brad: Unlikey but will hit infinite loop if we hit this case
    if (!isLast && !nextPageToken) {
      throw new Error(
        'Jira issue search response was not last page but did not include nextPageToken',
      )
    }
  } while (!isLast)
  return issues
}

type IssueDescriptor = {
  issues: JiraIssue[]
  prefix: string
}

const createMessage = (issueDescriptors: IssueDescriptor[]) => {
  let message = ''
  for (const issueDescriptor of issueDescriptors) {
    if (message.length !== 0) {
      message += ' '
    }
    for (const [i, issue] of issueDescriptor.issues.entries()) {
      if (i === 0) {
        message +=
          issueDescriptor.prefix +
          ' ' +
          issue.key +
          ' (' +
          issue.fields.summary +
          ')'
        continue
      }
      if (i === issueDescriptor.issues.length - 1) {
        message += ` and ${issue.key} (${issue.fields.summary})`
        continue
      }
      message += `, ${issue.key} (${issue.fields.summary})`
    }
    message += '.'
  }
  return message
}

type DailyBoardSheetPostJob = {
  boardSheetId: string
  entryDate: string
}

type Bindings = {
  DB: D1Database
  DAILY_POST_QUEUE: Queue<DailyBoardSheetPostJob>
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  BETTER_AUTH_TRUSTED_ORIGINS?: string
  MICROSOFT_CLIENT_ID: string
  MICROSOFT_CLIENT_SECRET?: string
  MICROSOFT_TENANT_ID?: string
  ATLASSIAN_CLIENT_ID: string
  ATLASSIAN_CLIENT_SECRET?: string
  TEST_JIRA_DOMAIN: string
  TEST_JIRA_EMAIL: string
  TEST_JIRA_API_KEY: string
  WARP_TEST_DOMAIN: string
}

type Auth = ReturnType<typeof createAuth>

const app = new Hono<{
  Bindings: Bindings
  Variables: {
    user: Auth['$Infer']['Session']['user'] | null
    session: Auth['$Infer']['Session']['session'] | null
  }
}>()

app.use('*', async (c, next) => {
  const auth = createAuth(c.env)
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

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
  const auth = createAuth(c.env)
  return auth.handler(c.req.raw).then((res) => {
    console.log('auth handler', c.req.method, c.req.path, res.status)
    return res
  })
})

app.get('/api/sheets/auth', async (c) => {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const db = createDb(c.env.DB)

    const sheetAuthToken = await db.query.sheetAuthToken.findFirst({
      where: (sheetAuthToken, { eq }) => eq(sheetAuthToken.userId, user.id),
    })

    if (!sheetAuthToken?.authToken) {
      return c.json({ status: toAPIWarpAuthStatus(WarpAuthStatus.NoToken) })
    }

    const personIdResponse = await fetch(
      `https://${c.env.WARP_TEST_DOMAIN}/api/users/me`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sheetAuthToken.authToken}`,
        },
      },
    )

    if (personIdResponse.status >= 400 && personIdResponse.status < 500) {
      return c.json({ status: toAPIWarpAuthStatus(WarpAuthStatus.Stale) })
    } else if (!personIdResponse.ok) {
      throw new Error(
        `Error getting response from Warp Person ID ${await personIdResponse.text()}`,
      )
    }

    const personIdResponseJson = await personIdResponse.json()

    const personIdParsed = warpPersonIdSchema.parse(personIdResponseJson)

    return c.json({
      status: toAPIWarpAuthStatus(WarpAuthStatus.Authed),
      personId: personIdParsed.PersonId,
    })
  } catch (e) {
    console.error(e)
    return c.json({ reason: 'We had trouble processing your request' }, 500)
  }
})

app.post('/api/sheets/auth', async (c) => {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

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
    const authTokenResponse = await fetch(
      `https://${c.env.WARP_TEST_DOMAIN}/api/account/authorise`,
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
      responseParse({
        res,
        schema: z.object({
          token: z.string(),
        }),
        name: 'Auth Token',
      }),
    )

    const db = createDb(c.env.DB)

    await db
      .insert(sheetAuthToken)
      .values({ userId: user.id, authToken: authTokenResponse.token })

    return c.json({ sucess: true })
  } catch (e) {
    console.error(e)
    return c.json({ reason: 'We had trouble processing your request' }, 500)
  }
})

app.get('/api/sheets/projects/:page', async (c) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Issue validating token')
    return c.json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const projects = await fetch(
      `https://${c.env.WARP_TEST_DOMAIN}/api/Project?per_page=500&page=${c.req.param().page}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    ).then(async (res) =>
      responseParse({
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

app.get('/api/messages/:boardSheetId', async (c) => {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { boardSheetId } = c.req.param()

  try {
    const db = createDb(c.env.DB)
    const boardSheetStubs = await db.query.boardSheet.findFirst({
      where: (boardSheet, { eq, and }) =>
        and(eq(boardSheet.userId, user.id), eq(boardSheet.id, boardSheetId)),
      with: {
        stubs: true,
      },
    })

    if (!boardSheetStubs) {
      return c.json({ reason: 'No boardsheet for user at id.' }, 404)
    }

    const issueDescriptors: IssueDescriptor[] = []

    for (const stub of boardSheetStubs.stubs) {
      const stubMessage = stubMessages.find(
        (stubMessage) => stubMessage.id === stub.messageId,
      )

      if (!stubMessage) {
        throw new Error(`Unknown stub message id: ${stub.messageId}`)
      }

      switch (stub.statusCondition) {
        case StatusCondition.Entered: {
          const issues = await issuesGet(
            c.env,
            `project = ${boardSheetStubs.boardKey}
             AND assignee = currentUser()
             AND status CHANGED TO ${stub.statusId} AFTER startOfDay() AND status = ${stub.statusId}`,
          )
          if (issues.length > 0) {
            issueDescriptors.push({
              issues,
              prefix: stubMessage.text,
            })
          }
          break
        }
        case StatusCondition.Stationary: {
          const issues = await issuesGet(
            c.env,
            `project = ${boardSheetStubs.boardKey}
             AND assignee = currentUser()
             AND status = ${stub.statusId}
             AND status WAS ${stub.statusId} DURING (startOfDay(-1d), endOfDay(-1d))
             AND NOT status CHANGED TO ${stub.statusId} AFTER startOfDay()`,
          )
          if (issues.length > 0) {
            issueDescriptors.push({
              issues,
              prefix: stubMessage.text,
            })
          }
          break
        }
        case StatusCondition.Left:
          const issues = await issuesGet(
            c.env,
            `project = ${boardSheetStubs.boardKey}
             AND assignee = currentUser()
             AND status CHANGED FROM ${stub.statusId} AFTER startOfDay()
             AND status != ${stub.statusId}`,
          )
          if (issues.length > 0) {
            issueDescriptors.push({
              issues,
              prefix: stubMessage.text,
            })
          }
          break
        default:
          break
      }
    }

    const message = createMessage(issueDescriptors)
    return c.json({ message })
  } catch (e) {
    console.error(e)
    return c.json({ reason: 'We failed to fetch issues' }, 500)
  }
})

app.get('/api/work/atlassian/issues/:stubId', async (c) => {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { stubId } = c.req.param()

  try {
    const db = createDb(c.env.DB)
    const stub = await db.query.stub.findFirst({
      where: (stub, { eq }) => eq(stub.id, stubId),
      with: {
        boardSheet: true,
      },
    })

    if (!stub) {
      return c.json({ reason: 'No stub sotred at that ID' }, 404)
    }

    const auth = createAuth(c.env)
    const { accessToken } = await auth.api.getAccessToken({
      body: {
        providerId: 'atlassian',
        userId: user.id,
      },
      headers: c.req.raw.headers,
    })

    const cloudId = await cloudIdGet(accessToken)

    if (!cloudId) {
      return c.json({ reason: 'No accessible reasources' }, 400)
    }

    switch (stub.statusCondition) {
      case StatusCondition.Entered: {
        const issuesResponse = await issuesGet(
          c.env,
          `project = ${stub.boardSheet.boardKey}
           AND assignee = currentUser()
           AND status CHANGED TO ${stub.statusId} AFTER startOfDay() AND status = ${stub.statusId}`,
        )
        return c.json(issuesResponse)
      }
      case StatusCondition.Stationary: {
        const issuesResponse = await issuesGet(
          c.env,
          `project = ${stub.boardSheet.boardKey}
           AND assignee = currentUser()
           AND status = ${stub.statusId}
           AND status WAS ${stub.statusId} DURING (startOfDay(-1d), endOfDay(-1d))
           AND NOT status CHANGED TO ${stub.statusId} AFTER startOfDay()`,
        )
        return c.json(issuesResponse)
      }
      case StatusCondition.Left:
        const issuesResponse = await issuesGet(
          c.env,
          `project = ${stub.boardSheet.boardKey}
           AND assignee = currentUser()
           AND status CHANGED FROM ${stub.statusId} AFTER startOfDay()
           AND status != ${stub.statusId}`,
        )
        return c.json(issuesResponse)
      default:
        return c.json({ reason: 'Operation not implemented yet' }, 501)
    }
  } catch (e) {
    console.error(e)
    return c.json({ reason: 'We failed to fetch issues' }, 500)
  }
})

app.get('/api/work/atlassian/projects', async (c) => {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    // TODO: Test what happens if atlassian not linked
    const auth = createAuth(c.env)
    const { accessToken } = await auth.api.getAccessToken({
      body: {
        providerId: 'atlassian',
        userId: user.id,
      },
      headers: c.req.raw.headers,
    })

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
        responseParse({
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

app.get('/api/work/status/:projectKey', async (c) => {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const key = c.req.param('projectKey')

  try {
    const auth = createAuth(c.env)
    const { accessToken } = await auth.api.getAccessToken({
      body: {
        providerId: 'atlassian',
        userId: user.id,
      },
      headers: c.req.raw.headers,
    })

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
      responseParse({
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

app.get('/api/boardsheet', async (c) => {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const db = createDb(c.env.DB)
    const boardsheets = await db.query.boardSheet.findMany({
      where: (bs, { eq }) => eq(bs.userId, user.id),
    })
    return c.json(boardsheets)
  } catch (e) {
    console.error(e)
    return c.json({ reason: 'Error loading boardsheets' }, 500)
  }
})

app.post('/api/boardsheet', async (c) => {
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
    const db = createDb(c.env.DB)
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

app.get('/api/stub', async (c) => {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const db = createDb(c.env.DB)
    const boardSheetStubs = await db.query.boardSheet.findMany({
      with: {
        stubs: true,
      },
      where: (boardSheet, { eq }) => eq(boardSheet.userId, user.id),
    })
    return c.json(boardSheetStubs)
  } catch (e) {
    console.error()
    return c.json({ reason: 'We had trouble fetching your stubs' }, 500)
  }
})

app.post('/api/stub', async (c) => {
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
    const db = createDb(c.env.DB)
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

export default {
  fetch: app.fetch,

  async scheduled(
    controller: ScheduledController,
    env: Bindings,
    _ctx: ExecutionContext,
  ) {
    const db = createDb(env.DB)

    const boardSheets = await db.query.boardSheet.findMany({
      with: {
        stubs: true,
      },
    })

    const entryDate = new Date(controller.scheduledTime)
      .toISOString()
      .slice(0, 10)

    const candidates = boardSheets
      .filter((boardSheet) => boardSheet.stubs.length > 0)
      .map((boardSheet) => ({
        boardSheetId: boardSheet.id,
        userId: boardSheet.userId,
        entryDate,
        status: 'queued' as const,
      }))

    const insertedPosts =
      candidates.length === 0
        ? []
        : await db
            .insert(dailyBoardSheetPost)
            .values(candidates)
            .onConflictDoNothing()
            .returning()

    if (insertedPosts.length > 0) {
      await env.DAILY_POST_QUEUE.sendBatch(
        insertedPosts.map((post) => ({
          body: {
            boardSheetId: post.boardSheetId,
            entryDate: post.entryDate,
          },
        })),
      )
    }

    console.log('scheduled daily board sheet posts', {
      cron: controller.cron,
      scheduledTime: controller.scheduledTime,
      entryDate,
      boardSheetCount: boardSheets.length,
      candidateCount: candidates.length,
      insertedCount: insertedPosts.length,
      enqueuedCount: insertedPosts.length,
    })
  },

  async queue(
    batch: MessageBatch<DailyBoardSheetPostJob>,
    env: Bindings,
    _ctx: ExecutionContext,
  ) {
    console.log('daily post queue batch', {
      queue: batch.queue,
      messageCount: batch.messages.length,
    })
    const db = createDb(env.DB)

    for (const message of batch.messages) {
      const job = message.body

      const boardSheet = await db.query.boardSheet.findFirst({
        where: (boardSheet, { eq }) => eq(boardSheet.id, job.boardSheetId),
        with: {
          stubs: true,
        },
      })

      if (!boardSheet) {
        console.log('daily board sheet post skipped: board sheet not found', {
          boardSheetId: job.boardSheetId,
          entryDate: job.entryDate,
        })

        message.ack()
        continue
      }

      const issueDescriptors: IssueDescriptor[] = []

      for (const stub of boardSheet.stubs) {
        const stubMessage = stubMessages.find(
          (stubMessage) => stubMessage.id === stub.messageId,
        )

        if (!stubMessage) {
          throw new Error(`Unknown stub message id: ${stub.messageId}`)
        }

        switch (stub.statusCondition) {
          case StatusCondition.Entered: {
            const issues = await issuesGet(
              env,
              `project = ${boardSheet.boardKey}
               AND assignee = currentUser()
               AND status CHANGED TO ${stub.statusId} AFTER startOfDay() AND status = ${stub.statusId}`,
            )
            if (issues.length > 0) {
              issueDescriptors.push({
                issues,
                prefix: stubMessage.text,
              })
            }
            break
          }
          case StatusCondition.Stationary: {
            const issues = await issuesGet(
              env,
              `project = ${boardSheet.boardKey}
               AND assignee = currentUser()
               AND status = ${stub.statusId}
               AND status WAS ${stub.statusId} DURING (startOfDay(-1d), endOfDay(-1d))
               AND NOT status CHANGED TO ${stub.statusId} AFTER startOfDay()`,
            )
            if (issues.length > 0) {
              issueDescriptors.push({
                issues,
                prefix: stubMessage.text,
              })
            }
            break
          }
          case StatusCondition.Left:
            const issues = await issuesGet(
              env,
              `project = ${boardSheet.boardKey}
               AND assignee = currentUser()
               AND status CHANGED FROM ${stub.statusId} AFTER startOfDay()
               AND status != ${stub.statusId}`,
            )
            if (issues.length > 0) {
              issueDescriptors.push({
                issues,
                prefix: stubMessage.text,
              })
            }
            break
          default:
            break
        }
      }

      const newMessage = createMessage(issueDescriptors)

      const sheetAuthToken = await db.query.sheetAuthToken.findFirst({
        where: (sheetAuthToken, { eq }) =>
          eq(sheetAuthToken.userId, boardSheet.userId),
        columns: {
          authToken: true,
        },
      })

      if (!sheetAuthToken?.authToken) {
        throw new Error(
          `No sheet auth token stored for user: ${boardSheet.userId}`,
        )
      }

      const personIdResponse = await fetch(
        `https://${env.WARP_TEST_DOMAIN}/api/users/me`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sheetAuthToken.authToken}`,
          },
        },
      ).then((res) =>
        responseParse({
          res,
          schema: warpPersonIdSchema,
          name: 'Person',
        }),
      )
      const entryIdResponse = await fetch(
        `https://${env.WARP_TEST_DOMAIN}/api/entry/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sheetAuthToken.authToken}`,
          },
          body: JSON.stringify({
            TaskId: boardSheet.sheetTaskId,
            PersonId: personIdResponse.PersonId,
            CostCodeId: '2',
            DepartmentId: '1',
            Overtime: '0',
            Time: '8',
            EntryDate: `${job.entryDate}T17:00:00`,
            Comments: newMessage,
            WorkLogId: '0',
            Audited: '0',
          }),
        },
      ).then((res) =>
        responseParse({
          res,
          schema: z.object({
            EntryId: z.number(),
          }),
          name: 'Entry',
        }),
      )

      await db
        .update(dailyBoardSheetPost)
        .set({ status: 'posted', entryId: entryIdResponse.EntryId })
        .where(
          and(
            eq(dailyBoardSheetPost.boardSheetId, boardSheet.id),
            eq(dailyBoardSheetPost.entryDate, job.entryDate),
          ),
        )

      console.log('daily board sheet post loaded', {
        boardSheetId: boardSheet.id,
        boardKey: boardSheet.boardKey,
        stubCount: boardSheet.stubs.length,
        entryDate: job.entryDate,
        newMessage,
        entryId: entryIdResponse,
      })

      message.ack()
    }
  },
}
