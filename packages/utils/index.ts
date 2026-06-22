import { z } from 'zod'

export const responseParseOrThrow = async <T extends z.ZodType>({
  res,
  schema,
  name,
}: {
  res: Response
  schema: T
  name: string
}): Promise<z.infer<T>> => {
  if (!res.ok) {
    const body = await res.text()
    throw new Error(
      `Error getting ${name}: ${res.status} ${res.statusText} for ${res.url}, body: ${body || '<empty>'}`,
    )
  }
  const json = await res.json()
  try {
    return schema.parse(json)
  } catch (e) {
    console.error(e)
    throw new Error(`Error parsing ${name}, e: ${e}`)
  }
}
