import type { ReactNode } from 'react'

export type ConnectionState = 'connected' | 'disconnected' | 'stale'

export type ConnectionRootProps = {
  children: ReactNode
}

export type ConnectionHeadingProps = {
  name: string
  role: string
  description: string
  logo: ReactNode
}

export type ConnectionStatusProps = {
  state: ConnectionState
  detail?: string | undefined
}

export type ConnectionActionsProps = {
  children: ReactNode
}
