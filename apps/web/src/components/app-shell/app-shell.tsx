import { Link } from '@tanstack/react-router'
import { LogOut, TimerIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import type {
  AppShellAccountProps,
  AppShellContentProps,
  AppShellHeaderProps,
  AppShellNavFooterProps,
  AppShellNavItemProps,
  AppShellNavProps,
  AppShellRootProps,
} from './app-shell.types.ts'

const AppShellRoot = (props: AppShellRootProps) => (
  <div className="bg-background flex min-h-dvh flex-col md:flex-row">
    {props.children}
  </div>
)

/** Phones only. On wider screens the brand moves into the rail and the account
 * moves into `NavFooter`, so this whole bar disappears rather than duplicating
 * the rail. Anything placed here must have a rail counterpart or it becomes
 * unreachable on desktop. */
const AppShellHeader = (props: AppShellHeaderProps) => (
  <header className="bg-background/80 sticky top-0 z-20 flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3 backdrop-blur md:hidden">
    <Link to="/today" className="flex items-center gap-1.5">
      <TimerIcon className="text-primary size-6" />
      <span className="text-lg leading-none font-semibold tracking-tight">
        Time<span className="text-primary">keeper</span>
      </span>
    </Link>
    {props.children}
  </header>
)

const AppShellAccount = (props: AppShellAccountProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        aria-label="Account"
      >
        <Avatar className="size-8">
          {props.image ? <AvatarImage src={props.image} alt="" /> : null}
          <AvatarFallback>
            {props.name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuLabel className="flex flex-col gap-0.5">
        <span className="truncate">{props.name}</span>
        <span className="text-muted-foreground truncate text-xs font-normal">
          {props.email}
        </span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={props.onSignOut}>
        <LogOut className="size-4" />
        Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)

/** Gutters, vertical rhythm and tab-bar clearance only. The measure belongs to
 * the page: a table and a settings form do not want the same width, and capping
 * everything here is what left desktop with one narrow column. See PageLayout.
 *
 * Bottom padding leaves room for the tab bar, which floats over the content on
 * phones. */
const AppShellContent = (props: AppShellContentProps) => (
  <main className="flex-1 px-4 py-5 pb-24 md:px-8 md:py-8 md:pb-8">
    {props.children}
  </main>
)

const AppShellNav = (props: AppShellNavProps) => (
  <nav
    aria-label="Main"
    className="bg-background/95 fixed inset-x-0 bottom-0 z-20 flex shrink-0 justify-around border-t px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:h-dvh md:w-60 md:flex-col md:justify-start md:gap-1 md:border-t-0 md:border-r md:p-4 md:pt-6"
  >
    <Link
      to="/today"
      className="mb-6 hidden items-center gap-1.5 px-2 md:flex"
    >
      <TimerIcon className="text-primary size-7" />
      <span className="text-xl leading-none font-semibold tracking-tight">
        Time<span className="text-primary">keeper</span>
      </span>
    </Link>
    {props.children}
  </nav>
)

const AppShellNavItem = (props: AppShellNavItemProps) => (
  <Link
    to={props.to}
    className="text-muted-foreground data-[status=active]:text-primary data-[status=active]:md:bg-accent data-[status=active]:md:text-accent-foreground flex min-w-16 flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[0.6875rem] font-medium transition-colors md:flex-row md:gap-3 md:px-3 md:py-2.5 md:text-sm"
  >
    {props.icon}
    <span>{props.label}</span>
  </Link>
)

/** The rail's counterpart to the phone header: the account lives here on wider
 * screens, where the header is hidden. Collapsed on phones, where the tab bar
 * has no room for it and the header carries it instead. */
const AppShellNavFooter = (props: AppShellNavFooterProps) => (
  <div className="mt-auto hidden border-t pt-3 md:block">{props.children}</div>
)

export const AppShell = {
  Root: AppShellRoot,
  Header: AppShellHeader,
  Account: AppShellAccount,
  Content: AppShellContent,
  Nav: AppShellNav,
  NavItem: AppShellNavItem,
  NavFooter: AppShellNavFooter,
}
