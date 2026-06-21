import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './db.schema.js'

export const db = drizzle(process.env.DB_FILE_NAME ?? 'sqlite.db', {
  schema,
})
