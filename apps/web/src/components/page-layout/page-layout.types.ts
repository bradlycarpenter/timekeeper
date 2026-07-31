import type { ReactNode } from 'react'

export type PageLayoutRootProps = {
  /** `reading` caps at the 48rem measure most screens want. `wide` opens to
   * 64rem for genuinely tabular content, where columns beat a short line. */
  width?: 'reading' | 'wide'
  children: ReactNode
}

export type PageLayoutSplitProps = {
  children: ReactNode
}

export type PageLayoutMainProps = {
  children: ReactNode
}

export type PageLayoutAsideProps = {
  children: ReactNode
}
