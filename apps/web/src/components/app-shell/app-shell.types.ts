import type { ReactNode } from 'react'
import type { LinkProps } from '@tanstack/react-router'

export type AppShellRootProps = {
  children: ReactNode
}

export type AppShellHeaderProps = {
  children?: ReactNode
}

export type AppShellAccountProps = {
  name: string
  email: string
  image?: string | undefined
  onSignOut: () => void
}

export type AppShellContentProps = {
  children: ReactNode
}

export type AppShellNavProps = {
  children: ReactNode
}

export type AppShellNavItemProps = {
  to: LinkProps['to']
  label: string
  icon: ReactNode
}

export type AppShellNavFooterProps = {
  children?: ReactNode
}
