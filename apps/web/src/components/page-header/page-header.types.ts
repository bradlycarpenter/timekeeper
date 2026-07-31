import type { ReactNode } from 'react'

export type PageHeaderRootProps = {
  children: ReactNode
}

export type PageHeaderTitleProps = {
  heading: string
  description?: string
}

export type PageHeaderActionProps = {
  children: ReactNode
}
