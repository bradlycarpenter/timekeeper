import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createDb } from './db.init.js'

export type AuthEnv = {
  DB: D1Database
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  BETTER_AUTH_TRUSTED_ORIGINS?: string
  MICROSOFT_CLIENT_ID: string
  MICROSOFT_CLIENT_SECRET?: string
  MICROSOFT_TENANT_ID?: string
  ATLASSIAN_CLIENT_ID: string
  ATLASSIAN_CLIENT_SECRET?: string
}

export const createAuth = (env: AuthEnv) =>
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
