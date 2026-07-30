import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { Errors } from '@tk/domain'
import { Context, Effect, Layer, Option } from 'effect'
import { Bindings, type Env } from './Bindings.ts'
import { createDb } from './db.init.js'

/** better-auth owns the user, session and account tables and stays on drizzle,
 * which is the adapter it ships. Everything Timekeeper writes itself goes
 * through SqlClient instead. */
const makeBetterAuth = (env: Env) =>
  betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',').map((origin) =>
      origin.trim(),
    ) ?? [env.BETTER_AUTH_URL],
    database: drizzleAdapter(createDb(env.DB), {
      provider: 'sqlite',
    }),
    socialProviders: {
      microsoft: {
        clientId: env.MICROSOFT_CLIENT_ID,
        clientSecret: env.MICROSOFT_CLIENT_SECRET,
        tenantId: env.MICROSOFT_TENANT_ID,
      },
      atlassian: {
        clientId: env.ATLASSIAN_CLIENT_ID,
        clientSecret: env.ATLASSIAN_CLIENT_SECRET,
        scope: ['read:jira-user', 'read:jira-work', 'read:me', 'read:account'],
      },
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['atlassian'],
      },
    },
  })

export type SessionUser = {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly image?: string
}

export class Auth extends Context.Service<
  Auth,
  {
    readonly handler: (request: Request) => Effect.Effect<Response>
    readonly session: (
      headers: Headers,
    ) => Effect.Effect<Option.Option<SessionUser>>
    /** Mints a currently-valid Atlassian token, refreshing it when it is close
     * to expiry. Passing no headers is what lets the scheduled run act for a
     * user who has no live session. */
    readonly jiraToken: (
      userId: string,
    ) => Effect.Effect<string, Errors.BoardNotConnected>
  }
>()('tk/Auth') {}

export const AuthLive = Layer.effect(
  Auth,
  Effect.gen(function* () {
    const env = yield* Bindings
    const auth = makeBetterAuth(env)

    return {
      handler: (request) =>
        Effect.tryPromise(() => auth.handler(request)).pipe(
          Effect.catchCause((cause) =>
            Effect.logError('better-auth handler failed', cause).pipe(
              Effect.as(
                new Response(
                  JSON.stringify({ error: 'Authentication error' }),
                  {
                    status: 500,
                    headers: { 'content-type': 'application/json' },
                  },
                ),
              ),
            ),
          ),
        ),

      session: (headers) =>
        Effect.tryPromise(() => auth.api.getSession({ headers })).pipe(
          Effect.map((session) =>
            session?.user
              ? Option.some<SessionUser>({
                  id: session.user.id,
                  name: session.user.name,
                  email: session.user.email,
                  ...(session.user.image ? { image: session.user.image } : {}),
                })
              : Option.none(),
          ),
          Effect.catchCause((cause) =>
            Effect.logWarning('session lookup failed', cause).pipe(
              Effect.as(Option.none()),
            ),
          ),
        ),

      jiraToken: (userId) =>
        Effect.tryPromise(() =>
          auth.api.getAccessToken({
            body: { providerId: 'atlassian', userId },
          }),
        ).pipe(
          Effect.flatMap((result) =>
            result.accessToken
              ? Effect.succeed(result.accessToken)
              : Effect.fail(new Errors.BoardNotConnected()),
          ),
          Effect.catchCause((cause) =>
            Effect.logInfo('no usable atlassian token', cause).pipe(
              Effect.andThen(Effect.fail(new Errors.BoardNotConnected())),
            ),
          ),
        ),
    }
  }),
)
