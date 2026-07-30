import { Link } from '@tanstack/react-router'
import { TimerIcon } from 'lucide-react'
import type {
  LegalPageBodyProps,
  LegalPageRootProps,
  LegalPageSectionProps,
  LegalPageTitleProps,
} from './legal-page.types.ts'

const FOOTER_LINKS = [
  { to: '/privacy', label: 'Privacy policy' },
  { to: '/terms', label: 'Terms of service' },
  { to: '/support', label: 'Support' },
] as const

const LegalPageRoot = (props: LegalPageRootProps) => (
  <div className="flex min-h-dvh flex-col">
    <header className="border-b px-6 py-4">
      <div className="mx-auto flex max-w-[70ch] items-center gap-2">
        <Link to="/" className="flex items-center gap-2">
          <TimerIcon className="text-primary size-6" />
          <span className="text-lg font-semibold tracking-tight">
            Time<span className="text-primary">keeper</span>
          </span>
        </Link>
      </div>
    </header>

    <main className="mx-auto w-full max-w-[70ch] flex-1 px-6 py-10">
      {props.children}
    </main>

    <footer className="border-t px-6 py-6">
      <nav className="mx-auto flex max-w-[70ch] flex-wrap gap-4">
        {FOOTER_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="text-muted-foreground text-sm hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  </div>
)

const LegalPageTitle = (props: LegalPageTitleProps) => (
  <div className="mb-8">
    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
      {props.heading}
    </h1>
    <p className="text-muted-foreground mt-2 text-sm">
      Last updated: {props.updated}
    </p>
  </div>
)

const LegalPageSection = (props: LegalPageSectionProps) => (
  <section className="mt-8">
    <h2 className="text-lg font-semibold tracking-tight">{props.heading}</h2>
    <div className="mt-2">{props.children}</div>
  </section>
)

const LegalPageBody = (props: LegalPageBodyProps) => (
  <div className="space-y-3 text-[0.9375rem] leading-relaxed">
    {props.paragraphs.map((paragraph) => (
      <p key={paragraph} className="text-foreground/90">
        {paragraph}
      </p>
    ))}
    {props.list ? (
      <ul className="list-disc space-y-1 pl-5 text-foreground/90">
        {props.list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    ) : null}
  </div>
)

export const LegalPage = {
  Root: LegalPageRoot,
  Title: LegalPageTitle,
  Section: LegalPageSection,
  Body: LegalPageBody,
}
