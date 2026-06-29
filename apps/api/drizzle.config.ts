import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'drizzle-kit'

const getLocalD1 = () => {
  const basePath = path.resolve('.wrangler')
  const dbFile = fs
    .readdirSync(basePath, { encoding: 'utf-8', recursive: true })
    .filter((file) => file.endsWith('.sqlite'))
    .filter((file) => !file.endsWith('metadata.sqlite'))
    .sort((a, b) => {
      const aStat = fs.statSync(path.resolve(basePath, a))
      const bStat = fs.statSync(path.resolve(basePath, b))
      return bStat.mtimeMs - aStat.mtimeMs
    })[0]

  if (!dbFile) {
    throw new Error(`.sqlite file not found in ${basePath}`)
  }

  return path.resolve(basePath, dbFile)
}

export default defineConfig({
  out: './migrations',
  schema: './src/db.schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DB_FILE_NAME ?? getLocalD1(),
  },
})
